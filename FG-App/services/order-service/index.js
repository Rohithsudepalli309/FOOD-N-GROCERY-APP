require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { ORDER_STATUS, KAFKA_TOPICS } = require('../../shared/constants/index.js');
const { calculateOrderTotal } = require('../../shared/utils/index.js');
const { query } = require('../../shared/utils/db.js');
const { publishEvent } = require('../../shared/utils/kafka.js');
const { getClient } = require('../../shared/utils/redis.js');
const { createLogger } = require('../../shared/utils/logger.js');

const logger = createLogger('order-service');
const app = express();
app.use(cors()); app.use(express.json());

// ── State Machine ──────────────────────────────────────────────────────────
const VALID_TRANSITIONS = {
  placed:         ['confirmed', 'rejected', 'cancelled'],
  confirmed:      ['preparing', 'cancelled'],
  preparing:      ['ready'],
  ready:          ['rider_assigned'],
  rider_assigned: ['picked_up'],
  picked_up:      ['on_the_way'],
  on_the_way:     ['nearby', 'delivered'],
  nearby:         ['delivered'],
  delivered:      [],
  rejected:       [],
  cancelled:      [],
};

function canTransition(currentStatus, newStatus) {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

// ── Endpoints ──────────────────────────────────────────────────────────────

// ── Surge Pricing Engine ───────────────────────────────────────────────────
app.get('/api/pricing/surge', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat/lng required for surge calculation' });

  try {
    const redis = getClient();
    
    // 1. Demand: Active orders in the last hour
    const { rows: demandRows } = await query(`
      SELECT COUNT(*) FROM orders 
      WHERE created_at >= NOW() - INTERVAL '1 hour' 
      AND status NOT IN ('delivered', 'cancelled', 'rejected')
    `);
    const activeOrders = parseInt(demandRows[0].count);

    // 2. Supply: Available riders within 5km radius
    const ridersNearby = await redis.georadius('rider:locations', lng, lat, 5, 'km');
    const supply = Math.max(ridersNearby.length, 1); // Avoid division by zero

    // 3. Algorithm: Demand Supply Ratio
    const ratio = activeOrders / supply;
    let surgeMultiplier = 1.0;

    if (ratio >= 5) surgeMultiplier = 1.5;
    else if (ratio >= 3) surgeMultiplier = 1.25;
    else if (ratio >= 2) surgeMultiplier = 1.1;

    // 4. Time of Day factor (e.g., Dinner Rush)
    const hour = new Date().getHours();
    if (hour >= 19 && hour <= 21) {
      surgeMultiplier = Math.max(surgeMultiplier, 1.2);
    }

    // Cache surge rate for 60 seconds
    const cacheKey = `surge_rate:${Math.round(lat)}:${Math.round(lng)}`;
    await redis.setex(cacheKey, 60, surgeMultiplier);

    res.json({ multiplier: surgeMultiplier, activeOrders, supplyNearby: supply });
  } catch (err) {
    logger.error('Surge calculation failed', { error: err.message });
    res.json({ multiplier: 1.0 }); // Fallback to 1x on error
  }
});

// POST /api/orders — Create order
app.post('/api/orders', async (req, res) => {
  const { customerId, restaurantId, items, address, surgeMultiplier = 1 } = req.body;

  if (!customerId || !restaurantId || !items?.length) {
    return res.status(400).json({ error: 'Missing required fields: customerId, restaurantId, items' });
  }

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const pricing = calculateOrderTotal({ subtotal, surgeMultiplier });

  const id = uuidv4();
  const orderId = 'FG' + Date.now().toString().slice(-8); // Short user-facing ID
  const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

  try {
    await query('BEGIN');
    
    const orderRes = await query(
      `INSERT INTO orders (id, customer_id, restaurant_id, status, total_amount, delivery_address, otp) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, customerId, restaurantId, ORDER_STATUS.PLACED, pricing.total, address, otp]
    );

    // In a full implementation, we would insert into order_items here
    // For this prototype, we'll store the items array directly in the payload
    
    await query('COMMIT');

    const orderObj = { 
      ...orderRes.rows[0], 
      orderId, // attach short ID
      items,   // attach items list
      ...pricing, 
      surgeMultiplier 
    };

    // Publish to real Kafka broker
    await publishEvent(KAFKA_TOPICS.ORDER_PLACED, orderObj.id, orderObj);
    logger.info(`Created ${orderId} for restaurant ${restaurantId}`, { orderId, restaurantId });

    // Auto-Cancel Fallback: If not confirmed within 90 seconds, auto-cancel
    setTimeout(async () => {
      try {
        const checkRes = await query('SELECT status FROM orders WHERE id::text = $1', [id]);
        if (checkRes.rows.length && checkRes.rows[0].status === ORDER_STATUS.PLACED) {
          logger.warn(`90s timeout reached for ${orderId}. Cancelling.`, { orderId });
          await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id::text = $2', [ORDER_STATUS.CANCELLED, id]);
          
          await publishEvent(KAFKA_TOPICS.ORDER_CANCELLED, id, { ...orderObj, status: ORDER_STATUS.CANCELLED, reason: 'Auto-cancelled due to timeout' });
          
          // Trigger the refund saga
          await publishEvent('refund_required', id, {
            orderId: id,
            customerId,
            amount: pricing.total,
            reason: 'Restaurant failed to accept within 90s'
          });
        }
      } catch (e) {
        logger.error(`Auto-Cancel Failed to run for ${orderId}`, { error: e.message, orderId });
      }
    }, 90000); // 90 seconds
    
    res.status(201).json({ success: true, order: orderObj });
  } catch (err) {
    await query('ROLLBACK');
    logger.error('Failed to create order', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Database transaction failed' });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', async (req, res) => {
  try {
    // Note: in PG, uuid must be compared carefully, but for brevity we use parameter binding
    const { rows } = await query('SELECT * FROM orders WHERE id::text = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', async (req, res) => {
  const { status, riderId, reason } = req.body;
  
  try {
    const { rows } = await query('SELECT * FROM orders WHERE id::text = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    
    const order = rows[0];

    if (!canTransition(order.status, status)) {
      return res.status(409).json({
        error: `Cannot transition from '${order.status}' to '${status}'`,
        allowed: VALID_TRANSITIONS[order.status],
      });
    }

    let updateQ = 'UPDATE orders SET status = $1, updated_at = NOW()';
    const params = [status];
    if (riderId) { 
      updateQ += ', rider_id = $2'; 
      params.push(riderId); 
    }
    updateQ += ` WHERE id::text = $${params.length + 1} RETURNING *`;
    params.push(req.params.id);

    const updated = await query(updateQ, params);
    const newOrder = updated.rows[0];

    // Emit appropriate Kafka event
    const topicMap = {
      delivered: KAFKA_TOPICS.ORDER_DELIVERED,
      picked_up: KAFKA_TOPICS.ORDER_PICKED_UP,
      rejected:  KAFKA_TOPICS.ORDER_REJECTED,
      cancelled: KAFKA_TOPICS.ORDER_CANCELLED,
    };
    if (topicMap[status]) await publishEvent(topicMap[status], newOrder.id, newOrder);
    
    // Always emit general status update event
    await publishEvent('order_status_updated', newOrder.id, newOrder);

    res.json({ success: true, order: newOrder });
  } catch (err) {
    logger.error('Failed to update status', { error: err.message, orderId: req.params.id, status });
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /api/orders/customer/:customerId
app.get('/api/orders/customer/:customerId', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM orders WHERE customer_id::text = $1 ORDER BY created_at DESC', [req.params.customerId]);
    res.json({ orders: rows });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/orders/restaurant/:restaurantId
app.get('/api/orders/restaurant/:restaurantId', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT * FROM orders 
      WHERE restaurant_id::text = $1 AND status NOT IN ('delivered', 'rejected', 'cancelled') 
      ORDER BY created_at DESC
    `, [req.params.restaurantId]);
    res.json({ orders: rows });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/orders/health', async (_, res) => {
  try {
    const { rows } = await query('SELECT COUNT(*) FROM orders');
    res.json({ service: 'order-service', status: 'ok', db: 'connected', orderCount: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ service: 'order-service', status: 'error', db: 'disconnected' });
  }
});

// ── Saga Coordinator ─────────────────────────────────────────────────────────
async function initSagaCoordinator() {
  await connectConsumer('order-saga-coordinator', [KAFKA_TOPICS.ORDER_REJECTED, 'no_rider_available'], async (topic, message) => {
    try {
      const orderData = JSON.parse(message.value.toString());
      logger.info(`Saga caught ${topic} for Order ${orderData.id}`);

      // Ensure state is updated to cancelled automatically
      if (orderData.status !== ORDER_STATUS.CANCELLED && orderData.status !== ORDER_STATUS.REJECTED) {
        await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id::text = $2', [ORDER_STATUS.CANCELLED, orderData.id]);
        logger.info(`Saga transitioned Order ${orderData.id} to cancelled`);
      }

      // Step 2: Trigger compensation transaction (Refund)
      const refundPayload = {
        orderId: orderData.id,
        customerId: orderData.customer_id,
        amount: orderData.total_amount,
        reason: topic === KAFKA_TOPICS.ORDER_REJECTED ? 'Restaurant declined' : 'No riders nearby',
      };
      
      await publishEvent('refund_required', orderData.id, refundPayload);
      logger.info(`Saga emitted refund_required for Order ${orderData.id}`, { amount: refundPayload.amount });

    } catch (err) {
      logger.error('Saga Coordinator Failed processing event', { error: err.message });
    }
  });
}

const PORT = process.env.PORT || 3003;
app.listen(PORT, async () => {
  logger.info(`📋 Order Service on port ${PORT}`);
  await initSagaCoordinator();
});

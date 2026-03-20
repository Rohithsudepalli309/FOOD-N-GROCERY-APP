/**
 * Analytics Service — Real PostgreSQL aggregations + Redis surge cache
 * Port: 3009
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createLogger } = require('../../shared/utils/logger.js');
const { query } = require('../../shared/utils/db.js');
const { redis } = require('../../shared/utils/redis.js');
const { connectConsumer } = require('../../shared/utils/kafka.js');

const logger = createLogger('analytics-service');
const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || false }));
app.use(express.json());

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, max: 30,
  standardHeaders: true, legacyHeaders: false,
});
app.use('/api/analytics', analyticsLimiter);

// ── Dashboard — Real DB aggregations ───────────────────────────────────────
app.get('/api/analytics/dashboard', async (req, res) => {
  const { restaurantId } = req.query;
  const cacheKey = `analytics:dashboard:${restaurantId || 'all'}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const filter = restaurantId ? `WHERE restaurant_id = $1` : '';
    const params = restaurantId ? [restaurantId] : [];

    const [orderStats, revenueStats, topRestaurants, topDishes, realtimeOrders] = await Promise.all([
      query(`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')  AS orders_today,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS orders_week,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS orders_month,
          AVG(EXTRACT(EPOCH FROM (delivered_at - created_at))/60) FILTER (WHERE status='delivered') AS avg_delivery_min
        FROM orders ${filter}
      `, params),

      query(`
        SELECT
          COALESCE(SUM(total) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day'), 0)  AS revenue_today,
          COALESCE(SUM(total) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'), 0) AS revenue_week,
          COALESCE(SUM(total) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) AS revenue_month
        FROM orders WHERE status = 'delivered' ${restaurantId ? 'AND restaurant_id = $1' : ''}
      `, params),

      query(`
        SELECT r.name, COUNT(o.id) AS order_count
        FROM orders o JOIN restaurants r ON o.restaurant_id = r.id
        WHERE o.created_at >= NOW() - INTERVAL '7 days' AND o.status = 'delivered'
        GROUP BY r.name ORDER BY order_count DESC LIMIT 5
      `),

      query(`
        SELECT mi.name, COUNT(oi.id) AS order_count
        FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY mi.name ORDER BY order_count DESC LIMIT 5
      `),

      query(`SELECT COUNT(*) AS count FROM orders WHERE status IN ('pending','confirmed','preparing','out_for_delivery')`),
    ]);

    const stats = {
      ordersToday:    parseInt(orderStats.rows[0].orders_today),
      ordersWeek:     parseInt(orderStats.rows[0].orders_week),
      ordersMonth:    parseInt(orderStats.rows[0].orders_month),
      avgDeliveryMin: Math.round(parseFloat(orderStats.rows[0].avg_delivery_min) || 32),
      revenueToday:   parseFloat(revenueStats.rows[0].revenue_today),
      revenueWeek:    parseFloat(revenueStats.rows[0].revenue_week),
      revenueMonth:   parseFloat(revenueStats.rows[0].revenue_month),
      topRestaurants: topRestaurants.rows.map(r => r.name),
      topDishes:      topDishes.rows.map(d => d.name),
      realtimeOrders: parseInt(realtimeOrders.rows[0].count),
      restaurantId:   restaurantId || 'all',
      timestamp:      new Date().toISOString(),
    };

    await redis.set(cacheKey, JSON.stringify(stats), 'EX', 60); // 1 min cache
    res.json(stats);
  } catch (err) {
    logger.error('Dashboard query failed:', err.message);
    res.status(500).json({ error: 'Analytics unavailable' });
  }
});

// ── Heatmap — Real order location density ──────────────────────────────────
app.get('/api/analytics/heatmap', async (req, res) => {
  try {
    const cached = await redis.get('analytics:heatmap');
    if (cached) return res.json(JSON.parse(cached));

    const result = await query(`
      SELECT
        ST_Y(r.location::geometry) AS lat,
        ST_X(r.location::geometry) AS lng,
        COUNT(o.id) AS order_count
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.created_at >= NOW() - INTERVAL '3 hours'
      GROUP BY r.id, r.location
    `);

    const heatmap = result.rows.map(row => ({
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      orderCount: parseInt(row.order_count),
      intensity: Math.min(1, parseInt(row.order_count) / 30),
    }));

    const payload = { heatmap, updatedAt: new Date().toISOString() };
    await redis.set('analytics:heatmap', JSON.stringify(payload), 'EX', 120);
    res.json(payload);
  } catch (err) {
    logger.error('Heatmap failed:', err.message);
    res.status(500).json({ error: 'Heatmap unavailable' });
  }
});

// ── Surge — Read live value calculated by surgeWorker.js ──────────────────
app.get('/api/analytics/surge', async (req, res) => {
  try {
    const raw = await redis.get('surge_pricing');
    const surge = raw ? JSON.parse(raw) : { multiplier: 1.0, reason: 'normal', activeOrders: 0, activeRiders: 0 };
    res.json({ ...surge, restaurantId: req.query.restaurantId || 'all' });
  } catch (err) {
    res.json({ multiplier: 1.0, reason: 'normal' });
  }
});

// ── Event ingestion (for Kafka-sourced events) ─────────────────────────────
app.post('/api/analytics/events', async (req, res) => {
  const { type, total, restaurantId } = req.body;
  logger.info('Analytics event received', { type, restaurantId });

  // Invalidate dashboard cache on new delivery
  if (type === 'order_delivered') {
    await redis.del(`analytics:dashboard:${restaurantId || 'all'}`);
    await redis.del('analytics:dashboard:all');
  }
  res.json({ success: true });
});

app.get('/api/analytics/health', async (_, res) => {
  try {
    await query('SELECT 1');
    res.json({ service: 'analytics-service', status: 'ok', source: 'postgresql' });
  } catch (err) {
    res.status(500).json({ service: 'analytics-service', status: 'error' });
  }
});

// ── Kafka: listen for order events to invalidate cache ─────────────────────
async function initAnalyticsConsumer() {
  try {
    await connectConsumer('analytics-worker', ['order_delivered', 'order_placed'], async (topic, message) => {
      const data = JSON.parse(message.value.toString());
      await redis.del(`analytics:dashboard:${data.restaurantId || 'all'}`);
      await redis.del('analytics:dashboard:all');
      logger.info('Analytics cache invalidated on order event', { topic, orderId: data.orderId });
    });
  } catch (err) {
    logger.warn('Analytics Kafka consumer unavailable', { error: err.message });
  }
}

const PORT = process.env.PORT || 3009;
app.listen(PORT, async () => {
  logger.info(`📊 Analytics Service on port ${PORT} (PostgreSQL-backed)`);
  await initAnalyticsConsumer();
});

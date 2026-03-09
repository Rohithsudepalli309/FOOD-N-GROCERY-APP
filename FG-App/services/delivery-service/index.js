require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { haversineKm, scoreRider } = require('../../shared/utils/index.js');
const { createLogger } = require('../../shared/utils/logger.js');
const { RIDER_ASSIGNMENT, KAFKA_TOPICS } = require('../../shared/constants/index.js');
const { redis } = require('../../shared/utils/redis.js');
const { createConsumer, publishEvent } = require('../../shared/utils/kafka.js');

const logger = createLogger('delivery-service');
const app = express();
app.use(cors()); app.use(express.json());

const REDIS_KEYS = {
  GEO: 'riders:geo',           // Stores rider lat/lng
  DATA: 'riders:data:',        // rider:data:{id} -> JSON
  ASSIGNMENT: 'assignment:',   // assignment:{orderId} -> riderId
};

// ── Kafka Consumer for new orders ──────────────────────────────────────────
async function initKafka() {
  await createConsumer('delivery-service-group', [KAFKA_TOPICS.ORDER_PLACED], async (topic, order) => {
    logger.info(`Received new order ${order.orderId}, finding rider...`);
    await assignRiderToOrder(order);
  });
}
initKafka().catch(err => logger.error('Kafka init failed', { error: err.message }));

// ── Core Assignment Logic (using Redis GEO) ────────────────────────────────
async function assignRiderToOrder(order) {
  const { pickupLat, pickupLng } = order.address || order.delivery_address || {};
  if (!pickupLat || !pickupLng) return;

  // 1. Redis GEORADIUS: Find riders within X km
  // Returns array of [member_name, distance]
  const radiusResults = await redis.georadius(
    REDIS_KEYS.GEO, pickupLng, pickupLat, 
    RIDER_ASSIGNMENT.SEARCH_RADIUS_KM, 'km', 
    'WITHDIST', 'ASC'
  );

  if (!radiusResults.length) {
    logger.info(`No riders in ${RIDER_ASSIGNMENT.SEARCH_RADIUS_KM}km for ${order.orderId}`);
    return;
  }

  // 2. Fetch rider details from Redis to check availability
  const candidates = [];
  for (const [riderId, distStr] of radiusResults) {
    const dataStr = await redis.get(REDIS_KEYS.DATA + riderId);
    if (!dataStr) continue;
    
    const rider = JSON.parse(dataStr);
    if (rider.status === 'online' && rider.available && !rider.currentOrderId) {
      const distKm = parseFloat(distStr);
      candidates.push({ ...rider, distKm, score: scoreRider(rider, distKm) });
    }
  }

  if (!candidates.length) return;

  // 3. Sort by our custom Swiggy-like exact score descending
  candidates.sort((a, b) => b.score - a.score);

  // 4. Ping top N riders simultaneously (Here we auto-assign the best one for prototype)
  const assigned = candidates[0];
  
  // Update Rider state in Redis
  assigned.available = false;
  assigned.currentOrderId = order.orderId;
  await redis.set(REDIS_KEYS.DATA + assigned.id, JSON.stringify(assigned));
  
  // Save assignment mapping
  await redis.set(REDIS_KEYS.ASSIGNMENT + order.orderId, assigned.id);

  logger.info(`✨ ${assigned.name} assigned to ${order.orderId}`, { distanceKm: assigned.distKm });

  // Publish event back to order-service
  await publishEvent('rider_assigned', order.id, {
    orderId: order.orderId,
    riderId: assigned.id,
    distanceKm: assigned.distKm,
    name: assigned.name,
    vehicle: assigned.vehicleNumber
  });
}

// ── Endpoints ──────────────────────────────────────────────────────────────

// PATCH /api/delivery/riders/:id/location
app.patch('/api/delivery/riders/:id/location', async (req, res) => {
  const { lat, lng } = req.body;
  const riderId = req.params.id;

  try {
    // 1. Update GEO Key
    await redis.geoadd(REDIS_KEYS.GEO, lng, lat, riderId);
    
    // 2. Update JSON Data
    const ex = await redis.get(REDIS_KEYS.DATA + riderId);
    const rider = ex ? JSON.parse(ex) : { id: riderId, available: true, status: 'online' };
    rider.lat = lat; 
    rider.lng = lng;
    rider.lastSeen = Date.now();
    await redis.set(REDIS_KEYS.DATA + riderId, JSON.stringify(rider));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'GEO map update failed' });
  }
});

// GET /api/delivery/riders/nearby
app.get('/api/delivery/riders/nearby', async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;
  try {
    const results = await redis.georadius(REDIS_KEYS.GEO, lng, lat, radius, 'km', 'WITHDIST', 'ASC');
    res.json({ riders: results.map(([id, dist]) => ({ id, distKm: parseFloat(dist) })) });
  } catch (err) {
    res.status(500).json({ error: 'GEO search failed' });
  }
});

// GET /api/delivery/orders/:orderId/eta
app.get('/api/delivery/orders/:orderId/eta', async (req, res) => {
  try {
    const riderId = await redis.get(REDIS_KEYS.ASSIGNMENT + req.params.orderId);
    if (!riderId) return res.status(404).json({ error: 'No rider for this order' });

    const str = await redis.get(REDIS_KEYS.DATA + riderId);
    const rider = JSON.parse(str);
    
    res.json({ etaMinutes: 15, riderId, riderLocation: { lat: rider.lat, lng: rider.lng } });
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Seed data route for testing
app.post('/api/delivery/seed', async (req, res) => {
  const DEMO_RIDERS = [
    { id: 'r1', name: 'Rahul Sharma', rating: 4.8, totalDeliveries: 1340, vehicle: 'bike', vehicleNumber: 'DL01A1234', status: 'online', available: true, lat: 28.6280, lng: 77.3649, acceptanceRate: 0.95 },
    { id: 'r2', name: 'Amit Kumar', rating: 4.6, totalDeliveries: 890, vehicle: 'bike', vehicleNumber: 'DL02C5678', status: 'online', available: true, lat: 28.6302, lng: 77.3701, acceptanceRate: 0.88 },
  ];
  try {
    for (const r of DEMO_RIDERS) {
      await redis.geoadd(REDIS_KEYS.GEO, r.lng, r.lat, r.id);
      await redis.set(REDIS_KEYS.DATA + r.id, JSON.stringify(r));
    }
    res.json({ success: true, seeded: DEMO_RIDERS.length });
  } catch (err) { res.status(500).json({ error: 'Seed failed' }) }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => logger.info(`🛵 Delivery Service on port ${PORT}`));

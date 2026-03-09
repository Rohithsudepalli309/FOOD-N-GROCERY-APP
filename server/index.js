/**
 * F&G Real-Time Backend Server
 * Socket.IO + Express + Redis (mock) + Kafka (mock) + Rider Simulator
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const MockRedis = require('./services/mockRedis');
const MockKafka = require('./services/mockKafka');
const RiderSimulator = require('./services/riderSimulator');
const SearchService = require('./services/searchService');
const PricingEngine = require('./services/pricingEngine');

const app = express();
const server = http.createServer(app);

// ── Socket.IO ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Services ───────────────────────────────────────────────────────────────
const redis = new MockRedis();
const kafka = new MockKafka();
const riderSim = new RiderSimulator(io, redis);
const search = new SearchService();
const pricing = new PricingEngine(redis);

// ── In-memory State ────────────────────────────────────────────────────────
const orders = new Map();        // orderId → order object
const restaurantSockets = new Map(); // restaurantId → socketId
const customerSockets = new Map();   // customerId → socketId

// ── Order Status Flow ──────────────────────────────────────────────────────
const ORDER_STATUSES = [
  'placed', 'confirmed', 'preparing', 'ready', 'rider_assigned',
  'picked_up', 'on_the_way', 'nearby', 'delivered',
];

// ── Kafka Consumer — processes order events ────────────────────────────────
kafka.subscribe('order_placed', async (event) => {
  const { orderId, restaurantId, customerId } = event;
  console.log(`[KAFKA] order_placed → ${orderId}`);

  // Step 2: Notify restaurant
  const restSocket = restaurantSockets.get(restaurantId) || null;
  if (restSocket) {
    io.to(restSocket).emit('new_order', event);
  }
  // Broadcast to restaurant room
  io.to(`restaurant:${restaurantId}`).emit('new_order', event);
  io.to(`order:${orderId}`).emit('order_update', { status: 'placed', orderId });

  // Auto-accept after 5s in dev mode (simulate restaurant accepting)
  setTimeout(() => {
    kafka.publish('order_accepted', { orderId, restaurantId, customerId, prepTimeMinutes: 15 });
  }, 5000);
});

kafka.subscribe('order_accepted', async (event) => {
  const { orderId, restaurantId, prepTimeMinutes } = event;
  console.log(`[KAFKA] order_accepted → ${orderId}`);
  updateOrderStatus(orderId, 'confirmed', { prepTimeMinutes });

  // Step 5: Find nearest rider (after prep) — assign immediately in dev
  setTimeout(async () => {
    updateOrderStatus(orderId, 'preparing', {});
    const rider = await riderSim.findNearestRider(restaurantId);
    if (rider) {
      setTimeout(() => assignRider(orderId, rider), 3000);
    }
  }, 3000);
});

kafka.subscribe('rider_assigned', async (event) => {
  const { orderId, rider } = event;
  console.log(`[KAFKA] rider_assigned → ${orderId} → rider ${rider.id}`);
  updateOrderStatus(orderId, 'rider_assigned', { rider });
  riderSim.startRiderRoute(rider.id, orderId, io);
});

kafka.subscribe('order_picked_up', (event) => {
  const { orderId } = event;
  console.log(`[KAFKA] order_picked_up → ${orderId}`);
  updateOrderStatus(orderId, 'picked_up', {});
  setTimeout(() => updateOrderStatus(orderId, 'on_the_way', {}), 8000);
  setTimeout(() => updateOrderStatus(orderId, 'nearby', {}), 18000);
  setTimeout(() => {
    updateOrderStatus(orderId, 'delivered', {});
    kafka.publish('order_delivered', { orderId });
  }, 30000);
});

kafka.subscribe('order_delivered', (event) => {
  console.log(`[KAFKA] order_delivered → ${event.orderId}`);
  // Clean up rider route
  const order = orders.get(event.orderId);
  if (order?.rider?.id) riderSim.stopRiderRoute(order.rider.id);
  // Trigger rating prompt via socket
  io.to(`order:${event.orderId}`).emit('rating_prompt', { orderId: event.orderId });
});

// ── Helpers ────────────────────────────────────────────────────────────────
function updateOrderStatus(orderId, status, extra) {
  const order = orders.get(orderId) || {};
  const updated = { ...order, status, ...extra, updatedAt: Date.now() };
  orders.set(orderId, updated);
  io.to(`order:${orderId}`).emit('order_update', { orderId, status, ...extra });
  console.log(`[ORDER] ${orderId} → ${status}`);
}

async function assignRider(orderId, rider) {
  const order = orders.get(orderId) || {};
  orders.set(orderId, { ...order, rider });
  kafka.publish('rider_assigned', { orderId, rider });
}

// ── Socket.IO Connection ───────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[SOCKET] Connected: ${socket.id}`);

  // Customer joins order room
  socket.on('join_order', ({ orderId, customerId }) => {
    socket.join(`order:${orderId}`);
    if (customerId) customerSockets.set(customerId, socket.id);
    console.log(`[SOCKET] ${socket.id} joined order:${orderId}`);
    // Send current status if order exists
    if (orders.has(orderId)) {
      socket.emit('order_update', { orderId, ...orders.get(orderId) });
    }
  });

  // Restaurant joins their room
  socket.on('join_restaurant', ({ restaurantId }) => {
    socket.join(`restaurant:${restaurantId}`);
    restaurantSockets.set(restaurantId, socket.id);
    console.log(`[SOCKET] Restaurant ${restaurantId} connected`);
  });

  // Rider joins their room
  socket.on('join_rider', ({ riderId }) => {
    socket.join(`rider:${riderId}`);
    console.log(`[SOCKET] Rider ${riderId} connected`);
  });

  // Restaurant accepts order
  socket.on('accept_order', ({ orderId, restaurantId }) => {
    const order = orders.get(orderId);
    if (order) kafka.publish('order_accepted', { ...order, orderId, restaurantId });
  });

  // Restaurant rejects order
  socket.on('reject_order', ({ orderId, reason }) => {
    updateOrderStatus(orderId, 'rejected', { reason });
  });

  // Rider marks picked up
  socket.on('order_picked_up', ({ orderId, riderId }) => {
    kafka.publish('order_picked_up', { orderId, riderId });
  });

  // Rider GPS location update
  socket.on('rider_location', ({ riderId, lat, lng, heading, orderId }) => {
    if (orderId) {
      io.to(`order:${orderId}`).emit('rider_location_update', { lat, lng, heading, riderId });
    }
    redis.geoAdd('riders', { lat, lng, member: riderId });
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Disconnected: ${socket.id}`);
  });
});

// ── REST API ───────────────────────────────────────────────────────────────

// POST /api/orders — place order
app.post('/api/orders', async (req, res) => {
  const { customerId, restaurantId, items, total, address, paymentMethod } = req.body;
  const orderId = 'FG' + Date.now().toString().slice(-8);
  const order = {
    orderId, customerId, restaurantId, items, total,
    address, paymentMethod, status: 'placed',
    createdAt: Date.now(),
  };
  orders.set(orderId, order);

  // Apply surge pricing
  const surge = await pricing.getSurge(restaurantId);
  if (surge > 1) order.surgeMultiplier = surge;

  // Fire Kafka event
  kafka.publish('order_placed', order);

  res.json({ success: true, orderId, order });
});

// GET /api/orders/:id
app.get('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// GET /api/search
app.get('/api/search', (req, res) => {
  const { q, type = 'all' } = req.query;
  if (!q) return res.json({ results: [] });
  const results = search.query(q, type);
  res.json({ results, query: q });
});

// GET /api/pricing/surge
app.get('/api/pricing/surge', async (req, res) => {
  const { restaurantId } = req.query;
  const surge = await pricing.getSurge(restaurantId);
  res.json({ surge, restaurantId });
});

// POST /api/payments/create — creates Razorpay order (mock)
app.post('/api/payments/create', (req, res) => {
  const { amount, currency = 'INR', orderId } = req.body;
  // In production: call Razorpay API here
  const mockPaymentOrder = {
    id: 'pay_mock_' + Date.now(),
    amount: amount * 100, // paise
    currency,
    key_id: process.env.RAZORPAY_KEY_ID,
    orderId,
    description: 'F&G Food & Groceries',
    prefill: {},
  };
  res.json(mockPaymentOrder);
});

// POST /api/payments/verify
app.post('/api/payments/verify', (req, res) => {
  // In production: verify Razorpay signature here
  res.json({ success: true, verified: true });
});

// GET /api/riders/nearby
app.get('/api/riders/nearby', async (req, res) => {
  const { lat, lng, radius = 3 } = req.query;
  const nearby = await redis.geoRadius('riders', parseFloat(lng), parseFloat(lat), parseFloat(radius));
  res.json({ riders: nearby });
});

// GET /api/pricing/heatmap
app.get('/api/pricing/heatmap', async (req, res) => {
  const heatmap = pricing.getHeatmap();
  res.json({ heatmap });
});

// GET /api/health
app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: { socket: 'running', redis: redis.isConnected() ? 'connected' : 'mock', kafka: 'mock' },
    activeOrders: orders.size,
  });
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 F&G Server running on port ${PORT}`);
  console.log(`   Socket.IO  → ws://localhost:${PORT}`);
  console.log(`   REST API   → http://localhost:${PORT}/api`);
  console.log(`   Redis      → ${process.env.USE_MOCK_REDIS === 'true' ? 'MOCK (in-memory)' : process.env.REDIS_URL}`);
  console.log(`   Kafka      → MOCK (EventEmitter)\n`);
  riderSim.initRiders();
});

module.exports = { app, io };

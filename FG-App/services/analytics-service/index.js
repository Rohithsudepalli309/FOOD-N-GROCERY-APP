/**
 * Analytics Service — Business intelligence, ML hooks, aggregations
 * Port: 3009
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { EventEmitter } = require('events');
const { createLogger } = require('../../shared/utils/logger.js');

const logger = createLogger('analytics-service');
const app = express();
app.use(cors()); app.use(express.json());

// ── Event ingestion (Kafka consumer in production) ─────────────────────────
const eventBus = new EventEmitter();
const events = [];   // event log
const stats = {
  ordersToday: 24, ordersWeek: 128, ordersMonth: 512,
  revenueToday: 12480, revenueWeek: 68200, revenueMonth: 280000,
  avgDeliveryTimeMin: 32, avgRating: 4.4,
  topRestaurants: ['Barbeque Nation', 'Biryani Blues', 'Pizza Hut'],
  topDishes: ['Chicken Biryani', 'Margherita Pizza', 'McAloo Tikki'],
  surgePeriods: ['12:00-14:00', '19:00-22:00'],
};

// ── Endpoints ──────────────────────────────────────────────────────────────

// POST /api/analytics/events — Ingest event
app.post('/api/analytics/events', (req, res) => {
  const event = { ...req.body, receivedAt: new Date().toISOString() };
  events.push(event);
  if (events.length > 1000) events.splice(0, 100); // keep last 1000
  eventBus.emit('event', event);

  // Update stats based on event type
  if (event.type === 'order_delivered') {
    stats.ordersToday++;
    stats.revenueToday += event.total || 0;
  }

  res.json({ success: true });
});

// GET /api/analytics/dashboard — Overall stats
app.get('/api/analytics/dashboard', (req, res) => {
  const { restaurantId } = req.query;
  res.json({
    ...stats,
    restaurantId: restaurantId || 'all',
    timestamp: new Date().toISOString(),
    realtimeOrders: Math.floor(Math.random() * 8) + 2, // simulated live count
  });
});

// GET /api/analytics/heatmap — Demand heatmap for surge pricing
app.get('/api/analytics/heatmap', (req, res) => {
  const BASE = { lat: 28.6273, lng: 77.3660 };
  const heatmap = Array.from({ length: 25 }, (_, i) => ({
    lat: BASE.lat + (Math.random() - 0.5) * 0.06,
    lng: BASE.lng + (Math.random() - 0.5) * 0.06,
    intensity: Math.random(),
    orderCount: Math.floor(Math.random() * 50),
  }));
  res.json({ heatmap, updatedAt: new Date().toISOString() });
});

// GET /api/analytics/surge — ML surge prediction
app.get('/api/analytics/surge', (req, res) => {
  const { restaurantId } = req.query;
  const hour = new Date().getHours();
  const isPeak = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 22);
  const demand = 0.4 + Math.random() * 0.6;
  const multiplier = Math.min(1.5, 1 + (isPeak ? 0.2 : 0) + (demand > 0.7 ? 0.15 : 0));

  res.json({
    restaurantId,
    multiplier: Math.round(multiplier * 100) / 100,
    reason: isPeak ? 'peak_hour' : demand > 0.7 ? 'high_demand' : 'normal',
    isPeakHour: isPeak,
    demandScore: Math.round(demand * 100) / 100,
    expiresIn: 60,
  });
});

// GET /api/analytics/restaurant/:id/revenue
app.get('/api/analytics/restaurant/:id/revenue', (req, res) => {
  // In prod: query PostgreSQL with time range
  const revenue = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toLocaleDateString('en-IN'),
    revenue: Math.floor(8000 + Math.random() * 6000),
    orders: Math.floor(18 + Math.random() * 12),
  })).reverse();
  res.json({ restaurantId: req.params.id, revenue });
});

// GET /api/analytics/recommendations/:userId
app.get('/api/analytics/recommendations/:userId', (req, res) => {
  // In prod: ML model (collaborative filtering / matrix factorization)
  res.json({
    userId: req.params.userId,
    restaurants: ['r1', 'r5', 'r2'],  // based on order history
    dishes: ['Chicken Biryani', 'Margherita Pizza'],
    reason: 'Based on your recent orders',
  });
});

app.get('/api/analytics/health', (_, res) => res.json({ service: 'analytics-service', status: 'ok', eventsIngested: events.length }));

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => logger.info(`📊 Analytics Service on port ${PORT}`));

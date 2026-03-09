/**
 * Search Service — Fuse.js + Redis cache (Elasticsearch in production)
 * Port: 3008
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Fuse = require('fuse.js');
const { createLogger } = require('../../shared/utils/logger.js');

const logger = createLogger('search-service');
const app = express();
app.use(cors()); app.use(express.json());

// ── Data Corpus ────────────────────────────────────────────────────────────
const CORPUS = [
  // Restaurants
  { id: 'r1', type: 'restaurant', name: 'Barbeque Nation', subtitle: 'North Indian, Barbeque', rating: 4.5, tags: ['bbq','grill','non-veg'], deliveryTime: '30-45 min', minOrder: 299 },
  { id: 'r2', type: 'restaurant', name: 'Pizza Hut', subtitle: 'Pizza, Italian', rating: 4.2, tags: ['pizza','italian'], deliveryTime: '25-40 min', minOrder: 149 },
  { id: 'r3', type: 'restaurant', name: "McDonald's", subtitle: 'Burger, Fast Food', rating: 4.4, tags: ['burger','mcchicken'], deliveryTime: '20-35 min', minOrder: 99 },
  { id: 'r4', type: 'restaurant', name: "Domino's Pizza", subtitle: 'Pizza, Pasta', rating: 4.1, tags: ['pizza','pasta'], deliveryTime: '25-35 min', minOrder: 149 },
  { id: 'r5', type: 'restaurant', name: 'Biryani Blues', subtitle: 'Biryani, Hyderabadi', rating: 4.6, tags: ['biryani','rice'], deliveryTime: '35-50 min', minOrder: 199 },
  // Dishes
  { id: 'd1', type: 'dish', name: 'Chicken Biryani', subtitle: 'Biryani Blues', price: 279, isVeg: false, tags: ['biryani','chicken','rice'] },
  { id: 'd2', type: 'dish', name: 'Margherita Pizza', subtitle: 'Pizza Hut', price: 199, isVeg: true, tags: ['pizza','veg','cheese'] },
  { id: 'd3', type: 'dish', name: 'McAloo Tikki Burger', subtitle: "McDonald's", price: 99, isVeg: true, tags: ['burger','veg','aloo'] },
  { id: 'd4', type: 'dish', name: 'Paneer Butter Masala', subtitle: 'Barbeque Nation', price: 249, isVeg: true, tags: ['paneer','curry'] },
  { id: 'd5', type: 'dish', name: 'Chocolate Lava Cake', subtitle: 'Pizza Hut', price: 129, isVeg: true, tags: ['dessert','chocolate'] },
  { id: 'd6', type: 'dish', name: 'Chicken Tikka', subtitle: 'Barbeque Nation', price: 329, isVeg: false, tags: ['chicken','grill','starter'] },
  // Grocery
  { id: 'g1', type: 'product', name: 'Amul Butter 500g', subtitle: 'Dairy', price: 248, tags: ['butter','dairy','amul'] },
  { id: 'g2', type: 'product', name: 'Tata Salt 1kg', subtitle: 'Essentials', price: 21, tags: ['salt','tata'] },
  { id: 'g3', type: 'product', name: 'Aashirvaad Atta 5kg', subtitle: 'Staples', price: 248, tags: ['atta','wheat','flour'] },
  { id: 'g4', type: 'product', name: 'Organic Tomatoes 1kg', subtitle: 'Vegetables', price: 29, tags: ['tomato','vegetable','organic'] },
  { id: 'g5', type: 'product', name: 'Lay\'s Classic Chips', subtitle: 'Snacks', price: 20, tags: ['chips','snacks','lays'] },
];

const FUSE_OPTIONS = {
  includeScore: true, threshold: 0.4,
  keys: [
    { name: 'name', weight: 3 },
    { name: 'subtitle', weight: 1.5 },
    { name: 'tags', weight: 1 },
  ],
};

const fuse = new Fuse(CORPUS, FUSE_OPTIONS);
const queryCache = new Map(); // in prod: Redis with 5-min TTL

const TRENDING = ['Biryani', 'Pizza', 'Burger', 'Paneer', 'Chocolate', 'Butter Chicken'];

// ── Endpoints ──────────────────────────────────────────────────────────────

// GET /api/search?q=biryani&type=all&veg=false
app.get('/api/search', (req, res) => {
  const { q, type = 'all', veg, limit = 20, offset = 0 } = req.query;
  if (!q || q.length < 2) return res.json({ results: [], trending: TRENDING });

  const cacheKey = `${q}:${type}:${veg}`;
  if (queryCache.has(cacheKey)) return res.json({ results: queryCache.get(cacheKey), cached: true });

  let results = fuse.search(q, { limit: parseInt(limit) + parseInt(offset) })
    .map(r => ({ ...r.item, score: Math.round((1 - r.score) * 100) }));

  if (type !== 'all') results = results.filter(r => r.type === type);
  if (veg === 'true') results = results.filter(r => r.isVeg !== false);

  const paginated = results.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  queryCache.set(cacheKey, paginated);
  setTimeout(() => queryCache.delete(cacheKey), 5 * 60 * 1000);

  res.json({ results: paginated, total: results.length, query: q });
});

// GET /api/search/autocomplete?q=bir
app.get('/api/search/autocomplete', (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ suggestions: TRENDING.slice(0, 5) });
  const suggestions = fuse.search(q, { limit: 5 }).map(r => r.item.name);
  res.json({ suggestions });
});

// GET /api/search/trending
app.get('/api/search/trending', (_, res) => res.json({ trending: TRENDING }));

// GET /api/search/health
app.get('/api/search/health', (_, res) => res.json({ service: 'search-service', status: 'ok', corpusSize: CORPUS.length }));

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => logger.info(`🔍 Search Service on port ${PORT}`));

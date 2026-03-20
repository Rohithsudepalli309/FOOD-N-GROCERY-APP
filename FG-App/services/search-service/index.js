/**
 * Search Service — Elasticsearch 8.x + Redis cache + Kafka consumer
 * Port: 3008
 * Fixes: CodeQL #15 (type confusion :57), #16 (type confusion :78)
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Client } = require('@elastic/elasticsearch');
const { createLogger } = require('../../shared/utils/logger.js');
const { redis } = require('../../shared/utils/redis.js');
const { connectConsumer } = require('../../shared/utils/kafka.js');

const logger = createLogger('search-service');
const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || false }));
app.use(express.json());

// ── Rate Limiting ───────────────────────────────────────────────────────────
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60,
  message: { error: 'Search rate limit exceeded. Please slow down.' },
  standardHeaders: true, legacyHeaders: false,
});
app.use('/api/search', searchLimiter);

// ── Elasticsearch Client ────────────────────────────────────────────────────
const ES_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const esClient = new Client({ node: ES_URL });

const INDICES = { RESTAURANTS: 'restaurants', MENU: 'menu_items', PRODUCTS: 'products' };
const TRENDING = ['Biryani', 'Pizza', 'Burger', 'Paneer', 'Chocolate', 'Butter Chicken'];
const CACHE_TTL = 300; // 5 min Redis cache

// ── Input Sanitizer (Fixes CodeQL #15, #16 — type confusion) ───────────────
function sanitizeString(val, maxLen = 200) {
  if (typeof val !== 'string') return '';
  return val.replace(/[<>"'`;\\]/g, '').slice(0, maxLen).trim();
}

function sanitizePositiveInt(val, fallback, max = 100) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 0) return fallback;
  return Math.min(n, max);
}

// ── Elasticsearch Queries ───────────────────────────────────────────────────
async function searchES(q, type, isVeg, limit, offset) {
  const indices = type === 'restaurant' ? [INDICES.RESTAURANTS]
    : type === 'dish' ? [INDICES.MENU]
    : type === 'product' ? [INDICES.PRODUCTS]
    : [INDICES.RESTAURANTS, INDICES.MENU, INDICES.PRODUCTS];

  const filters = [];
  if (isVeg === 'true') filters.push({ term: { isVeg: true } });

  const { hits } = await esClient.search({
    index: indices,
    from: offset,
    size: limit,
    query: {
      bool: {
        must: [{
          multi_match: {
            query: q,
            fields: ['name^3', 'subtitle^1.5', 'tags^1', 'description'],
            fuzziness: 'AUTO',
            type: 'best_fields',
          },
        }],
        filter: filters,
      },
    },
  });

  return {
    results: hits.hits.map(h => ({ id: h._id, ...h._source, score: Math.round(h._score * 10) })),
    total: typeof hits.total === 'object' ? hits.total.value : hits.total,
  };
}

// ── Endpoints ───────────────────────────────────────────────────────────────

// GET /api/search?q=biryani&type=all&veg=false&limit=20&offset=0
app.get('/api/search', async (req, res) => {
  // ✅ Explicit type-safe sanitization (#15 fix)
  const q    = sanitizeString(req.query.q);
  const type = sanitizeString(req.query.type) || 'all';
  const veg  = sanitizeString(req.query.veg);
  const limit  = sanitizePositiveInt(req.query.limit, 20, 50);
  const offset = sanitizePositiveInt(req.query.offset, 0, 500);

  if (q.length < 2) return res.json({ results: [], trending: TRENDING });

  const cacheKey = `search:${q}:${type}:${veg}:${limit}:${offset}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ ...JSON.parse(cached), cached: true });

    const { results, total } = await searchES(q, type, veg, limit, offset);
    const payload = { results, total, query: q };
    await redis.set(cacheKey, JSON.stringify(payload), 'EX', CACHE_TTL);
    res.json(payload);
  } catch (err) {
    logger.error('Elasticsearch query failed', { error: err.message });
    res.status(503).json({ error: 'Search temporarily unavailable', results: [], trending: TRENDING });
  }
});

// GET /api/search/autocomplete?q=bir
app.get('/api/search/autocomplete', async (req, res) => {
  // ✅ Explicit type-safe sanitization (#16 fix)
  const q = sanitizeString(req.query.q);
  if (q.length < 2) return res.json({ suggestions: TRENDING.slice(0, 5) });

  const cacheKey = `autocomplete:${q}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ suggestions: JSON.parse(cached) });

    const { hits } = await esClient.search({
      index: [INDICES.RESTAURANTS, INDICES.MENU, INDICES.PRODUCTS],
      size: 6,
      _source: ['name'],
      query: {
        match_phrase_prefix: { name: { query: q, max_expansions: 10 } },
      },
    });

    const suggestions = [...new Set(hits.hits.map(h => h._source.name))].slice(0, 5);
    await redis.set(cacheKey, JSON.stringify(suggestions), 'EX', 60);
    res.json({ suggestions });
  } catch (err) {
    logger.warn('Autocomplete ES error, falling back to trending', { error: err.message });
    res.json({ suggestions: TRENDING.slice(0, 5) });
  }
});

// GET /api/search/trending
app.get('/api/search/trending', (_, res) => res.json({ trending: TRENDING }));

// GET /api/search/health
app.get('/api/search/health', async (_, res) => {
  try {
    const esHealth = await esClient.cluster.health();
    res.json({ service: 'search-service', status: 'ok', elasticsearch: esHealth.status });
  } catch (err) {
    res.status(503).json({ service: 'search-service', status: 'error', elasticsearch: 'unreachable' });
  }
});

// ── Kafka Consumer: Auto-index catalog changes ──────────────────────────────
async function initSearchConsumer() {
  try {
    await connectConsumer('search-indexer', ['restaurant_updated', 'menu_updated'], async (topic, message) => {
      const data = JSON.parse(message.value.toString());
      const index = topic === 'restaurant_updated' ? INDICES.RESTAURANTS : INDICES.MENU;

      await esClient.index({
        index,
        id: data.id,
        document: data,
        refresh: true,
      });
      logger.info(`ES: Indexed ${index} document`, { id: data.id });
    });
    logger.info('🔍 Kafka search indexer listening for catalog updates');
  } catch (err) {
    logger.warn('Kafka consumer unavailable, search will use existing ES data', { error: err.message });
  }
}

const PORT = process.env.PORT || 3008;
app.listen(PORT, async () => {
  logger.info(`🔍 Search Service on port ${PORT} (Elasticsearch: ${ES_URL})`);
  await initSearchConsumer();
});

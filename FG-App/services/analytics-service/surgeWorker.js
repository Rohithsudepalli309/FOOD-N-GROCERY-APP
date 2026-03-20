/**
 * Surge Pricing Background Worker
 * Runs every 10 seconds. Compares active orders vs online riders
 * and autonomously updates the global surge multiplier in Redis.
 *
 * Usage: node services/analytics-service/surgeWorker.js
 * Or start alongside analytics-service in docker-compose command.
 */
require('dotenv').config();
const { createLogger } = require('../../shared/utils/logger.js');
const { query } = require('../../shared/utils/db.js');
const { redis } = require('../../shared/utils/redis.js');
const { publishEvent } = require('../../shared/utils/kafka.js');

const logger = createLogger('surge-worker');

const SURGE_INTERVAL_MS = 10_000;     // Run every 10 seconds
const MAX_MULTIPLIER    = 2.0;        // Cap surge at 2x
const MIN_MULTIPLIER    = 1.0;
const SURGE_CACHE_KEY   = 'surge_pricing';
const SURGE_CACHE_TTL   = 30;         // Redis TTL (seconds)

async function computeSurge() {
  try {
    // 1. Count active unassigned orders from PostgreSQL
    const ordersRes = await query(`
      SELECT COUNT(*) AS count FROM orders
      WHERE status IN ('pending', 'confirmed', 'preparing')
    `);
    const activeOrders = parseInt(ordersRes.rows[0].count) || 0;

    // 2. Count online riders via Redis GEO (any rider that has a GEO entry)
    const activeRiders = await redis.zcard('riders:geo');

    // 3. Compute multiplier
    // Formula: if orders > 2x riders → scale up proportionally (capped at MAX)
    let multiplier = MIN_MULTIPLIER;
    let reason     = 'normal';

    const hour    = new Date().getHours();
    const isPeak  = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 22);

    if (activeRiders === 0 && activeOrders > 0) {
      // No riders at all — max surge
      multiplier = MAX_MULTIPLIER;
      reason     = 'no_riders';
    } else if (activeRiders > 0) {
      const ratio = activeOrders / activeRiders;
      if (ratio > 4)       { multiplier = 1.8; reason = 'very_high_demand'; }
      else if (ratio > 3)  { multiplier = 1.5; reason = 'high_demand'; }
      else if (ratio > 2)  { multiplier = 1.3; reason = 'moderate_demand'; }
      else if (isPeak)     { multiplier = 1.15; reason = 'peak_hour'; }
    } else if (isPeak) {
      multiplier = 1.1;
      reason     = 'peak_hour';
    }

    multiplier = Math.min(MAX_MULTIPLIER, Math.round(multiplier * 100) / 100);

    const surgePayload = {
      multiplier,
      reason,
      activeOrders,
      activeRiders,
      isPeakHour: isPeak,
      computedAt: new Date().toISOString(),
    };

    // 4. Push to Redis (all services read from here)
    await redis.set(SURGE_CACHE_KEY, JSON.stringify(surgePayload), 'EX', SURGE_CACHE_TTL);

    // 5. Publish Kafka event if surge changed significantly
    const prevRaw = await redis.get('surge_pricing_prev');
    const prevMultiplier = prevRaw ? JSON.parse(prevRaw).multiplier : 1.0;
    if (Math.abs(multiplier - prevMultiplier) >= 0.1) {
      await publishEvent('surge_pricing_updated', 'global', surgePayload).catch(() => {});
      await redis.set('surge_pricing_prev', JSON.stringify(surgePayload), 'EX', 60);
      logger.info(`🔥 Surge updated: ${prevMultiplier}x → ${multiplier}x`, { reason, activeOrders, activeRiders });
    }

  } catch (err) {
    logger.error('Surge computation failed:', err.message);
  }
}

// ── Main Loop ───────────────────────────────────────────────────────────────
logger.info('🔥 Surge Pricing Worker started');
computeSurge(); // Run immediately on start
setInterval(computeSurge, SURGE_INTERVAL_MS);

// Graceful shutdown
process.on('SIGTERM', () => { logger.info('Surge worker shutting down'); process.exit(0); });
process.on('SIGINT',  () => { logger.info('Surge worker shutting down'); process.exit(0); });

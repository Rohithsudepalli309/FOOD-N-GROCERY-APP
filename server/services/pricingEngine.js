/**
 * PricingEngine — Dynamic surge pricing
 * Factors: time of day, demand, weather, historical patterns
 * In production: replace with ML model output via Redis cache
 */

const SURGE_ZONES = {
  'r1': { baseLat: 28.6273, baseLng: 77.3660 }, // Barbeque Nation
  'r2': { baseLat: 28.6302, baseLng: 77.3701 }, // Pizza Hut
  'r3': { baseLat: 28.6250, baseLng: 77.3600 }, // McDonald's
};

class PricingEngine {
  constructor(redis) {
    this.redis = redis;
    this.heatmap = this._generateHeatmap();
    // Refresh heatmap every 5 min
    setInterval(() => { this.heatmap = this._generateHeatmap(); }, 5 * 60 * 1000);
    console.log('[PricingEngine] Dynamic pricing engine initialized');
  }

  /**
   * Get surge multiplier for a restaurant
   * Returns 1.0 (no surge) to 1.5 (50% surge)
   */
  async getSurge(restaurantId) {
    const cacheKey = `surge:${restaurantId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return parseFloat(cached);

    const surge = this._calculateSurge();
    await this.redis.setex(cacheKey, 60, surge.toString()); // 60s TTL
    return surge;
  }

  _calculateSurge() {
    const hour = new Date().getHours();
    // Peak hours: lunch (12-14) and dinner (19-22)
    const isPeakHour = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 22);
    // Simulate demand factor (would be ML model score in production)
    const demandFactor = 0.5 + Math.random() * 0.5;
    // Weather factor (random in mock — would be weather API)
    const weatherFactor = Math.random() > 0.8 ? 1.1 : 1.0;

    let surge = 1.0;
    if (isPeakHour) surge += 0.2;
    if (demandFactor > 0.7) surge += 0.15;
    surge *= weatherFactor;
    return Math.min(1.5, Math.round(surge * 100) / 100);
  }

  /**
   * Get heatmap for UI display
   * Returns array of {lat, lng, intensity} points
   */
  _generateHeatmap() {
    // Simulate 20 demand hotspots in Noida
    const points = [];
    const BASE = { lat: 28.6273, lng: 77.3660 };
    for (let i = 0; i < 20; i++) {
      points.push({
        lat: BASE.lat + (Math.random() - 0.5) * 0.05,
        lng: BASE.lng + (Math.random() - 0.5) * 0.05,
        intensity: Math.random(),
      });
    }
    return points;
  }

  getHeatmap() { return this.heatmap; }

  /**
   * Estimate delivery fee based on distance + surge
   */
  async estimateDeliveryFee(distanceKm, restaurantId) {
    const surge = await this.getSurge(restaurantId);
    const baseFee = distanceKm <= 3 ? 29 : distanceKm <= 5 ? 39 : 49;
    return Math.round(baseFee * surge);
  }
}

module.exports = PricingEngine;

/**
 * MockRedis — In-memory Redis replacement for dev
 * Supports: GET/SET, GEOADD, GEORADIUS, EXPIRE, KEYS
 */
class MockRedis {
  constructor() {
    this.store = new Map();
    this.geoStore = new Map(); // key → Map<member, {lat,lng}>
    this.ttls = new Map();
    console.log('[MockRedis] Running in-memory (no Redis server needed)');
  }

  isConnected() { return false; } // indicates mock

  // Key-value
  async get(key) {
    return this.store.get(key) ?? null;
  }
  async set(key, value) {
    this.store.set(key, value);
    return 'OK';
  }
  async setex(key, ttlSeconds, value) {
    this.store.set(key, value);
    this.ttls.set(key, setTimeout(() => this.store.delete(key), ttlSeconds * 1000));
    return 'OK';
  }
  async del(key) {
    this.store.delete(key);
    return 1;
  }
  async incr(key) {
    const val = parseInt(this.store.get(key) || '0') + 1;
    this.store.set(key, val.toString());
    return val;
  }

  // Pub/Sub mock (no-op — using Kafka mock instead)
  async publish(channel, message) { return 0; }
  async subscribe() {}

  // Geo commands
  async geoAdd(key, { lat, lng, member }) {
    if (!this.geoStore.has(key)) this.geoStore.set(key, new Map());
    this.geoStore.get(key).set(member, { lat, lng });
    return 1;
  }

  async geoRadius(key, lng, lat, radiusKm) {
    const members = this.geoStore.get(key);
    if (!members) return [];
    const results = [];
    for (const [member, pos] of members.entries()) {
      const dist = this._distKm(lat, lng, pos.lat, pos.lng);
      if (dist <= radiusKm) results.push({ member, dist: dist.toFixed(2), ...pos });
    }
    return results.sort((a, b) => a.dist - b.dist);
  }

  async geoPos(key, member) {
    const pos = this.geoStore.get(key)?.get(member);
    return pos ? [pos.lng, pos.lat] : null;
  }

  // Haversine distance in km
  _distKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = this._rad(lat2 - lat1);
    const dLng = this._rad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(this._rad(lat1)) * Math.cos(this._rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  _rad(d) { return d * Math.PI / 180; }
}

module.exports = MockRedis;

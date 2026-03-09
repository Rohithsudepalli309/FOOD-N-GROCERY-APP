/**
 * RiderSimulator — Simulates 5 GPS-tracked riders in Noida/Delhi NCR
 * Emits rider_location_update via Socket.IO every 3 seconds
 * Uses Redis GEO for proximity queries (O(N+log(M)))
 */

const MOCK_RIDERS = [
  { id: 'r1', name: 'Rahul Sharma',  rating: 4.8, deliveries: 1340, lat: 28.6280, lng: 77.3649, vehicle: '🛵' },
  { id: 'r2', name: 'Amit Kumar',    rating: 4.6, deliveries: 890,  lat: 28.6302, lng: 77.3701, vehicle: '🛵' },
  { id: 'r3', name: 'Priya Singh',   rating: 4.9, deliveries: 2100, lat: 28.6250, lng: 77.3600, vehicle: '🚲' },
  { id: 'r4', name: 'Rohit Verma',   rating: 4.5, deliveries: 560,  lat: 28.6320, lng: 77.3720, vehicle: '🛵' },
  { id: 'r5', name: 'Sneha Patel',   rating: 4.7, deliveries: 1200, lat: 28.6265, lng: 77.3660, vehicle: '🛵' },
];

// Noida Sector 62 restaurant (mock pickup point)
const RESTAURANT_LOCATION = { lat: 28.6273, lng: 77.3660 };
// Mock customer location
const CUSTOMER_LOCATION = { lat: 28.6200, lng: 77.3580 };

class RiderSimulator {
  constructor(io, redis) {
    this.io = io;
    this.redis = redis;
    this.riders = new Map(); // riderId → rider state
    this.routes = new Map(); // riderId → interval handle
  }

  // Register all mock riders into Redis GEO
  initRiders() {
    MOCK_RIDERS.forEach(r => {
      this.riders.set(r.id, { ...r, available: true, orderId: null });
      this.redis.geoAdd('riders', r);
    });
    console.log(`[RiderSim] Initialized ${MOCK_RIDERS.length} mock riders`);

    // Simulate idle GPS drift so riders appear "online"
    this._idleDrift();
  }

  // Continuously jitter rider positions slightly while idle
  _idleDrift() {
    setInterval(() => {
      this.riders.forEach((rider, id) => {
        if (!rider.available || rider.orderId) return;
        rider.lat += (Math.random() - 0.5) * 0.0005;
        rider.lng += (Math.random() - 0.5) * 0.0005;
        this.redis.geoAdd('riders', rider);
      });
    }, 5000);
  }

  // Find nearest available rider within radiusKm
  async findNearestRider(restaurantId, radiusKm = 3) {
    const nearby = await this.redis.geoRadius(
      'riders',
      RESTAURANT_LOCATION.lng,
      RESTAURANT_LOCATION.lat,
      radiusKm,
    );
    for (const entry of nearby) {
      const rider = this.riders.get(entry.member);
      if (rider && rider.available) {
        return { ...rider, distKm: entry.dist };
      }
    }
    // Fallback: return first mock rider
    return { ...MOCK_RIDERS[0], distKm: 0.8 };
  }

  // Start animating rider along restaurant → customer route
  startRiderRoute(riderId, orderId, io) {
    const rider = this.riders.get(riderId);
    if (!rider) return;
    rider.available = false;
    rider.orderId = orderId;

    // Simple linear interpolation: restaurant → customer in ~30 steps × 3s = ~90s
    const steps = 30;
    const latStep = (CUSTOMER_LOCATION.lat - RESTAURANT_LOCATION.lat) / steps;
    const lngStep = (CUSTOMER_LOCATION.lng - RESTAURANT_LOCATION.lng) / steps;
    let step = 0;

    // Start at restaurant
    rider.lat = RESTAURANT_LOCATION.lat;
    rider.lng = RESTAURANT_LOCATION.lng;

    const handle = setInterval(() => {
      if (step >= steps) {
        clearInterval(handle);
        this.routes.delete(riderId);
        rider.available = true;
        rider.orderId = null;
        console.log(`[RiderSim] Rider ${riderId} completed delivery`);
        return;
      }

      // Add slight noise for realistic movement
      rider.lat += latStep + (Math.random() - 0.5) * 0.0001;
      rider.lng += lngStep + (Math.random() - 0.5) * 0.0001;

      const heading = Math.atan2(lngStep, latStep) * (180 / Math.PI);

      // Emit to order room
      io.to(`order:${orderId}`).emit('rider_location_update', {
        riderId,
        lat: rider.lat,
        lng: rider.lng,
        heading,
        step,
        totalSteps: steps,
        eta: Math.max(0, Math.round(((steps - step) * 3) / 60)) + ' min',
      });

      // Also update Redis GEO
      this.redis.geoAdd('riders', rider);
      step++;
    }, 3000); // every 3 seconds exactly

    this.routes.set(riderId, handle);
    console.log(`[RiderSim] Rider ${riderId} started route for order ${orderId}`);
  }

  stopRiderRoute(riderId) {
    const handle = this.routes.get(riderId);
    if (handle) {
      clearInterval(handle);
      this.routes.delete(riderId);
    }
    const rider = this.riders.get(riderId);
    if (rider) { rider.available = true; rider.orderId = null; }
  }

  getRiders() {
    return Array.from(this.riders.values());
  }
}

module.exports = RiderSimulator;

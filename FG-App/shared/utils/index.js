/**
 * F&G Shared Utilities
 */

// ── Geospatial ─────────────────────────────────────────────────────────────
/**
 * Haversine formula — distance between two lat/lng points in km
 * Same algorithm used internally by Redis GEORADIUS
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function toRad(deg) { return deg * Math.PI / 180; }

/**
 * Calculate compass heading between two points (degrees 0–360)
 */
export function bearing(lat1, lng1, lat2, lng2) {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

/**
 * Estimate ETA in minutes given distance and average speed
 */
export function etaMinutes(distKm, avgSpeedKmh = 25) {
  return Math.max(1, Math.round((distKm / avgSpeedKmh) * 60));
}

// ── Payments ───────────────────────────────────────────────────────────────
/**
 * Generate idempotency key — prevents duplicate charges on retry
 */
export function idempotencyKey(orderId, suffix = '') {
  return `${orderId}_${Date.now()}${suffix ? '_' + suffix : ''}`;
}

/**
 * Format paise → rupees (Razorpay uses smallest unit)
 */
export function paiseToRupees(paise) { return paise / 100; }
export function rupeesToPaise(rupees) { return Math.round(rupees * 100); }

// ── Order Pricing ──────────────────────────────────────────────────────────
export function calculateOrderTotal({ subtotal, deliveryFee = 29, platformFee = 5, discount = 0, surgeMultiplier = 1 }) {
  const gst = Math.round(subtotal * 0.05);
  const surgedDelivery = Math.round(deliveryFee * surgeMultiplier);
  return {
    subtotal,
    deliveryFee: surgedDelivery,
    platformFee,
    gst,
    discount,
    total: subtotal + surgedDelivery + platformFee + gst - discount,
  };
}

// ── Phone ──────────────────────────────────────────────────────────────────
export function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
}

export function isValidIndianPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

// ── OTP ────────────────────────────────────────────────────────────────────
export function generateOTP(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

// ── Strings ────────────────────────────────────────────────────────────────
export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
}

export function truncate(str, maxLen = 30) {
  return str?.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

// ── Time ───────────────────────────────────────────────────────────────────
export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ── Surge Scoring ──────────────────────────────────────────────────────────
/**
 * Rider assignment scoring — higher = better (Swiggy-style weighted score)
 * Factors: distance (most important), acceptance rate, rating
 */
export function scoreRider(rider, distKm) {
  const distScore = Math.max(0, 1 - distKm / 5);       // 0–1, closer = better
  const ratingScore = (rider.rating - 3) / 2;           // 3–5 star → 0–1
  const acceptScore = (rider.acceptanceRate ?? 0.8);    // 0–1
  return (distScore * 0.6) + (ratingScore * 0.2) + (acceptScore * 0.2);
}

/**
 * F&G Shared Constants
 * Single source of truth for event names, status enums, routes
 */

// ── Kafka Topics ───────────────────────────────────────────────────────────
export const KAFKA_TOPICS = {
  ORDER_PLACED:      'order_placed',
  ORDER_ACCEPTED:    'order_accepted',
  ORDER_REJECTED:    'order_rejected',
  ORDER_CANCELLED:   'order_cancelled',
  ORDER_PICKED_UP:   'order_picked_up',
  ORDER_DELIVERED:   'order_delivered',
  RIDER_ASSIGNED:    'rider_assigned',
  RIDER_LOCATION:    'rider_location',
  PAYMENT_SUCCESS:   'payment_success',
  PAYMENT_FAILED:    'payment_failed',
  PAYMENT_REFUND:    'payment_refund',
  NOTIFICATION_SEND: 'notification_send',
  ANALYTICS_EVENT:   'analytics_event',
};

// ── Socket.IO Events ───────────────────────────────────────────────────────
export const SOCKET_EVENTS = {
  // Server → Client
  ORDER_UPDATE:           'order_update',
  RIDER_LOCATION_UPDATE:  'rider_location_update',
  NEW_ORDER:              'new_order',          // to restaurant
  ORDER_REQUEST:          'order_request',      // to rider (30s timer)
  RATING_PROMPT:          'rating_prompt',
  INVENTORY_UPDATE:       'inventory_update',
  SURGE_UPDATE:           'surge_update',

  // Client → Server
  JOIN_ORDER:             'join_order',
  JOIN_RESTAURANT:        'join_restaurant',
  JOIN_RIDER:             'join_rider',
  ACCEPT_ORDER:           'accept_order',
  REJECT_ORDER:           'reject_order',
  RIDER_ACCEPT_DELIVERY:  'rider_accept_delivery',
  RIDER_REJECT_DELIVERY:  'rider_reject_delivery',
  RIDER_LOCATION_EMIT:    'rider_location',
  ORDER_PICKED_UP:        'order_picked_up',
};

// ── Order Status ───────────────────────────────────────────────────────────
export const ORDER_STATUS = {
  PLACED:         'placed',
  CONFIRMED:      'confirmed',
  PREPARING:      'preparing',
  READY:          'ready',
  RIDER_ASSIGNED: 'rider_assigned',
  PICKED_UP:      'picked_up',
  ON_THE_WAY:     'on_the_way',
  NEARBY:         'nearby',
  DELIVERED:      'delivered',
  REJECTED:       'rejected',
  CANCELLED:      'cancelled',
};

export const ORDER_STATUS_DISPLAY = {
  placed:         { label: 'Order Placed',         emoji: '✅', color: '#FF5722' },
  confirmed:      { label: 'Restaurant Confirmed', emoji: '🍳', color: '#1DA1F2' },
  preparing:      { label: 'Being Prepared',       emoji: '👨‍🍳', color: '#FFCA28' },
  ready:          { label: 'Ready for Pickup',     emoji: '📦', color: '#66BB6A' },
  rider_assigned: { label: 'Rider Assigned',       emoji: '🛵', color: '#AB47BC' },
  picked_up:      { label: 'Picked Up',            emoji: '🏃', color: '#26A69A' },
  on_the_way:     { label: 'On the Way',           emoji: '🛵', color: '#FF7043' },
  nearby:         { label: 'Almost There!',         emoji: '📍', color: '#EC407A' },
  delivered:      { label: 'Delivered',            emoji: '🎉', color: '#66BB6A' },
  rejected:       { label: 'Rejected',             emoji: '❌', color: '#EF5350' },
  cancelled:      { label: 'Cancelled',            emoji: '🚫', color: '#78909C' },
};

// ── Service Ports ──────────────────────────────────────────────────────────
export const SERVICE_PORTS = {
  API_GATEWAY:          3000,
  AUTH_SERVICE:         3001,
  RESTAURANT_SERVICE:   3002,
  ORDER_SERVICE:        3003,
  DELIVERY_SERVICE:     3004,
  PAYMENT_SERVICE:      3005,
  NOTIFICATION_SERVICE: 3006,
  REALTIME_SERVICE:     3007,
  SEARCH_SERVICE:       3008,
  ANALYTICS_SERVICE:    3009,
  WEB_ADMIN:            4000,
};

// ── Pricing ────────────────────────────────────────────────────────────────
export const PRICING = {
  BASE_DELIVERY_FEE:    29,
  PLATFORM_FEE:         5,
  GST_RATE:             0.05,   // 5%
  MAX_SURGE_MULTIPLIER: 1.5,
  SURGE_CACHE_TTL_S:    60,
  INSTA_DELIVERY_MIN:   10,     // guaranteed 10-min grocery
};

// ── Rider Assignment ───────────────────────────────────────────────────────
export const RIDER_ASSIGNMENT = {
  SEARCH_RADIUS_KM:       3,
  TOP_N_PINGED:           3,       // ping top 3 simultaneously (Swiggy style)
  ACCEPT_TIMEOUT_S:       30,      // 30s to accept
  MAX_REASSIGN_ATTEMPTS:  3,
};

// ── App Routes ─────────────────────────────────────────────────────────────
export const ROUTES = {
  // Auth
  SPLASH:          'Splash',
  LOGIN:           'Login',
  SIGNUP:          'Signup',
  // Main
  MAIN:            'Main',
  HOME:            'Home',
  SEARCH:          'Search',
  CATEGORY:        'Category',
  // Restaurant
  RESTAURANT_LIST: 'RestaurantList',
  RESTAURANT:      'Restaurant',
  MENU_ITEM:       'MenuItem',
  // Grocery
  GROCERY_HOME:    'GroceryHome',
  GROCERY_STORE:   'GroceryStore',
  PRODUCT_DETAIL:  'ProductDetail',
  INSTA_DELIVERY:  'InstaDelivery',
  // Cart & Checkout
  CART:            'Cart',
  CHECKOUT:        'Checkout',
  ORDER_SUMMARY:   'OrderSummary',
  // Tracking
  ORDER_STATUS:    'OrderStatus',
  LIVE_TRACKING:   'LiveTracking',
  // Profile
  PROFILE:         'Profile',
  ORDER_HISTORY:   'OrderHistory',
  ADDRESS:         'Address',
  WALLET:          'Wallet',
};

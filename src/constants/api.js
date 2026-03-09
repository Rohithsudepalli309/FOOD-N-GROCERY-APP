// API Configuration
export const API_BASE_URL = 'http://localhost:3000/api/v1';
export const SOCKET_URL = 'http://localhost:3001';

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  VERIFY_OTP: '/auth/verify-otp',
  SIGNUP: '/auth/signup',
  REFRESH_TOKEN: '/auth/refresh',
  
  // User
  PROFILE: '/users/profile',
  ADDRESSES: '/users/addresses',
  
  // Restaurants
  RESTAURANTS: '/restaurants',
  RESTAURANT_DETAIL: (id) => `/restaurants/${id}`,
  MENU: (restaurantId) => `/restaurants/${restaurantId}/menu`,
  
  // Grocery
  GROCERY_STORES: '/grocery/stores',
  PRODUCTS: (storeId) => `/grocery/stores/${storeId}/products`,
  PRODUCT_DETAIL: (id) => `/grocery/products/${id}`,
  
  // Search
  SEARCH: '/search',
  
  // Cart
  CART: '/cart',
  
  // Orders
  ORDERS: '/orders',
  ORDER_DETAIL: (id) => `/orders/${id}`,
  
  // Payment
  PAYMENT_CREATE: '/payments/create',
  WALLET: '/payments/wallet',
  
  // Tracking
  ORDER_TRACKING: (id) => `/orders/${id}/tracking`,
};

export const RAZORPAY_KEY = 'rzp_test_XXXXXX'; // Replace with real key

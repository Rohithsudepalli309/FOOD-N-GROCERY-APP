/**
 * F&G Shared Domain Types
 * Used across all apps and microservices
 */

// ── User / Auth ────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  walletBalance: number;
  fcmToken?: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ── Location ───────────────────────────────────────────────────────────────
export interface LatLng {
  lat: number;
  lng: number;
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  addressLine: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location: LatLng;
  isDefault: boolean;
}

// ── Restaurant ─────────────────────────────────────────────────────────────
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  description?: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryFee: number;
  minOrder: number;
  location: LatLng;
  address: string;
  isOpen: boolean;
  isVegOnly: boolean;
  offers: string[];
  tags: string[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  category: string;
  customizations?: Customization[];
  nutritionFacts?: NutritionFacts;
}

export interface MenuSection {
  title: string;
  data: MenuItem[];
}

export interface Customization {
  id: string;
  name: string;
  options: CustomizationOption[];
  required: boolean;
  maxSelections: number;
}

export interface CustomizationOption {
  id: string;
  name: string;
  extraPrice: number;
}

export interface NutritionFacts {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

// ── Grocery ────────────────────────────────────────────────────────────────
export interface GroceryProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  imageUrl: string;
  inStock: boolean;
  stockCount: number;
  weight?: string;
  sizes?: ProductSize[];
  nutritionFacts?: NutritionFacts;
  tags: string[];
}

export interface ProductSize {
  id: string;
  label: string;
  price: number;
  weight: string;
}

// ── Cart ───────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  restaurantId?: string;
  customizations?: SelectedCustomization[];
}

export interface SelectedCustomization {
  customizationId: string;
  optionId: string;
  optionName: string;
  extraPrice: number;
}

// ── Order ──────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'placed' | 'confirmed' | 'preparing' | 'ready'
  | 'rider_assigned' | 'picked_up' | 'on_the_way'
  | 'nearby' | 'delivered' | 'rejected' | 'cancelled';

export type OrderType = 'food' | 'grocery' | 'insta';

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  restaurantId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  gst: number;
  discount: number;
  total: number;
  surgeMultiplier?: number;
  address: Address;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  type: OrderType;
  riderId?: string;
  estimatedDelivery?: string;
  otp?: string;
  rating?: OrderRating;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRating {
  food: number;
  delivery: number;
  comment?: string;
  ratedAt: string;
}

// ── Payment ────────────────────────────────────────────────────────────────
export type PaymentMethod = 'upi' | 'card' | 'wallet' | 'cod';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  idempotencyKey: string;
  createdAt: string;
}

// ── Rider ──────────────────────────────────────────────────────────────────
export type RiderStatus = 'online' | 'offline' | 'busy';

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle: 'bike' | 'bicycle' | 'scooter';
  vehicleNumber: string;
  rating: number;
  totalDeliveries: number;
  status: RiderStatus;
  location: LatLng;
  heading?: number;
  currentOrderId?: string;
  fcmToken?: string;
}

export interface RiderLocation {
  riderId: string;
  lat: number;
  lng: number;
  heading: number;
  speed?: number;
  eta?: string;
  step?: number;
  totalSteps?: number;
  timestamp: number;
}

// ── Notification ───────────────────────────────────────────────────────────
export type NotificationType =
  | 'order_placed' | 'order_confirmed' | 'rider_assigned'
  | 'picked_up' | 'on_the_way' | 'nearby' | 'delivered'
  | 'promo' | 'grocery_restock' | 'wallet_credit';

export interface PushNotification {
  userId: string;
  fcmToken: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

// ── Search ─────────────────────────────────────────────────────────────────
export type SearchResultType = 'restaurant' | 'dish' | 'product';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  subtitle?: string;
  imageUrl?: string;
  rating?: number;
  price?: number;
  score?: number;
}

// ── Analytics / Events ─────────────────────────────────────────────────────
export interface KafkaEvent<T = unknown> {
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
  value: T;
}

export interface SurgeData {
  restaurantId: string;
  multiplier: number;
  reason: 'peak_hour' | 'high_demand' | 'weather' | 'event';
  expiresAt: number;
}

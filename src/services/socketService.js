/**
 * Socket Service — Singleton Socket.IO client for React Native
 * Manages connection lifecycle, order rooms, and reconnection
 */
import { io } from 'socket.io-client';
import { store } from '../store';
import { updateOrderStatus, updateRiderLocation } from '../store/slices/orderSlice';
import { showNotification } from '../store/slices/uiSlice';

// Change this to your server's IP when testing on a real device
// Use your PC's local IP (e.g., 192.168.1.100) or tunnel URL
const SERVER_URL = __DEV__
  ? 'http://10.0.2.2:3001'   // Android emulator → localhost
  : 'https://your-production-server.com';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentOrderRoom = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  connect(customUrl) {
    if (this.socket?.connected) return this.socket;

    const url = customUrl || SERVER_URL;
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this._bindEvents();
    return this.socket;
  }

  _bindEvents() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('[Socket] Connected:', this.socket.id);
      // Rejoin current order room if any
      if (this.currentOrderRoom) {
        this.joinOrderRoom(this.currentOrderRoom);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      this.reconnectAttempts++;
      console.warn(`[Socket] Connection error (attempt ${this.reconnectAttempts}):`, err.message);
    });

    // Order lifecycle updates → Redux
    this.socket.on('order_update', (data) => {
      store.dispatch(updateOrderStatus(data));
      this._handleStatusNotification(data);
    });

    // Rider GPS updates → Redux
    this.socket.on('rider_location_update', (data) => {
      store.dispatch(updateRiderLocation(data));
    });

    // New order for restaurant dashboard
    this.socket.on('new_order', (data) => {
      store.dispatch(showNotification({ type: 'new_order', data }));
    });

    // Rating prompt after delivery
    this.socket.on('rating_prompt', ({ orderId }) => {
      store.dispatch(showNotification({ type: 'rating_prompt', orderId }));
    });
  }

  _handleStatusNotification(data) {
    const MESSAGES = {
      confirmed:      { title: '✅ Order Confirmed', body: 'Restaurant has accepted your order!' },
      preparing:      { title: '👨‍🍳 Being Prepared', body: 'Your food is being cooked fresh.' },
      rider_assigned: { title: '🛵 Rider Assigned', body: `${data.rider?.name ?? 'Rider'} is coming to pick up your order.` },
      picked_up:      { title: '📦 Order Picked Up', body: 'Rider has your order and is heading your way.' },
      on_the_way:     { title: '🛵 On the Way', body: 'Your order is ~15 min away.' },
      nearby:         { title: '📍 Almost There!', body: 'Rider is less than 2 min away.' },
      delivered:      { title: '🎉 Delivered!', body: 'Hope you enjoy your meal! Rate your experience.' },
    };
    const msg = MESSAGES[data.status];
    if (msg) store.dispatch(showNotification({ type: 'order_status', ...msg, orderId: data.orderId }));
  }

  /** Join an order room to receive real-time updates */
  joinOrderRoom(orderId, customerId) {
    if (!this.socket) this.connect();
    this.currentOrderRoom = orderId;
    this.socket.emit('join_order', { orderId, customerId });
    console.log('[Socket] Joined order room:', orderId);
  }

  leaveOrderRoom(orderId) {
    this.socket?.emit('leave_order', { orderId });
    this.currentOrderRoom = null;
  }

  joinRestaurantRoom(restaurantId) {
    if (!this.socket) this.connect();
    this.socket.emit('join_restaurant', { restaurantId });
  }

  /** Restaurant: accept order */
  acceptOrder(orderId, restaurantId) {
    this.socket?.emit('accept_order', { orderId, restaurantId });
  }

  /** Restaurant: reject order */
  rejectOrder(orderId, reason) {
    this.socket?.emit('reject_order', { orderId, reason });
  }

  /** Rider: mark order picked up */
  markPickedUp(orderId, riderId) {
    this.socket?.emit('order_picked_up', { orderId, riderId });
  }

  /** Rider: emit GPS location */
  emitRiderLocation(riderId, lat, lng, heading, orderId) {
    this.socket?.emit('rider_location', { riderId, lat, lng, heading, orderId });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
  }

  getSocket() { return this.socket; }
  getConnectionStatus() { return this.isConnected; }
}

// Singleton
const socketService = new SocketService();
export default socketService;

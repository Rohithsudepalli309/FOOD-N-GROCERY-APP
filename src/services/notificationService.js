/**
 * Notification Service — FCM + expo-notifications
 * Handles push token registration, permission requests, and deep-link routing
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import { ROUTES } from '../constants/routes';
import { SERVER_URL } from '../constants/config';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification type → screen route mapping
const NOTIFICATION_ROUTES = {
  order_placed:    ROUTES.ORDER_STATUS,
  order_confirmed: ROUTES.ORDER_STATUS,
  rider_assigned:  ROUTES.LIVE_TRACKING,
  order_delivered: ROUTES.ORDER_SUMMARY,
  promo:           ROUTES.HOME,
  grocery_restock: ROUTES.GROCERY_STORE,
};

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.navigationRef = null;
  }

  /** Call this once in App.js after navigation is ready */
  async init(navigationRef) {
    this.navigationRef = navigationRef;
    await this._requestPermissions();
    await this._registerToken();
    this._setupListeners();
  }

  async _requestPermissions() {
    if (!Device.isDevice) {
      console.log('[Notifications] Not a physical device — skipping push setup');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission denied');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF5722',
      });
      await Notifications.setNotificationChannelAsync('promos', {
        name: 'Promotions & Offers',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  }

  async _registerToken() {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      });
      this.expoPushToken = tokenData.data;
      console.log('[Notifications] Push token:', this.expoPushToken);

      // Register token with server
      await axios.post(`${SERVER_URL}/api/notifications/register`, {
        token: this.expoPushToken,
        platform: Platform.OS,
      }).catch(() => {}); // Don't fail if server is down
    } catch (err) {
      console.warn('[Notifications] Token registration failed:', err.message);
    }
  }

  _setupListeners() {
    // Foreground notification received
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notifications] Received:', notification.request.content.title);
    });

    // User tapped a notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      this._handleDeepLink(data);
    });
  }

  _handleDeepLink(data) {
    if (!this.navigationRef?.isReady()) return;
    const route = NOTIFICATION_ROUTES[data?.type];
    if (route && data.orderId) {
      this.navigationRef.navigate(route, { orderId: data.orderId });
    }
  }

  /** Send a LOCAL notification (for testing / in-app alerts) */
  async sendLocalNotification({ title, body, data = {}, channelId = 'orders' }) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true, priority: 'high' },
      trigger: null, // immediate
    });
  }

  /** Simulate push notification (dev mode) */
  async simulatePush(type, orderId) {
    const TEMPLATES = {
      rider_assigned: { title: '🛵 Rider Assigned!', body: 'Rahul is on his way to pick up your order.' },
      on_the_way:     { title: '🛵 On the Way!', body: 'Your order is heading your way — ~15 min.' },
      delivered:      { title: '🎉 Order Delivered!', body: 'Enjoy your meal! Please rate your experience.' },
    };
    const t = TEMPLATES[type] || { title: 'F&G Update', body: 'Your order status has changed.' };
    await this.sendLocalNotification({ ...t, data: { type, orderId } });
  }

  cleanup() {
    this.notificationListener?.remove();
    this.responseListener?.remove();
  }

  getToken() { return this.expoPushToken; }
}

const notificationService = new NotificationService();
export default notificationService;

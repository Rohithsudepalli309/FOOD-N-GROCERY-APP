/**
 * Notification Service — FCM Push, SMS, In-App
 * Port: 3006
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');
const { createLogger } = require('../../shared/utils/logger.js');

const logger = createLogger('notification-service');
const app = express();
app.use(cors()); app.use(express.json());

let fcmAvailable = false;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    fcmAvailable = true;
    logger.info('Firebase Admin SDK initialized for FCM');
  } else {
    logger.warn('FIREBASE_SERVICE_ACCOUNT_BASE64 missing - Push notifications simulated');
  }
} catch (e) {
  logger.error('Failed to initialize Firebase Admin', { error: e.message });
}

// In-memory FCM token registry
const tokenRegistry = new Map(); // userId → { token, platform }

// ── Templates ──────────────────────────────────────────────────────────────
const NOTIFICATION_TEMPLATES = {
  order_placed:    { title: '✅ Order Placed!',      body: 'Your order has been placed. Restaurant notified.' },
  confirmed:       { title: '🍳 Order Confirmed!',   body: 'Restaurant has accepted your order.' },
  preparing:       { title: '👨‍🍳 Cooking Started',  body: 'Your food is being freshly prepared!' },
  rider_assigned:  { title: '🛵 Rider Assigned',     body: '{{riderName}} will deliver your order.' },
  picked_up:       { title: '📦 Order Picked Up',    body: 'Rider has your order and is on the way!' },
  on_the_way:      { title: '🛵 On the Way!',        body: 'Your order is approximately 15 min away.' },
  nearby:          { title: '📍 Almost There!',       body: 'Rider is less than 2 minutes away!' },
  delivered:       { title: '🎉 Order Delivered!',   body: 'Enjoy your meal! Rate your experience.' },
  rating_prompt:   { title: '⭐ How was your order?', body: 'Tap to rate your experience. Takes 10 seconds!' },
  wallet_credit:   { title: '💰 FG Pay Credit!',     body: '₹{{amount}} cashback credited to your wallet.' },
  promo:           { title: '🎁 Exclusive Offer!',   body: '{{promoText}}' },
};

function fillTemplate(template, vars = {}) {
  let { title, body } = template;
  Object.entries(vars).forEach(([k, v]) => {
    title = title.replace(`{{${k}}}`, v);
    body = body.replace(`{{${k}}}`, v);
  });
  return { title, body };
}

// ── Endpoints ──────────────────────────────────────────────────────────────

// POST /api/notifications/register — Register FCM token
app.post('/api/notifications/register', (req, res) => {
  const { userId, token, platform } = req.body;
  if (!userId || !token) return res.status(400).json({ error: 'userId and token required' });
  tokenRegistry.set(userId, { token, platform: platform || 'android' });
  res.json({ success: true });
});

// POST /api/notifications/send — Send push notification
app.post('/api/notifications/send', async (req, res) => {
  const { userId, type, vars = {}, data = {}, imageUrl } = req.body;

  const template = NOTIFICATION_TEMPLATES[type];
  if (!template) return res.status(400).json({ error: `Unknown notification type: ${type}` });

  const { title, body } = fillTemplate(template, vars);
  const userToken = tokenRegistry.get(userId);

  if (!userToken) {
    logger.info(`No FCM token for user ${userId} — skipping push`);
    return res.json({ success: true, delivered: false, reason: 'no_token' });
  }

  if (fcmAvailable) {
    try {
      const message = {
        token: userToken.token,
        notification: { title, body },
        data: { type, orderId: data.orderId || '', ...data },
        android: { priority: 'high', notification: { channelId: 'orders', sound: 'default' } },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } }
      };
      
      if (imageUrl) message.notification.imageUrl = imageUrl;

      const response = await admin.messaging().send(message);
      logger.info(`Sent FCM push to user ${userId}`, { title, messageId: response });
    } catch (err) {
      logger.warn(`FCM push declined`, { error: err.message, userId });
      if (err.code === 'messaging/registration-token-not-registered') {
        tokenRegistry.delete(userId); // Cleanup dead tokens
      }
    }
  } else {
    logger.info(`DEV MODE Push`, { type, title, userId });
  }

  res.json({ success: true, delivered: fcmAvailable, title, body });
});

// POST /api/notifications/broadcast — Send to multiple users
app.post('/api/notifications/broadcast', async (req, res) => {
  const { userIds, type, vars = {} } = req.body;
  const results = await Promise.allSettled(
    userIds.map(userId => axios.post(`http://localhost:${PORT}/api/notifications/send`, { userId, type, vars }).catch(() => {})),
  );
  res.json({ success: true, sent: results.filter(r => r.status === 'fulfilled').length, total: userIds.length });
});

// GET /api/notifications/health
app.get('/api/notifications/health', (_, res) => res.json({ service: 'notification-service', status: 'ok', registeredDevices: tokenRegistry.size }));

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => logger.info(`🔔 Notification Service on port ${PORT}`));

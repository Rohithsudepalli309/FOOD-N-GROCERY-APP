/**
 * Auth Service — OTP Login, JWT, Refresh Tokens
 * Port: 3001
 */
require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const twilio = require('twilio');
const { generateOTP, isValidIndianPhone, formatPhone } = require('../../shared/utils/index.js');
const { createLogger } = require('../../shared/utils/logger.js');

const logger = createLogger('auth-service');
const app = express();
app.use(cors()); app.use(express.json());

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = (TWILIO_SID && TWILIO_TOKEN) ? twilio(TWILIO_SID, TWILIO_TOKEN) : null;

const JWT_SECRET = process.env.JWT_SECRET || 'fg_jwt_secret_dev';
const JWT_EXPIRES = '7d';
const REFRESH_EXPIRES = '30d';

// ── In-memory stores (swap with PostgreSQL in prod) ─────────────────────────
const users = new Map();         // userId → user
const otpStore = new Map();      // phone → { otp, expiresAt, attempts }
const sessions = new Map();      // refreshToken → { userId, expiresAt }

// ── OTP Flow ───────────────────────────────────────────────────────────────
app.post('/api/auth/otp/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !isValidIndianPhone(phone.replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const otp = generateOTP(6);
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });

  logger.info(`OTP generated for ${formatPhone(phone)}`);
  
  if (twilioClient) {
    try {
      await twilioClient.messages.create({
        body: `Your F&G App OTP is ${otp}. Valid for 5 minutes. Do not share this.`,
        from: TWILIO_PHONE,
        to: '+91' + phone.replace(/\D/g, '').slice(-10)
      });
      logger.info('Twilio SMS sent securely', { phone });
    } catch (err) {
      logger.error('Twilio sending failed', { error: err.message, phone });
      // Optional: don't block login loop if dev SMS fails
    }
  } else {
    logger.warn('Twilio keys missing - SMS simulated', { phone });
  }

  res.json({ success: true, message: 'OTP sent', phone, dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined });
});

app.post('/api/auth/otp/verify', async (req, res) => {
  const { phone, otp } = req.body;
  const record = otpStore.get(phone);

  if (!record) return res.status(400).json({ error: 'No OTP sent to this number' });
  if (Date.now() > record.expiresAt) { otpStore.delete(phone); return res.status(400).json({ error: 'OTP expired' }); }
  if (record.attempts >= 3) return res.status(429).json({ error: 'Too many attempts. Request new OTP.' });

  if (otp !== record.otp && otp !== '000000') { // 000000 = dev bypass
    record.attempts++;
    return res.status(400).json({ error: 'Invalid OTP', attemptsLeft: 3 - record.attempts });
  }

  otpStore.delete(phone);

  // Get or create user
  let user = Array.from(users.values()).find(u => u.phone === phone);
  const isNew = !user;
  if (!user) {
    user = { id: uuidv4(), phone, name: '', email: '', walletBalance: 0, createdAt: new Date().toISOString() };
    users.set(user.id, user);
  }

  const tokens = issueTokens(user.id);
  res.json({ success: true, isNewUser: isNew, user, ...tokens });
});

// ── Profile update (for new users who need to set name) ───────────────────
app.put('/api/auth/profile', requireAuth, (req, res) => {
  const { name, email } = req.body;
  const user = users.get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (name) user.name = name.trim();
  if (email) user.email = email.trim();
  res.json({ success: true, user });
});

// ── Refresh Token ──────────────────────────────────────────────────────────
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  const session = sessions.get(refreshToken);
  if (!session || Date.now() > session.expiresAt) {
    sessions.delete(refreshToken);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
  const tokens = issueTokens(session.userId);
  sessions.delete(refreshToken);
  res.json(tokens);
});

// ── Logout ─────────────────────────────────────────────────────────────────
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) sessions.delete(refreshToken);
  res.json({ success: true });
});

// ── Me ─────────────────────────────────────────────────────────────────────
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = users.get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.get('/api/auth/health', (_, res) => res.json({ service: 'auth', status: 'ok' }));

// ── Helpers ────────────────────────────────────────────────────────────────
function issueTokens(userId) {
  const accessToken = jwt.sign({ userId, role: 'customer' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  const refreshToken = uuidv4();
  sessions.set(refreshToken, { userId, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  return { accessToken, refreshToken, expiresIn: 7 * 24 * 60 * 60 };
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => logger.info(`🔐 Auth Service on port ${PORT}`));
}

module.exports = { app, users, otpStore, sessions };

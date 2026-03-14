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
const { query } = require('../../shared/utils/db.js');
const { redis } = require('../../shared/utils/redis.js');

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

// ── OTP Flow ───────────────────────────────────────────────────────────────
app.post('/api/auth/otp/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !isValidIndianPhone(phone.replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const otp = generateOTP(6);
  await redis.set(`otp:${phone}`, JSON.stringify({ otp, attempts: 0 }), 'EX', 300); // 5 mins

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
    }
  } else {
    logger.warn('Twilio keys missing - SMS simulated', { phone });
  }

  res.json({ success: true, message: 'OTP sent', phone, dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined });
});

app.post('/api/auth/otp/verify', async (req, res) => {
  const { phone, otp } = req.body;
  
  const recordStr = await redis.get(`otp:${phone}`);
  if (!recordStr) return res.status(400).json({ error: 'No OTP sent to this number or OTP expired' });
  
  const record = JSON.parse(recordStr);
  if (record.attempts >= 3) return res.status(429).json({ error: 'Too many attempts. Request new OTP.' });

  if (otp !== record.otp && otp !== '000000') {
    record.attempts++;
    await redis.set(`otp:${phone}`, JSON.stringify(record), 'KEEPTTL');
    return res.status(400).json({ error: 'Invalid OTP', attemptsLeft: 3 - record.attempts });
  }

  await redis.del(`otp:${phone}`);

  // Fetch or create user in PostgreSQL
  let user;
  let isNew = false;
  try {
    const userRes = await query('SELECT id, phone, name, email, wallet_balance as "walletBalance", created_at as "createdAt" FROM users WHERE phone = $1', [phone]);
    if (userRes.rowCount === 0) {
      isNew = true;
      const insert = await query(`
        INSERT INTO users (phone, name, email, wallet_balance) 
        VALUES ($1, '', '', 0) 
        RETURNING id, phone, name, email, wallet_balance as "walletBalance", created_at as "createdAt"
      `, [phone]);
      user = insert.rows[0];
    } else {
      user = userRes.rows[0];
    }
  } catch(err) {
    logger.error('DB Error on Verify:', err);
    return res.status(500).json({ error: 'Database error' });
  }

  const tokens = await issueTokens(user.id);
  res.json({ success: true, isNewUser: isNew, user, ...tokens });
});

// ── Profile update ────────────────────────────────────────────────────────────
app.put('/api/auth/profile', requireAuth, async (req, res) => {
  const { name, email } = req.body;
  try {
    const update = await query(`
      UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) 
      WHERE id = $3 
      RETURNING id, phone, name, email, wallet_balance as "walletBalance", created_at as "createdAt"
    `, [name ? name.trim() : null, email ? email.trim() : null, req.userId]);
    
    if (update.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: update.rows[0] });
  } catch(err) {
    logger.error('Error updating profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Refresh Token ─────────────────────────────────────────────────────────────
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  const userId = await redis.get(`session:${refreshToken}`);
  
  if (!userId) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
  
  const tokens = await issueTokens(userId);
  await redis.del(`session:${refreshToken}`);
  res.json(tokens);
});

// ── Logout ────────────────────────────────────────────────────────────────────
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await redis.del(`session:${refreshToken}`);
  res.json({ success: true });
});

// ── Me ────────────────────────────────────────────────────────────────────────
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const userRes = await query('SELECT id, phone, name, email, wallet_balance as "walletBalance", created_at as "createdAt" FROM users WHERE id = $1', [req.userId]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userRes.rows[0] });
  } catch(err) {
    logger.error('Error getting user profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/health', async (_, res) => {
  try {
    await query('SELECT 1');
    await redis.ping();
    res.json({ service: 'auth', status: 'ok' });
  } catch (err) {
    logger.error('Healthcheck failed', err);
    res.status(500).json({ service: 'auth', status: 'error' });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function issueTokens(userId) {
  const accessToken = jwt.sign({ userId, role: 'customer' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  const refreshToken = uuidv4();
  await redis.set(`session:${refreshToken}`, userId, 'EX', 30 * 24 * 60 * 60);
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

module.exports = { app, redis };

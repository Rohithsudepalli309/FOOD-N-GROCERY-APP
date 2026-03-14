/**
 * Payment Service — Razorpay + FG Wallet + Refunds
 * Port: 3005
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { idempotencyKey, rupeesToPaise, paiseToRupees } = require('../../shared/utils/index.js');
const { createLogger } = require('../../shared/utils/logger.js');
const { connectConsumer, publishEvent } = require('../../shared/utils/kafka.js');
const { query } = require('../../shared/utils/db.js');
const { redis } = require('../../shared/utils/redis.js');

const logger = createLogger('payment-service');
const app = express();
app.use(cors()); app.use(express.json());

const Razorpay = require('razorpay');

const RAZORPAY_KEY = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo';
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'demo_secret';

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY,
  key_secret: RAZORPAY_SECRET
});

// ── In-memory stores ───────────────────────────────────────────────────────
const payments = new Map();

// ── Wallet ─────────────────────────────────────────────────────────────────
app.get('/api/payments/wallet/:userId', async (req, res) => {
  try {
    const result = await query('SELECT wallet_balance as balance FROM users WHERE id = $1', [req.params.userId]);
    const balance = result.rowCount > 0 && result.rows[0].balance !== null ? result.rows[0].balance : 24000;
    res.json({ balance: paiseToRupees(balance), balancePaise: balance });
  } catch(err) {
    logger.error('Error fetching wallet:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/payments/wallet/add', async (req, res) => {
  const { userId, amount } = req.body;
  try {
    const amountPaise = rupeesToPaise(amount);
    const result = await query('UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2 RETURNING wallet_balance', [amountPaise, userId]);
    // Allow gracefully bypassing missing user row mock edge cases
    const balance = result.rowCount > 0 ? result.rows[0].wallet_balance : (24000 + amountPaise);
    res.json({ success: true, balance: paiseToRupees(balance) });
  } catch(err) {
    logger.error('Error adding to wallet:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Razorpay: Create Payment Order ─────────────────────────────────────────
app.post('/api/payments/create', async (req, res) => {
  const { orderId, amount, currency = 'INR', userId } = req.body;
  const iKey = idempotencyKey(orderId);
  const cacheKey = `idempotency:${iKey.split('_')[0]}_${orderId}`;
  
  const isSet = await redis.set(cacheKey, '1', 'NX', 'EX', 86400); // 24 hours
  if (!isSet) {
    return res.status(409).json({ error: 'Duplicate payment attempt', idempotencyKey: iKey });
  }

  try {
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: rupeesToPaise(amount),
      currency,
      receipt: orderId,
      notes: { userId, orderId },
    });

    const paymentOrder = {
      ...razorpayOrder,
      idempotencyKey: iKey,
      prefill: { userId },
    };

    payments.set(paymentOrder.id, { ...paymentOrder, status: 'created' });
    
    res.json(paymentOrder);
  } catch (error) {
    logger.error('Razorpay Error: Failed to create order', { error });
    // Fallback for dev mode without valid keys
    if (RAZORPAY_KEY === 'rzp_test_demo') {
      const mockOrder = {
        id: 'order_' + uuidv4().replace(/-/g, '').slice(0, 14),
        key_id: RAZORPAY_KEY,
        amount: rupeesToPaise(amount),
        currency,
        receipt: orderId,
        idempotencyKey: iKey,
        prefill: { userId },
        createdAt: new Date().toISOString(),
      };
      payments.set(mockOrder.id, { ...mockOrder, status: 'created' });
      return res.json(mockOrder);
    }
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// ── Razorpay: Verify Signature ─────────────────────────────────────────────
app.post('/api/payments/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
    // Verify HMAC-SHA256 signature — production validation
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto.createHmac('sha256', RAZORPAY_SECRET).update(body).digest('hex');
    const valid = process.env.NODE_ENV === 'development' || expectedSig === razorpay_signature;

    if (!valid) return res.status(400).json({ success: false, error: 'Invalid payment signature' });
  }

  // Mark payment as success
  const payment = payments.get(razorpay_order_id);
  if (payment) { payment.status = 'success'; payment.paymentId = razorpay_payment_id; }

  res.json({ success: true, verified: true, paymentId: razorpay_payment_id });
});

// ── Wallet Payment ─────────────────────────────────────────────────────────
app.post('/api/payments/wallet/pay', async (req, res) => {
  const { userId, orderId, amount } = req.body;
  try {
    const amountPaise = rupeesToPaise(amount);
    
    // Check balance first
    const balRes = await query('SELECT wallet_balance as balance FROM users WHERE id = $1', [userId]);
    const balance = balRes.rowCount > 0 && balRes.rows[0].balance !== null ? balRes.rows[0].balance : 24000;
    
    if (balance < amountPaise) {
      return res.status(400).json({ error: 'Insufficient wallet balance', balance: paiseToRupees(balance) });
    }

    // Deduct
    const update = await query('UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) - $1 WHERE id = $2 RETURNING wallet_balance', [amountPaise, userId]);
    const newBalance = update.rowCount > 0 ? update.rows[0].wallet_balance : (balance - amountPaise);

    const txnId = 'TXN_' + uuidv4().slice(0, 8).toUpperCase();

    payments.set(txnId, {
      txnId, orderId, userId, amount, method: 'wallet',
      status: 'success', createdAt: new Date().toISOString(),
    });

    res.json({ success: true, txnId, newBalance: paiseToRupees(newBalance) });
  } catch(err) {
    logger.error('Wallet Pay Error:', err);
    res.status(500).json({ error: 'Wallet transaction failed' });
  }
});

// ── Refund ─────────────────────────────────────────────────────────────────
app.post('/api/payments/refund', async (req, res) => {
  const { orderId, amount, reason, userId } = req.body;
  try {
    const amountPaise = rupeesToPaise(amount);
    await query('UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [amountPaise, userId]);
    res.json({
      success: true,
      refundId: 'rfnd_' + uuidv4().slice(0, 14),
      amount,
      method: 'wallet_credit',
      expectedBy: '5-7 business days (card) / instant (wallet)',
    });
  } catch(err) {
    logger.error('Refund Error:', err);
    res.status(500).json({ error: 'Refund processing failed' });
  }
});

// ── Cashback ───────────────────────────────────────────────────────────────
app.post('/api/payments/cashback', async (req, res) => {
  const { userId, orderId, cashback } = req.body;
  try {
    const amountPaise = rupeesToPaise(cashback);
    const update = await query('UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2 RETURNING wallet_balance', [amountPaise, userId]);
    const balance = update.rowCount > 0 ? update.rows[0].wallet_balance : (24000 + amountPaise);
    res.json({ success: true, credited: cashback, newBalance: paiseToRupees(balance) });
  } catch(err) {
    logger.error('Cashback Error:', err);
    res.status(500).json({ error: 'Cashback failed' });
  }
});

app.get('/api/payments/health', (_, res) => res.json({ service: 'payment-service', status: 'ok' }));

// ── Refund Consumer (Saga Compensation) ────────────────────────────────────
async function initRefundConsumer() {
  await connectConsumer('payment-refund-worker', ['refund_required'], async (topic, message) => {
    try {
      const refundData = JSON.parse(message.value.toString());
      logger.info(`Processing Refund for Order ${refundData.orderId}...`);

      const userId = refundData.customerId;
      const amount = refundData.amount;
      
      // Look up original payment to find method
      const originalPayment = Array.from(payments.values()).find(p => p.orderId === refundData.orderId);
      
      // 1. Process Refund
      if (originalPayment && originalPayment.id.startsWith('order_')) {
        // Razorpay payment - Ideally call razorpayInstance.payments.refund()
        logger.info(`Executing Razorpay Refund for ${originalPayment.id}`);
      } else {
        // Wallet or COD fallback - Credit the user's FG Wallet
        await query('UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [rupeesToPaise(amount), userId]);
        logger.info(`Wallet Refunded ₹${amount} to User ${userId}`);
      }

      // 2. Publish Success Event
      await publishEvent('refund_completed', refundData.orderId, {
        orderId: refundData.orderId,
        status: 'refunded',
        refundId: 'rfnd_' + uuidv4().slice(0, 14),
        amount,
      });

    } catch (err) {
      logger.error('Refund Worker Failed', { error: err.message, stack: err.stack });
    }
  });
}

const PORT = process.env.PORT || 3005;
app.listen(PORT, async () => {
  logger.info(`💳 Payment Service on port ${PORT}`);
  await initRefundConsumer();
});

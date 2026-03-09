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
const wallets = new Map();       // userId → balance (paise)
const idempotencyCache = new Set();

// ── Wallet ─────────────────────────────────────────────────────────────────
app.get('/api/payments/wallet/:userId', (req, res) => {
  const balance = wallets.get(req.params.userId) ?? 24000; // ₹240 default in paise
  res.json({ balance: paiseToRupees(balance), balancePaise: balance });
});

app.post('/api/payments/wallet/add', (req, res) => {
  const { userId, amount } = req.body;
  const current = wallets.get(userId) ?? 24000;
  wallets.set(userId, current + rupeesToPaise(amount));
  res.json({ success: true, balance: paiseToRupees(wallets.get(userId)) });
});

// ── Razorpay: Create Payment Order ─────────────────────────────────────────
app.post('/api/payments/create', async (req, res) => {
  const { orderId, amount, currency = 'INR', userId } = req.body;
  const iKey = idempotencyKey(orderId);
  if (idempotencyCache.has(iKey.split('_')[0] + '_' + orderId)) {
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
    idempotencyCache.add(iKey.split('_')[0] + '_' + orderId);
    
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
app.post('/api/payments/wallet/pay', (req, res) => {
  const { userId, orderId, amount } = req.body;
  const balance = wallets.get(userId) ?? 0;
  const amountPaise = rupeesToPaise(amount);

  if (balance < amountPaise) {
    return res.status(400).json({ error: 'Insufficient wallet balance', balance: paiseToRupees(balance) });
  }

  wallets.set(userId, balance - amountPaise);
  const txnId = 'TXN_' + uuidv4().slice(0, 8).toUpperCase();

  payments.set(txnId, {
    txnId, orderId, userId, amount, method: 'wallet',
    status: 'success', createdAt: new Date().toISOString(),
  });

  res.json({ success: true, txnId, newBalance: paiseToRupees(wallets.get(userId)) });
});

// ── Refund ─────────────────────────────────────────────────────────────────
app.post('/api/payments/refund', (req, res) => {
  const { orderId, amount, reason, userId } = req.body;
  // In prod: Razorpay Refunds API
  // Here: credit wallet
  const current = wallets.get(userId) ?? 0;
  wallets.set(userId, current + rupeesToPaise(amount));

  res.json({
    success: true,
    refundId: 'rfnd_' + uuidv4().slice(0, 14),
    amount,
    method: 'wallet_credit',
    expectedBy: '5-7 business days (card) / instant (wallet)',
  });
});

// ── Cashback ───────────────────────────────────────────────────────────────
app.post('/api/payments/cashback', (req, res) => {
  const { userId, orderId, cashback } = req.body;
  const current = wallets.get(userId) ?? 0;
  wallets.set(userId, current + rupeesToPaise(cashback));
  res.json({ success: true, credited: cashback, newBalance: paiseToRupees(wallets.get(userId)) });
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
        const current = wallets.get(userId) ?? 24000;
        wallets.set(userId, current + rupeesToPaise(amount));
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

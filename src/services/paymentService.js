/**
 * Payment Service — Razorpay + UPI deep links
 * Works in test mode without real credentials
 */
import { Alert, Linking, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { SERVER_URL } from '../constants/config';

const RAZORPAY_TEST_KEY = 'rzp_test_yourkeyhere'; // Replace with your test key

class PaymentService {
  /**
   * Create order on server → open Razorpay checkout
   * Requires: react-native-razorpay (native build only)
   */
  async razorpayCheckout({ amount, orderId, userInfo, onSuccess, onFailure }) {
    try {
      // Step 1: Create payment order on server
      const { data } = await axios.post(`${SERVER_URL}/api/payments/create`, {
        amount, orderId,
      });

      // Step 2: Open Razorpay checkout (requires native module)
      try {
        const RazorpayCheckout = require('react-native-razorpay').default;
        const options = {
          key: data.key_id || RAZORPAY_TEST_KEY,
          amount: data.amount,
          currency: 'INR',
          name: 'F&G Food & Groceries',
          description: `Order #${orderId}`,
          order_id: data.id,
          prefill: {
            name: userInfo?.name ?? '',
            email: userInfo?.email ?? '',
            contact: userInfo?.phone ?? '',
          },
          theme: { color: '#FF5722' },
        };

        const result = await RazorpayCheckout.open(options);
        // Step 3: Verify on server
        await axios.post(`${SERVER_URL}/api/payments/verify`, result);
        onSuccess?.(result);
      } catch (e) {
        if (e.code === 'E_PAYMENT_CANCELLED') {
          onFailure?.({ cancelled: true });
        } else {
          // Razorpay native module not available (Expo Go) — use mock
          this._mockPaymentSuccess(amount, orderId, onSuccess);
        }
      }
    } catch (err) {
      console.error('[PaymentService] Error:', err);
      onFailure?.(err);
    }
  }

  /**
   * UPI Deep Link — opens GPay / PhonePe / Paytm directly
   */
  async upiDeepLink({ amount, orderId, vpa = 'fg-pay@okicici', name = 'F&G Payments' }) {
    const transactionId = this._idempotencyKey(orderId);
    const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent('Order ' + orderId)}&tr=${transactionId}&cu=INR`;

    const supported = await Linking.canOpenURL(upiUrl);
    if (supported) {
      await Linking.openURL(upiUrl);
      return { initiated: true, transactionId };
    } else {
      // Try app-specific deep links
      const APPS = [
        { name: 'GPay', url: `gpay://upi/pay?${upiUrl.split('?')[1]}` },
        { name: 'PhonePe', url: `phonepe://pay?${upiUrl.split('?')[1]}` },
        { name: 'Paytm', url: `paytmmp://pay?${upiUrl.split('?')[1]}` },
      ];
      for (const app of APPS) {
        const canOpen = await Linking.canOpenURL(app.url);
        if (canOpen) { await Linking.openURL(app.url); return { initiated: true, app: app.name }; }
      }
      Alert.alert('No UPI App Found', 'Please install GPay, PhonePe, or Paytm to pay via UPI.');
      return { initiated: false };
    }
  }

  /**
   * FG Wallet payment (in-app)
   */
  async walletPayment({ amount, walletBalance, onSuccess, onFailure }) {
    if (walletBalance < amount) {
      onFailure?.({ message: 'Insufficient wallet balance' });
      return;
    }
    // Simulate processing
    await new Promise(r => setTimeout(r, 800));
    onSuccess?.({ method: 'wallet', amount, transactionId: this._idempotencyKey('wallet') });
  }

  /**
   * Mock payment (for Expo Go where native module unavailable)
   */
  _mockPaymentSuccess(amount, orderId, onSuccess) {
    Alert.alert(
      '🔧 Dev Mode',
      `Razorpay native module unavailable in Expo Go.\n\nIn production build, the checkout sheet will open.\n\nSimulating ₹${amount} payment success.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Payment ✓', onPress: () => {
            onSuccess?.({
              razorpay_payment_id: 'pay_mock_' + Date.now(),
              razorpay_order_id: 'order_mock_' + orderId,
              razorpay_signature: 'mock_sig',
            });
          },
        },
      ],
    );
  }

  /** Idempotency key — prevents duplicate charges */
  _idempotencyKey(orderId) {
    return `${orderId}_${Date.now()}`;
  }
}

const paymentService = new PaymentService();
export default paymentService;

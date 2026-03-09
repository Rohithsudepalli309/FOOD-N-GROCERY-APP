import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { clearCart } from '../../store/slices/cartSlice';
import { placeOrder } from '../../store/slices/orderSlice';

const PAYMENT_METHODS = [
  { id: 'upi', icon: 'phone-portrait-outline', label: 'UPI', sub: 'PhonePe, GPay, Paytm', color: COLORS.accent },
  { id: 'card', icon: 'card-outline', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, Rupay', color: COLORS.purple },
  { id: 'wallet', icon: 'wallet-outline', label: 'FG Pay Wallet', sub: 'Balance: ₹240', color: COLORS.green },
  { id: 'cod', icon: 'cash-outline', label: 'Cash on Delivery', sub: 'Pay when order arrives', color: COLORS.yellow },
];

const SAVED_ADDRESSES = [
  { id: 'a1', label: 'Home', address: 'B-12, Sector 62, Noida, UP 201309', icon: 'home-outline' },
  { id: 'a2', label: 'Work', address: 'Tower A, DLF Cyber City, Gurugram, Haryana', icon: 'business-outline' },
];

export default function CheckoutScreen({ navigation, route }) {
  const { total } = route.params || { total: 0 };
  const dispatch = useDispatch();
  const [selectedAddress, setSelectedAddress] = useState('a1');
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = () => {
    setLoading(true);
    
    const payload = {
      restaurantId: '1', // Hardcoded for demo if cart doesn't store it
      items: [{ id: 'menu-1', quantity: 1, price: total }], // Simplified for demo
      total,
      paymentMethod: selectedPayment,
      deliveryAddress: Object.assign({}, SAVED_ADDRESSES.find(a => a.id === selectedAddress))
    };

    dispatch(placeOrder(payload)).unwrap()
      .then((liveOrder) => {
        dispatch(clearCart());
        navigation.replace(ROUTES.ORDER_SUMMARY, {
          orderId: liveOrder.id,
          total,
          eta: '35-45 min',
          paymentMethod: PAYMENT_METHODS.find(p => p.id === selectedPayment)?.label,
          address: payload.deliveryAddress.address,
        });
      })
      .catch((err) => {
        console.error('Order placement failed:', err);
        setLoading(false);
      });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Delivery Address */}
        <Text style={styles.sectionLabel}>📍 Delivery Address</Text>
        {SAVED_ADDRESSES.map(addr => (
          <TouchableOpacity
            key={addr.id}
            style={[styles.addressCard, selectedAddress === addr.id && styles.addressCardActive]}
            onPress={() => setSelectedAddress(addr.id)}
          >
            <View style={[styles.radioOuter, selectedAddress === addr.id && styles.radioActive]}>
              {selectedAddress === addr.id && <View style={styles.radioInner} />}
            </View>
            <Ionicons name={addr.icon} size={20} color={selectedAddress === addr.id ? COLORS.brand : COLORS.textMuted} />
            <View style={styles.addrInfo}>
              <Text style={styles.addrLabel}>{addr.label}</Text>
              <Text style={styles.addrText} numberOfLines={2}>{addr.address}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addAddrBtn}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.brand} />
          <Text style={styles.addAddrText}>Add New Address</Text>
        </TouchableOpacity>

        {/* Payment */}
        <Text style={[styles.sectionLabel, { marginTop: SIZES.space24 }]}>💳 Payment Method</Text>
        {PAYMENT_METHODS.map(pm => (
          <TouchableOpacity
            key={pm.id}
            style={[styles.payCard, selectedPayment === pm.id && { borderColor: pm.color }]}
            onPress={() => setSelectedPayment(pm.id)}
          >
            <View style={[styles.radioOuter, selectedPayment === pm.id && { borderColor: pm.color }]}>
              {selectedPayment === pm.id && <View style={[styles.radioInner, { backgroundColor: pm.color }]} />}
            </View>
            <View style={[styles.payIcon, { backgroundColor: pm.color + '20' }]}>
              <Ionicons name={pm.icon} size={20} color={pm.color} />
            </View>
            <View>
              <Text style={styles.payLabel}>{pm.label}</Text>
              <Text style={styles.paySub}>{pm.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Order Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Order Total</Text>
          <Text style={styles.totalVal}>₹{total}</Text>
        </View>

        {/* Delivery ETA */}
        <View style={styles.etaCard}>
          <Ionicons name="time-outline" size={18} color={COLORS.accent} />
          <Text style={styles.etaText}>Estimated delivery: <Text style={{ color: COLORS.accent, fontWeight: '700' }}>35–45 minutes</Text></Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder} disabled={loading}>
          <LinearGradient colors={loading ? ['#444', '#333'] : [COLORS.brand, COLORS.brandDark]} style={styles.placeOrderGrad}>
            {loading
              ? <Text style={styles.placeOrderText}>Placing Order...</Text>
              : <>
                  <Text style={styles.placeOrderText}>Place Order · ₹{total}</Text>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                </>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    paddingTop: 52, paddingBottom: SIZES.space12, paddingHorizontal: SIZES.space16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder,
  },
  backBtn: { padding: SIZES.space4 },
  title: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800' },
  scroll: { padding: SIZES.space16 },
  sectionLabel: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700', marginBottom: SIZES.space12 },
  addressCard: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space12,
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius12,
    borderWidth: 1.5, borderColor: COLORS.darkBorder,
    padding: SIZES.space14 ?? 14, marginBottom: SIZES.space10,
  },
  addressCardActive: { borderColor: COLORS.brand, backgroundColor: COLORS.brand + '08' },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.darkBorder2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: COLORS.brand },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.brand },
  addrInfo: { flex: 1 },
  addrLabel: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '700', marginBottom: 2 },
  addrText: { color: COLORS.textMuted, fontSize: SIZES.xs, lineHeight: 16 },
  addAddrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space8,
    paddingVertical: SIZES.space10,
  },
  addAddrText: { color: COLORS.brand, fontSize: SIZES.sm, fontWeight: '600' },
  payCard: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space12,
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius12,
    borderWidth: 1.5, borderColor: COLORS.darkBorder, padding: SIZES.space14 ?? 14,
    marginBottom: SIZES.space10,
  },
  payIcon: { width: 40, height: 40, borderRadius: SIZES.radius8, alignItems: 'center', justifyContent: 'center' },
  payLabel: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '700' },
  paySub: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  totalCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius12,
    borderWidth: 1, borderColor: COLORS.darkBorder,
    padding: SIZES.space16, marginTop: SIZES.space20,
  },
  totalLabel: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700' },
  totalVal: { color: COLORS.brand, fontSize: SIZES.xl, fontWeight: '900' },
  etaCard: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space8,
    backgroundColor: COLORS.accent + '10', borderRadius: SIZES.radius8,
    padding: SIZES.space10, marginTop: SIZES.space10,
  },
  etaText: { color: COLORS.textMuted, fontSize: SIZES.xs },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.dark, borderTopWidth: 1, borderTopColor: COLORS.darkBorder, padding: SIZES.space16,
  },
  placeOrderBtn: { borderRadius: SIZES.radius12, overflow: 'hidden' },
  placeOrderGrad: {
    height: SIZES.buttonHeight, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: SIZES.space10,
  },
  placeOrderText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '800' },
});

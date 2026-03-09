import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import CartItemComponent from '../../components/cart/CartItem';
import { selectCartItems, selectCartTotal, selectCartCount } from '../../store/slices/cartSlice';

const DELIVERY_FEE = 29;
const PLATFORM_FEE = 5;
const GST_RATE = 0.05;

export default function CartScreen({ navigation }) {
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartTotal);
  const count = useSelector(selectCartCount);
  const restaurantName = useSelector(s => s.cart.restaurantName);
  const coupon = useSelector(s => s.cart.coupon);
  const discount = useSelector(s => s.cart.discount);

  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + DELIVERY_FEE + PLATFORM_FEE + gst - discount;

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar style="light" />
        <Text style={{ fontSize: 72 }}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Add items to get started</Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate(ROUTES.HOME)}
        >
          <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} style={styles.browseBtnGrad}>
            <Text style={styles.browseBtnText}>Browse Restaurants</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        {restaurantName && <Text style={styles.restName}>{restaurantName}</Text>}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.section}>
          {items.map(item => <CartItemComponent key={item.id} item={item} />)}
        </View>

        {/* Delivery Note */}
        <View style={styles.delivNote}>
          <Ionicons name="flash" size={14} color={COLORS.green} />
          <Text style={styles.delivNoteText}>
            Delivering in <Text style={{ color: COLORS.green, fontWeight: '700' }}>30-45 min</Text>
          </Text>
        </View>

        {/* Coupon */}
        <TouchableOpacity style={styles.couponRow}>
          <Ionicons name="pricetag-outline" size={18} color={COLORS.brand} />
          <Text style={styles.couponText}>
            {coupon ? `Coupon applied: ${coupon}` : 'Apply Coupon / Promo Code'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Bill Summary */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Summary</Text>
          {[
            { label: `Item Total (${count} items)`, value: `₹${subtotal}` },
            { label: 'Delivery Fee', value: `₹${DELIVERY_FEE}` },
            { label: 'Platform Fee', value: `₹${PLATFORM_FEE}` },
            { label: `GST (${GST_RATE * 100}%)`, value: `₹${gst}` },
            ...(discount > 0 ? [{ label: `Discount (${coupon})`, value: `-₹${discount}`, green: true }] : []),
          ].map(r => (
            <View key={r.label} style={styles.billRow}>
              <Text style={styles.billLabel}>{r.label}</Text>
              <Text style={[styles.billValue, r.green && { color: COLORS.green }]}>{r.value}</Text>
            </View>
          ))}
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>To Pay</Text>
            <Text style={styles.billTotalVal}>₹{total}</Text>
          </View>
        </View>

        {/* Safety */}
        <View style={styles.safetyRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.accent} />
          <Text style={styles.safetyText}>All payments are 100% secure. Your data is protected.</Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerCount}>{count} items</Text>
          <Text style={styles.footerTotal}>₹{total}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate(ROUTES.CHECKOUT, { total })}
        >
          <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} style={styles.checkoutGrad}>
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  emptyContainer: { flex: 1, backgroundColor: COLORS.dark, alignItems: 'center', justifyContent: 'center', gap: SIZES.space12, padding: SIZES.space32 },
  emptyTitle: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800' },
  emptySub: { color: COLORS.textMuted, fontSize: SIZES.sm },
  browseBtn: { width: '100%', borderRadius: SIZES.radius12, overflow: 'hidden', marginTop: SIZES.space8 },
  browseBtnGrad: { height: SIZES.buttonHeight, alignItems: 'center', justifyContent: 'center' },
  browseBtnText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '700' },
  header: {
    paddingTop: 52, paddingBottom: SIZES.space12, paddingHorizontal: SIZES.space16,
    borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder,
  },
  title: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '900' },
  restName: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 4 },
  section: { padding: SIZES.space16 },
  delivNote: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space6,
    backgroundColor: COLORS.green + '10', margin: SIZES.space16, marginTop: 0,
    borderRadius: SIZES.radius8, padding: SIZES.space10,
  },
  delivNoteText: { color: COLORS.textMuted, fontSize: SIZES.xs },
  couponRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space10,
    backgroundColor: COLORS.darkCard, marginHorizontal: SIZES.space16,
    borderRadius: SIZES.radius12, padding: SIZES.space14 ?? 14,
    borderWidth: 1, borderColor: COLORS.brand + '44', marginBottom: SIZES.space16,
  },
  couponText: { flex: 1, color: COLORS.text, fontSize: SIZES.sm },
  billCard: {
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius16,
    borderWidth: 1, borderColor: COLORS.darkBorder,
    marginHorizontal: SIZES.space16, padding: SIZES.space16, marginBottom: SIZES.space12,
  },
  billTitle: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700', marginBottom: SIZES.space12 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.space8 },
  billLabel: { color: COLORS.textMuted, fontSize: SIZES.sm },
  billValue: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '600' },
  billDivider: { height: 1, backgroundColor: COLORS.darkBorder, marginVertical: SIZES.space10 },
  billTotal: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '800' },
  billTotalVal: { color: COLORS.brand, fontSize: SIZES.lg, fontWeight: '900' },
  safetyRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space8,
    marginHorizontal: SIZES.space16, marginBottom: SIZES.space8,
  },
  safetyText: { color: COLORS.textMuted, fontSize: SIZES.xs, flex: 1 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.dark, borderTopWidth: 1, borderTopColor: COLORS.darkBorder,
    padding: SIZES.space16, flexDirection: 'row', alignItems: 'center', gap: SIZES.space12,
  },
  footerInfo: { alignItems: 'flex-start' },
  footerCount: { color: COLORS.textMuted, fontSize: SIZES.xs },
  footerTotal: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '900' },
  checkoutBtn: { flex: 1, borderRadius: SIZES.radius12, overflow: 'hidden' },
  checkoutGrad: {
    height: SIZES.buttonHeight, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: SIZES.space8,
  },
  checkoutText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '700' },
});

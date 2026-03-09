import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { setActiveOrder } from '../../store/slices/orderSlice';

export default function OrderSummaryScreen({ navigation, route }) {
  const { orderId, total, eta, paymentMethod, address } = route.params || {};
  const dispatch = useDispatch();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Store active order
    dispatch(setActiveOrder({
      id: orderId, total, eta, status: 'placed',
      placedAt: new Date().toISOString(),
    }));

    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Success Animation */}
        <Animated.View style={[styles.successWrap, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={[COLORS.green, '#1e8c4a']} style={styles.successCircle}>
            <Ionicons name="checkmark" size={52} color={COLORS.white} />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.successTitle}>Order Placed! 🎉</Text>
          <Text style={styles.successSub}>Your order has been confirmed and will be delivered soon.</Text>
        </Animated.View>

        {/* Order Info Card */}
        <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
          <View style={styles.orderIdRow}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderId}>#{orderId}</Text>
          </View>

          {[
            { icon: 'time-outline', label: 'Estimated Delivery', val: eta ?? '35-45 min', color: COLORS.accent },
            { icon: 'location-outline', label: 'Delivering to', val: address ?? 'Home', color: COLORS.brand },
            { icon: 'card-outline', label: 'Payment', val: paymentMethod ?? 'UPI', color: COLORS.purple },
            { icon: 'cash-outline', label: 'Total Paid', val: `₹${total ?? 0}`, color: COLORS.green },
          ].map(r => (
            <View key={r.label} style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: r.color + '20' }]}>
                <Ionicons name={r.icon} size={16} color={r.color} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{r.label}</Text>
                <Text style={styles.infoVal} numberOfLines={1}>{r.val}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Progress Steps */}
        <Animated.View style={[styles.stepsCard, { opacity: fadeAnim }]}>
          <Text style={styles.stepsTitle}>Order Progress</Text>
          {[
            { icon: '✅', label: 'Order Placed', done: true },
            { icon: '👨‍🍳', label: 'Restaurant Preparing', done: false },
            { icon: '🛵', label: 'Rider Picking Up', done: false },
            { icon: '📍', label: 'Out for Delivery', done: false },
            { icon: '🏠', label: 'Delivered', done: false },
          ].map((s, i, arr) => (
            <View key={s.label} style={styles.step}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepCircle, s.done && styles.stepDone]}>
                  <Text style={{ fontSize: 14 }}>{s.icon}</Text>
                </View>
                {i < arr.length - 1 && <View style={[styles.stepLine, s.done && styles.stepLineDone]} />}
              </View>
              <Text style={[styles.stepLabel, s.done && { color: COLORS.text }]}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.replace(ROUTES.MAIN)}
        >
          <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} style={styles.trackGrad}>
            <Ionicons name="home" size={18} color={COLORS.white} />
            <Text style={styles.trackText}>Back to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.trackOutlineBtn}
          onPress={() => navigation.replace(ROUTES.ORDER_STATUS, { orderId })}
        >
          <Text style={styles.trackOutlineText}>Track Order →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  scroll: { padding: SIZES.space24, alignItems: 'center', paddingBottom: 120 },
  successWrap: { marginTop: SIZES.space40, marginBottom: SIZES.space24 },
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.green, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  successTitle: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '900', marginBottom: SIZES.space8, textAlign: 'center' },
  successSub: { color: COLORS.textMuted, fontSize: SIZES.sm, textAlign: 'center', lineHeight: 20, marginBottom: SIZES.space24 },
  infoCard: {
    width: '100%', backgroundColor: COLORS.darkCard,
    borderRadius: SIZES.radius16, borderWidth: 1, borderColor: COLORS.darkBorder,
    padding: SIZES.space16, marginBottom: SIZES.space16,
  },
  orderIdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.space16, paddingBottom: SIZES.space12, borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder },
  orderIdLabel: { color: COLORS.textMuted, fontSize: SIZES.sm },
  orderId: { color: COLORS.brand, fontSize: SIZES.md, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space12, marginBottom: SIZES.space12 },
  infoIcon: { width: 36, height: 36, borderRadius: SIZES.radius8, alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { color: COLORS.textMuted, fontSize: SIZES.xs },
  infoVal: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '700', marginTop: 2 },
  stepsCard: {
    width: '100%', backgroundColor: COLORS.darkCard,
    borderRadius: SIZES.radius16, borderWidth: 1, borderColor: COLORS.darkBorder, padding: SIZES.space16,
  },
  stepsTitle: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700', marginBottom: SIZES.space16 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.space12, marginBottom: 0 },
  stepLeft: { alignItems: 'center' },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.darkCard2, borderWidth: 1, borderColor: COLORS.darkBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDone: { backgroundColor: COLORS.green + '20', borderColor: COLORS.green },
  stepLine: { width: 2, height: 24, backgroundColor: COLORS.darkBorder, marginVertical: 2 },
  stepLineDone: { backgroundColor: COLORS.green },
  stepLabel: { color: COLORS.textMuted, fontSize: SIZES.sm, paddingTop: SIZES.space8 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.dark, borderTopWidth: 1, borderTopColor: COLORS.darkBorder,
    padding: SIZES.space16, gap: SIZES.space10,
  },
  trackBtn: { borderRadius: SIZES.radius12, overflow: 'hidden' },
  trackGrad: { height: SIZES.buttonHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.space8 },
  trackText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '700' },
  trackOutlineBtn: {
    height: SIZES.buttonHeight, borderWidth: 1.5, borderColor: COLORS.brand,
    borderRadius: SIZES.radius12, alignItems: 'center', justifyContent: 'center',
  },
  trackOutlineText: { color: COLORS.brand, fontSize: SIZES.md, fontWeight: '700' },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';

const STATUSES = [
  { key: 'placed', label: 'Order Placed', sub: 'We received your order', icon: 'receipt-outline', color: COLORS.brand, time: 'Just now' },
  { key: 'confirmed', label: 'Restaurant Confirmed', sub: 'The restaurant accepted your order', icon: 'checkmark-circle-outline', color: COLORS.accent, time: '2 min ago' },
  { key: 'preparing', label: 'Preparing', sub: 'Your food is being prepared', icon: 'restaurant-outline', color: COLORS.yellow, time: '5 min ago' },
  { key: 'picked', label: 'Rider Picked Up', sub: 'Rider is heading your way', icon: 'bicycle-outline', color: COLORS.purple, time: null },
  { key: 'delivered', label: 'Delivered', sub: 'Enjoy your meal!', icon: 'home-outline', color: COLORS.green, time: null },
];

export default function OrderStatusScreen({ navigation, route }) {
  const { orderId } = route.params || {};
  const [currentStep] = useState(2); // 0-indexed → 'preparing'

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1a0a00', '#0F0F0F']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order #{orderId ?? 'FG12345678'}</Text>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LIVE_TRACKING, { orderId })}>
          <View style={styles.mapBtn}>
            <Ionicons name="map-outline" size={18} color={COLORS.brand} />
            <Text style={styles.mapBtnText}>Map</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ETA Banner */}
        <View style={styles.etaBanner}>
          <View>
            <Text style={styles.etaMain}>~25 minutes</Text>
            <Text style={styles.etaLabel}>Estimated Arrival</Text>
          </View>
          <View style={styles.etaRight}>
            <Text style={{ fontSize: 40 }}>🛵</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          <Text style={styles.timelineTitle}>Order Timeline</Text>
          {STATUSES.map((s, i) => {
            const isDone = i <= currentStep;
            const isActive = i === currentStep;
            return (
              <View key={s.key} style={styles.step}>
                <View style={styles.stepLeft}>
                  <View style={[
                    styles.stepCircle,
                    isDone && { backgroundColor: s.color + '20', borderColor: s.color },
                    isActive && { shadowColor: s.color, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 },
                  ]}>
                    <Ionicons
                      name={isDone ? s.icon : 'ellipse-outline'}
                      size={18}
                      color={isDone ? s.color : COLORS.textDim}
                    />
                  </View>
                  {i < STATUSES.length - 1 && (
                    <View style={[styles.stepLine, isDone && { backgroundColor: s.color }]} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <View style={styles.stepTop}>
                    <Text style={[styles.stepLabel, isDone && { color: COLORS.text }]}>{s.label}</Text>
                    {isActive && (
                      <View style={[styles.activePill, { backgroundColor: s.color + '20' }]}>
                        <Text style={[styles.activePillText, { color: s.color }]}>IN PROGRESS</Text>
                      </View>
                    )}
                    {s.time && isDone && <Text style={styles.stepTime}>{s.time}</Text>}
                  </View>
                  {isDone && <Text style={styles.stepSub}>{s.sub}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Rider info */}
        <View style={styles.riderCard}>
          <Text style={styles.riderTitle}>Your Delivery Partner</Text>
          <View style={styles.riderRow}>
            <View style={styles.riderAvatar}>
              <Text style={{ fontSize: 24 }}>🧑‍🦱</Text>
            </View>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>Rahul Sharma</Text>
              <View style={styles.riderRating}>
                <Ionicons name="star" size={12} color={COLORS.yellow} />
                <Text style={styles.riderRatingText}>4.8 · 1,340 deliveries</Text>
              </View>
            </View>
            <View style={styles.riderActions}>
              <TouchableOpacity style={styles.riderActionBtn}>
                <Ionicons name="call" size={18} color={COLORS.green} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.riderActionBtn, { backgroundColor: COLORS.accent + '20' }]}>
                <Ionicons name="chatbubble-outline" size={18} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: SIZES.space16, paddingHorizontal: SIZES.space16,
    gap: SIZES.space12,
  },
  backBtn: { padding: SIZES.space4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '800' },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.red + '20', borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.space8, paddingVertical: 2, marginTop: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.red },
  liveText: { color: COLORS.red, fontSize: 9, fontWeight: '900' },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.brand + '20', borderRadius: SIZES.radius8,
    paddingHorizontal: SIZES.space10, paddingVertical: SIZES.space6,
    borderWidth: 1, borderColor: COLORS.brand + '44',
  },
  mapBtnText: { color: COLORS.brand, fontSize: SIZES.xs, fontWeight: '700' },
  scroll: { padding: SIZES.space16, paddingBottom: 40 },
  etaBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.brand + '15', borderRadius: SIZES.radius16,
    borderWidth: 1, borderColor: COLORS.brand + '33',
    padding: SIZES.space20, marginBottom: SIZES.space20,
  },
  etaMain: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '900' },
  etaLabel: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  etaRight: {},
  timeline: {
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius16,
    borderWidth: 1, borderColor: COLORS.darkBorder, padding: SIZES.space16, marginBottom: SIZES.space16,
  },
  timelineTitle: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700', marginBottom: SIZES.space16 },
  step: { flexDirection: 'row', gap: SIZES.space12, alignItems: 'flex-start', marginBottom: 0 },
  stepLeft: { alignItems: 'center' },
  stepCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.darkCard2, borderWidth: 1.5, borderColor: COLORS.darkBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLine: { width: 2, height: 28, backgroundColor: COLORS.darkBorder, marginVertical: 2 },
  stepContent: { flex: 1, paddingBottom: SIZES.space16 },
  stepTop: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space8, flexWrap: 'wrap' },
  stepLabel: { color: COLORS.textDim, fontSize: SIZES.sm, fontWeight: '700', flex: 1 },
  activePill: {
    borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.space8, paddingVertical: 2,
  },
  activePillText: { fontSize: 9, fontWeight: '900' },
  stepTime: { color: COLORS.textMuted, fontSize: 10 },
  stepSub: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  riderCard: {
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius16,
    borderWidth: 1, borderColor: COLORS.darkBorder, padding: SIZES.space16,
  },
  riderTitle: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '700', marginBottom: SIZES.space12 },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space12 },
  riderAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.darkCard2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.darkBorder,
  },
  riderInfo: { flex: 1 },
  riderName: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700' },
  riderRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  riderRatingText: { color: COLORS.textMuted, fontSize: SIZES.xs },
  riderActions: { flexDirection: 'row', gap: SIZES.space8 },
  riderActionBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.green + '20', alignItems: 'center', justifyContent: 'center',
  },
});

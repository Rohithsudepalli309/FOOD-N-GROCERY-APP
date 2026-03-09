import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import {
  selectActiveOrder, selectRiderLocation, selectRiderDetails,
  selectStatusTimeline, selectStatusDisplay,
} from '../../store/slices/orderSlice';
import socketService from '../../services/socketService';
import notificationService from '../../services/notificationService';

const { width, height } = Dimensions.get('window');

// Rider marker animated component
function RiderMarker({ heading }) {
  const rotateAnim = useRef(new Animated.Value(heading ?? 0)).current;
  useEffect(() => {
    Animated.timing(rotateAnim, { toValue: heading ?? 0, duration: 500, useNativeDriver: true }).start();
  }, [heading]);

  return (
    <Animated.View style={[styles.riderMarker, { transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }] }]}>
      <Text style={{ fontSize: 28 }}>🛵</Text>
    </Animated.View>
  );
}

const ORDER_STATUSES = [
  { key: 'placed',         label: 'Order Placed',       icon: 'receipt-outline',     color: COLORS.brand },
  { key: 'confirmed',      label: 'Confirmed',           icon: 'checkmark-circle',    color: COLORS.accent },
  { key: 'preparing',      label: 'Preparing',           icon: 'restaurant-outline',  color: COLORS.yellow },
  { key: 'rider_assigned', label: 'Rider Assigned',      icon: 'bicycle',             color: COLORS.purple },
  { key: 'picked_up',      label: 'Picked Up',           icon: 'bag-check-outline',   color: COLORS.green },
  { key: 'on_the_way',     label: 'On the Way',          icon: 'navigate-outline',    color: COLORS.brand },
  { key: 'nearby',         label: 'Almost Here!',        icon: 'location',            color: COLORS.red },
  { key: 'delivered',      label: 'Delivered 🎉',         icon: 'home',                color: COLORS.green },
];

export default function LiveTrackingScreen({ navigation, route }) {
  const { orderId } = route.params || {};
  const activeOrder = useSelector(selectActiveOrder);
  const riderLocation = useSelector(selectRiderLocation);
  const riderDetails = useSelector(selectRiderDetails);
  const timeline = useSelector(selectStatusTimeline);

  const [isConnected, setIsConnected] = useState(false);
  const [etaText, setEtaText] = useState('Calculating...');
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const currentStatus = activeOrder?.status ?? 'placed';
  const currentStep = ORDER_STATUSES.findIndex(s => s.key === currentStatus);

  // Connect socket and join order room
  useEffect(() => {
    const socket = socketService.connect();
    socketService.joinOrderRoom(orderId, activeOrder?.customerId);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    setIsConnected(socket.connected);

    return () => {
      // Don't leave room on unmount — keep updates coming
    };
  }, [orderId]);

  // Update ETA from rider location
  useEffect(() => {
    if (riderLocation?.eta) setEtaText(riderLocation.eta);
    else if (riderLocation?.step != null && riderLocation?.totalSteps) {
      const minsLeft = Math.max(1, Math.round(((riderLocation.totalSteps - riderLocation.step) * 3) / 60));
      setEtaText(`~${minsLeft} min`);
    }
  }, [riderLocation]);

  const toggleSheet = () => {
    const toValue = sheetOpen ? 0 : 1;
    setSheetOpen(!sheetOpen);
    Animated.spring(sheetAnim, { toValue, tension: 70, friction: 9, useNativeDriver: false }).start();
  };

  // Simulate send notification for demo
  const sendDemoNotification = useCallback(async () => {
    await notificationService.simulatePush('on_the_way', orderId);
  }, [orderId]);

  const sheetHeight = sheetAnim.interpolate({
    inputRange: [0, 1], outputRange: [160, 400],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── MAP AREA (react-native-maps in production) ── */}
      <View style={styles.mapArea}>
        <LinearGradient colors={['#0d1a0d', '#111', '#1a1100']} style={StyleSheet.absoluteFill} />
        {/* Rider position indicator */}
        <View style={styles.mapCenter}>
          <Text style={styles.mapPlaceholderTitle}>📡 Live Tracking Active</Text>
          <Text style={styles.mapPlaceholderSub}>
            {isConnected ? '🟢 Socket Connected' : '🔴 Connecting...'}
          </Text>
          {riderLocation && (
            <View style={styles.coordsBox}>
              <Text style={styles.coordText}>🛵 Rider GPS</Text>
              <Text style={styles.coordText}>Lat: {riderLocation.lat?.toFixed(5)}</Text>
              <Text style={styles.coordText}>Lng: {riderLocation.lng?.toFixed(5)}</Text>
              <Text style={styles.coordText}>Step: {riderLocation.step}/{riderLocation.totalSteps}</Text>
            </View>
          )}
          {/* Animated Rider */}
          {riderLocation && <RiderMarker heading={riderLocation.heading ?? 0} />}
          {/* Pulsing ring */}
          <PulseRing />
        </View>

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        {/* Connection badge */}
        <View style={styles.connectionBadge}>
          <View style={[styles.liveDot, { backgroundColor: isConnected ? COLORS.green : COLORS.red }]} />
          <Text style={styles.liveText}>{isConnected ? 'LIVE' : 'CONNECTING'}</Text>
        </View>

        {/* Dev: Send demo notification */}
        <TouchableOpacity style={styles.demoBtn} onPress={sendDemoNotification}>
          <Text style={styles.demoBtnText}>🔔 Test Push</Text>
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM SHEET ── */}
      <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
        <TouchableOpacity onPress={toggleSheet} style={styles.pillWrap}>
          <View style={styles.pill} />
        </TouchableOpacity>

        {/* ETA Row */}
        <View style={styles.etaRow}>
          <View>
            <Text style={styles.etaTime}>{etaText}</Text>
            <Text style={styles.etaLabel}>
              {selectStatusDisplay(currentStatus).label}
            </Text>
          </View>
          {riderDetails ? (
            <View style={styles.riderInfo}>
              <Text style={{ fontSize: 28 }}>🧑‍🦱</Text>
              <View>
                <Text style={styles.riderName}>{riderDetails.name}</Text>
                <View style={styles.riderRating}>
                  <Ionicons name="star" size={11} color={COLORS.yellow} />
                  <Text style={styles.riderRatingText}>{riderDetails.rating}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.riderInfo}>
              <Text style={{ fontSize: 28 }}>🛵</Text>
              <Text style={styles.riderName}>Finding rider...</Text>
            </View>
          )}
        </View>

        {/* Status Pill */}
        <View style={[styles.statusPill, { backgroundColor: selectStatusDisplay(currentStatus).color + '20' }]}>
          <Text style={{ fontSize: 16 }}>{selectStatusDisplay(currentStatus).emoji}</Text>
          <Text style={[styles.statusPillText, { color: selectStatusDisplay(currentStatus).color }]}>
            {selectStatusDisplay(currentStatus).label}
          </Text>
        </View>

        {/* Timeline (scrollable when sheet open) */}
        {sheetOpen && (
          <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
            {ORDER_STATUSES.map((s, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              const timelineEntry = timeline.find(t => t.status === s.key);
              return (
                <View key={s.key} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, done && { backgroundColor: s.color + '22', borderColor: s.color }]}>
                      <Ionicons name={s.icon} size={14} color={done ? s.color : COLORS.textDim} />
                    </View>
                    {i < ORDER_STATUSES.length - 1 && (
                      <View style={[styles.timelineLine, done && { backgroundColor: s.color }]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineLabel, done && { color: COLORS.text }]}>{s.label}</Text>
                    {timelineEntry && (
                      <Text style={styles.timelineTime}>
                        {new Date(timelineEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                    {active && (
                      <View style={[styles.activeBadge, { backgroundColor: s.color + '22' }]}>
                        <Text style={[styles.activeBadgeText, { color: s.color }]}>NOW</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="call-outline" size={18} color={COLORS.green} />
            <Text style={[styles.actionText, { color: COLORS.green }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.accent + '44' }]}>
            <Ionicons name="chatbubble-outline" size={18} color={COLORS.accent} />
            <Text style={[styles.actionText, { color: COLORS.accent }]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: COLORS.brand + '44' }]}
            onPress={() => navigation.navigate(ROUTES.ORDER_STATUS, { orderId })}
          >
            <Ionicons name="list-outline" size={18} color={COLORS.brand} />
            <Text style={[styles.actionText, { color: COLORS.brand }]}>Details</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

function PulseRing() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 2.5, duration: 1500, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.pulseRing, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  mapArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapCenter: { alignItems: 'center', gap: SIZES.space12 },
  mapPlaceholderTitle: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '700' },
  mapPlaceholderSub: { color: COLORS.textMuted, fontSize: SIZES.xs },
  coordsBox: {
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius8,
    borderWidth: 1, borderColor: COLORS.darkBorder, padding: SIZES.space10, alignItems: 'center',
  },
  coordText: { color: COLORS.text, fontSize: 11, fontFamily: 'monospace' },
  riderMarker: { marginTop: SIZES.space8 },
  pulseRing: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: COLORS.brand + '66',
  },
  backBtn: {
    position: 'absolute', top: 52, left: SIZES.space16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  connectionBadge: {
    position: 'absolute', top: 56, right: SIZES.space16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.darkCard + 'cc', borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.space10, paddingVertical: SIZES.space4,
    borderWidth: 1, borderColor: COLORS.darkBorder,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { color: COLORS.text, fontSize: 9, fontWeight: '900' },
  demoBtn: {
    position: 'absolute', bottom: 20, right: SIZES.space16,
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.space12, paddingVertical: SIZES.space8,
    borderWidth: 1, borderColor: COLORS.brand + '44',
  },
  demoBtnText: { color: COLORS.brand, fontSize: SIZES.xs, fontWeight: '700' },
  sheet: {
    backgroundColor: COLORS.darkCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: COLORS.darkBorder, paddingHorizontal: SIZES.space20,
  },
  pillWrap: { alignItems: 'center', paddingVertical: SIZES.space10 },
  pill: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.darkBorder2 },
  etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.space10 },
  etaTime: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '900' },
  etaLabel: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  riderInfo: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space8 },
  riderName: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '700' },
  riderRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  riderRatingText: { color: COLORS.textMuted, fontSize: SIZES.xs },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space8,
    borderRadius: SIZES.radius8, padding: SIZES.space10, marginBottom: SIZES.space10,
  },
  statusPillText: { fontSize: SIZES.sm, fontWeight: '700' },
  timeline: { maxHeight: 200, marginBottom: SIZES.space8 },
  timelineRow: { flexDirection: 'row', gap: SIZES.space10, alignItems: 'flex-start' },
  timelineLeft: { alignItems: 'center' },
  timelineDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.darkCard2,
    borderWidth: 1.5, borderColor: COLORS.darkBorder, alignItems: 'center', justifyContent: 'center',
  },
  timelineLine: { width: 2, height: 20, backgroundColor: COLORS.darkBorder, marginVertical: 2 },
  timelineContent: { flex: 1, paddingBottom: SIZES.space8, flexDirection: 'row', alignItems: 'center', gap: SIZES.space8, flexWrap: 'wrap' },
  timelineLabel: { color: COLORS.textDim, fontSize: SIZES.xs, fontWeight: '600', flex: 1 },
  timelineTime: { color: COLORS.textMuted, fontSize: 9 },
  activeBadge: { borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.space6, paddingVertical: 2 },
  activeBadgeText: { fontSize: 9, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: SIZES.space10, paddingBottom: SIZES.space16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SIZES.space6, paddingVertical: SIZES.space12,
    backgroundColor: COLORS.darkCard2, borderRadius: SIZES.radius10,
    borderWidth: 1, borderColor: COLORS.green + '44',
  },
  actionText: { fontSize: SIZES.xs, fontWeight: '700' },
});

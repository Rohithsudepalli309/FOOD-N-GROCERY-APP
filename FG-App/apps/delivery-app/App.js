import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, Alert,
  Animated, Vibration, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';

const { width } = Dimensions.get('window');

// ── Config (update SERVER_IP for real device) ────────────────────────────────
const SERVER_URL = 'http://10.0.2.2:3001'; // Android emulator
const RIDER_ID = 'r1'; // In production: from auth session
const RIDER_NAME = 'Rahul Sharma';

const COLORS = {
  dark: '#0F0F0F', card: '#1a1a1a', brand: '#FF5722', green: '#22c55e',
  red: '#ef4444', yellow: '#f59e0b', text: '#f0f0f0', muted: '#888',
  border: '#2a2a2a',
};

// ── Accept Timer ─────────────────────────────────────────────────────────────
function AcceptTimer({ duration = 30, onExpire }) {
  const [secs, setSecs] = useState(duration);
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: 0, duration: duration * 1000, useNativeDriver: false }).start();
    const t = setInterval(() => setSecs(s => { if (s <= 1) { clearInterval(t); onExpire?.(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, []);

  const barWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.timerWrap}>
      <Animated.View style={[styles.timerBar, { width: barWidth, backgroundColor: secs < 10 ? COLORS.red : COLORS.green }]} />
      <Text style={styles.timerText}>{secs}s to accept</Text>
    </View>
  );
}

export default function DeliveryPartnerApp() {
  const [isOnline, setIsOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [earnings, setEarnings] = useState({ today: 487, week: 2340, deliveries: 8 });
  const [tab, setTab] = useState('home'); // home | active | earnings

  // ── Connect Socket ────────────────────────────────────────────────────────
  useEffect(() => {
    const s = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    s.on('connect', () => { setIsConnected(true); s.emit('join_rider', { riderId: RIDER_ID }); });
    s.on('disconnect', () => setIsConnected(false));

    // Incoming order request (30s accept timer)
    s.on('order_request', (order) => {
      Vibration.vibrate([0, 300, 100, 300, 100, 300]);
      setPendingOrder(order);
    });

    // Order status update
    s.on('order_update', (data) => {
      if (activeOrder?.orderId === data.orderId) {
        setActiveOrder(prev => ({ ...prev, status: data.status }));
      }
    });

    setSocket(s);
    return () => s.disconnect();
  }, []);

  // ── Toggle Online/Offline ─────────────────────────────────────────────────
  const toggleOnline = useCallback((val) => {
    setIsOnline(val);
    if (val) {
      socket?.emit('rider_status', { riderId: RIDER_ID, status: 'online' });
    } else {
      socket?.emit('rider_status', { riderId: RIDER_ID, status: 'offline' });
    }
  }, [socket]);

  // ── Accept Order ──────────────────────────────────────────────────────────
  const acceptOrder = useCallback(() => {
    if (!pendingOrder) return;
    socket?.emit('rider_accept_delivery', { riderId: RIDER_ID, orderId: pendingOrder.orderId });
    setActiveOrder(pendingOrder);
    setPendingOrder(null);
    setTab('active');
  }, [pendingOrder, socket]);

  const rejectOrder = useCallback(() => {
    socket?.emit('rider_reject_delivery', { riderId: RIDER_ID, orderId: pendingOrder?.orderId });
    setPendingOrder(null);
  }, [pendingOrder, socket]);

  // ── Mark Picked Up ────────────────────────────────────────────────────────
  const markPickedUp = useCallback(() => {
    socket?.emit('order_picked_up', { riderId: RIDER_ID, orderId: activeOrder?.orderId });
    setActiveOrder(prev => ({ ...prev, status: 'picked_up' }));
  }, [activeOrder, socket]);

  // ── Mark Delivered ────────────────────────────────────────────────────────
  const markDelivered = useCallback(() => {
    Alert.prompt('Delivery OTP', 'Enter 4-digit OTP from customer:', otp => {
      socket?.emit('order_delivered', { riderId: RIDER_ID, orderId: activeOrder?.orderId, otp });
      setEarnings(e => ({ today: e.today + 45, week: e.week + 45, deliveries: e.deliveries + 1 }));
      setActiveOrder(null);
      setTab('home');
    });
  }, [activeOrder, socket]);

  // ── Emit GPS every 3s when online ─────────────────────────────────────────
  useEffect(() => {
    if (!isOnline || !socket) return;
    // Simulated GPS (real: use expo-location)
    let lat = 28.6273, lng = 77.3660;
    const interval = setInterval(() => {
      lat += (Math.random() - 0.5) * 0.0003;
      lng += (Math.random() - 0.5) * 0.0003;
      socket.emit('rider_location', { riderId: RIDER_ID, lat, lng, heading: 45, orderId: activeOrder?.orderId });
    }, 3000);
    return () => clearInterval(interval);
  }, [isOnline, socket, activeOrder?.orderId]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Header */}
      <LinearGradient colors={['#1a0500', '#0F0F0F']} style={styles.header}>
        <View>
          <Text style={styles.headerName}>👋 {RIDER_NAME}</Text>
          <View style={styles.connRow}>
            <View style={[styles.connDot, { backgroundColor: isConnected ? COLORS.green : COLORS.red }]} />
            <Text style={styles.connText}>{isConnected ? 'Server Connected' : 'Connecting...'}</Text>
          </View>
        </View>
        <View style={styles.onlineToggle}>
          <Text style={[styles.onlineLabel, isOnline && { color: COLORS.green }]}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          <Switch
            value={isOnline} onValueChange={toggleOnline}
            trackColor={{ false: COLORS.border, true: COLORS.green + '44' }}
            thumbColor={isOnline ? COLORS.green : COLORS.muted}
          />
        </View>
      </LinearGradient>

      {/* Pending order popup */}
      {pendingOrder && (
        <Animated.View style={styles.pendingCard}>
          <LinearGradient colors={[COLORS.brand, '#c0392b']} style={styles.pendingGrad}>
            <Text style={styles.pendingTitle}>🛵 New Order Request!</Text>
            <Text style={styles.pendingId}>#{pendingOrder.orderId}</Text>
            <Text style={styles.pendingInfo}>📍 Pickup: {pendingOrder.restaurantId || 'Barbeque Nation'}</Text>
            <Text style={styles.pendingInfo}>🏠 Deliver to: Sector 62, Noida</Text>
            <Text style={styles.pendingInfo}>💰 Earning: ₹45 · 2.1km</Text>
            <AcceptTimer duration={30} onExpire={rejectOrder} />
            <View style={styles.pendingActions}>
              <TouchableOpacity style={styles.rejectBtn} onPress={rejectOrder}>
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={acceptOrder}>
                <Text style={styles.acceptBtnText}>✅ Accept</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Tab content */}
      {tab === 'home' && (
        <ScrollView style={styles.content}>
          <View style={styles.statusBanner}>
            <Text style={[styles.statusText, isOnline ? { color: COLORS.green } : { color: COLORS.muted }]}>
              {isOnline ? '🟢 You are online — waiting for orders...' : '⚫ Go online to start receiving orders'}
            </Text>
          </View>
          {/* Quick stats */}
          <View style={styles.statsRow}>
            {[
              { label: "Today's Earnings", value: `₹${earnings.today}`, icon: '💰', color: COLORS.green },
              { label: "Deliveries Today", value: earnings.deliveries, icon: '📦', color: COLORS.brand },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={{ fontSize: 28 }}>{s.icon}</Text>
                <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {tab === 'active' && activeOrder && (
        <ScrollView style={styles.content}>
          <View style={styles.activeCard}>
            <Text style={styles.activeTitle}>Active Delivery</Text>
            <Text style={styles.activeId}>#{activeOrder.orderId}</Text>
            <Text style={styles.activeStatus}>{activeOrder.status?.toUpperCase()}</Text>

            {/* Step actions */}
            <View style={styles.stepActions}>
              {activeOrder.status !== 'picked_up' && (
                <TouchableOpacity style={styles.primaryBtn} onPress={markPickedUp}>
                  <LinearGradient colors={[COLORS.brand, '#c0392b']} style={styles.primaryBtnGrad}>
                    <Text style={styles.primaryBtnText}>📦 Mark Picked Up</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {activeOrder.status === 'picked_up' && (
                <TouchableOpacity style={styles.primaryBtn} onPress={markDelivered}>
                  <LinearGradient colors={[COLORS.green, '#1a7a42']} style={styles.primaryBtnGrad}>
                    <Text style={styles.primaryBtnText}>✅ Mark Delivered (OTP)</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.earningRow}>
              <Ionicons name="cash-outline" size={18} color={COLORS.green} />
              <Text style={[styles.earningText, { color: COLORS.green }]}>₹45 on completion</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {tab === 'earnings' && (
        <ScrollView style={styles.content}>
          {[
            { label: "Today", value: `₹${earnings.today}`, deliveries: earnings.deliveries, icon: '📅' },
            { label: "This Week", value: `₹${earnings.week}`, deliveries: 38, icon: '📆' },
          ].map((e, i) => (
            <View key={i} style={styles.earningCard}>
              <Text style={{ fontSize: 28 }}>{e.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.earningPeriod}>{e.label}</Text>
                <Text style={[styles.earningAmount, { color: COLORS.green }]}>{e.value}</Text>
                <Text style={styles.earningDeliveries}>{e.deliveries} deliveries</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {[
          { key: 'home', icon: 'home', label: 'Home' },
          { key: 'active', icon: 'bicycle', label: 'Active' },
          { key: 'earnings', icon: 'cash', label: 'Earnings' },
        ].map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={styles.navItem}>
            <Ionicons name={tab === t.key ? t.icon : t.icon + '-outline'} size={22} color={tab === t.key ? COLORS.brand : COLORS.muted} />
            <Text style={[styles.navLabel, tab === t.key && { color: COLORS.brand }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerName: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  connDot: { width: 6, height: 6, borderRadius: 3 },
  connText: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  onlineToggle: { alignItems: 'center', gap: 4 },
  onlineLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '900' },
  content: { flex: 1 },
  statusBanner: { margin: 16, backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  statusText: { textAlign: 'center', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, margin: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.border },
  statVal: { fontSize: 24, fontWeight: '900' },
  statLabel: { color: COLORS.muted, fontSize: 10, textAlign: 'center' },
  pendingCard: { position: 'absolute', top: 110, left: 16, right: 16, zIndex: 999, borderRadius: 20, overflow: 'hidden', elevation: 20 },
  pendingGrad: { padding: 20, gap: 8 },
  pendingTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  pendingId: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  pendingInfo: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  timerWrap: { marginVertical: 8 },
  timerBar: { height: 4, borderRadius: 2, marginBottom: 4 },
  timerText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, textAlign: 'right' },
  pendingActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  rejectBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, height: 44, alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { color: '#fff', fontWeight: '700' },
  acceptBtn: { flex: 1.5, backgroundColor: '#fff', borderRadius: 10, height: 44, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { color: COLORS.brand, fontWeight: '900', fontSize: 15 },
  activeCard: { margin: 16, backgroundColor: COLORS.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  activeTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  activeId: { color: COLORS.muted, fontSize: 12 },
  activeStatus: { color: COLORS.brand, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  stepActions: { marginTop: 8, gap: 10 },
  primaryBtn: { borderRadius: 12, overflow: 'hidden' },
  primaryBtnGrad: { height: 50, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  earningRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  earningText: { fontSize: 13, fontWeight: '700' },
  earningCard: { flexDirection: 'row', gap: 16, alignItems: 'center', margin: 16, backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  earningPeriod: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  earningAmount: { fontSize: 28, fontWeight: '900' },
  earningDeliveries: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  bottomNav: { flexDirection: 'row', backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, paddingBottom: 24, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
});

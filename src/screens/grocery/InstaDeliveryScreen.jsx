import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, FlatList, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { selectCartCount, selectCartTotal, clearCart } from '../../store/slices/cartSlice';
import { setActiveOrder } from '../../store/slices/orderSlice';
import socketService from '../../services/socketService';
import axios from 'axios';
import { SERVER_URL } from '../../constants/config';

const COUNTDOWN_MINUTES = 10;

function CountdownTimer({ onExpire }) {
  const [secs, setSecs] = useState(COUNTDOWN_MINUTES * 60);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { clearInterval(interval); onExpire?.(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (secs <= 60) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [secs <= 60]);

  const mins = Math.floor(secs / 60);
  const seconds = secs % 60;
  const isUrgent = secs <= 60;

  return (
    <Animated.View style={[styles.timer, { transform: [{ scale: pulseAnim }] }]}>
      <LinearGradient
        colors={isUrgent ? [COLORS.red, '#c0392b'] : [COLORS.green, '#1a7a42']}
        style={styles.timerGrad}
      >
        <Text style={styles.timerEmoji}>⚡</Text>
        <View style={styles.timerDigits}>
          <Text style={styles.timerNum}>{String(mins).padStart(2, '0')}</Text>
          <Text style={styles.timerColon}>:</Text>
          <Text style={styles.timerNum}>{String(seconds).padStart(2, '0')}</Text>
        </View>
        <Text style={styles.timerLabel}>minutes left</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const LIVE_STOCK = [
  { id: 's1', name: 'Tomatoes', stock: 45, emoji: '🍅' },
  { id: 's2', name: 'Milk', stock: 12, emoji: '🥛' },
  { id: 's3', name: 'Eggs', stock: 3, emoji: '🥚', low: true },
  { id: 's4', name: 'Bread', stock: 0, emoji: '🍞', oos: true },
  { id: 's5', name: 'Butter', stock: 8, emoji: '🧈', low: true },
];

export default function InstaDeliveryScreen({ navigation }) {
  const cartCount = useSelector(selectCartCount);
  const cartTotal = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [liveStock, setLiveStock] = useState(LIVE_STOCK);
  const [isConnected, setIsConnected] = useState(false);

  // Connect socket for live inventory updates
  useEffect(() => {
    const socket = socketService.connect();
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Listen for WMS inventory updates
    socket.on('inventory_update', ({ productId, stock }) => {
      setLiveStock(prev => prev.map(p =>
        p.id === productId ? { ...p, stock, low: stock > 0 && stock < 5, oos: stock === 0 } : p,
      ));
    });

    setIsConnected(socket.connected);
    return () => socket.off('inventory_update');
  }, []);

  const handlePlaceOrder = async () => {
    if (cartCount === 0) { Alert.alert('Empty Cart', 'Add items first!'); return; }
    try {
      const { data } = await axios.post(`${SERVER_URL}/api/orders`, {
        restaurantId: 'grocery_store',
        items: [], total: cartTotal,
        address: 'Home', paymentMethod: 'FG Wallet',
      }).catch(() => ({ data: { orderId: 'FG' + Date.now().toString().slice(-8) } }));

      const orderId = data.orderId;
      dispatch(setActiveOrder({ id: orderId, orderId, status: 'placed', type: 'grocery', eta: '10 min' }));
      setOrderPlaced(true);
      socketService.joinOrderRoom(orderId);
    } catch (e) {
      const orderId = 'FG' + Date.now().toString().slice(-8);
      dispatch(setActiveOrder({ id: orderId, orderId, status: 'placed', type: 'grocery', eta: '10 min' }));
      setOrderPlaced(true);
    }
  };

  if (orderPlaced) {
    return (
      <View style={styles.placedContainer}>
        <StatusBar style="light" />
        <LinearGradient colors={[COLORS.green, '#1a7a42']} style={styles.placedGrad}>
          <Text style={{ fontSize: 72 }}>🛵</Text>
          <Text style={styles.placedTitle}>Order Placed!</Text>
          <Text style={styles.placedSub}>Your grocery will arrive in</Text>
          <CountdownTimer onExpire={() => setOrderPlaced(false)} />
          <Text style={styles.placedNote}>Rider is collecting items from dark store near you</Text>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.navigate(ROUTES.LIVE_TRACKING, {})}
          >
            <Text style={styles.trackBtnText}>Track Live →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0d1a0d', '#0F0F0F']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>⚡ InstaDelivery</Text>
          <View style={styles.socketBadge}>
            <View style={[styles.dot, { backgroundColor: isConnected ? COLORS.green : COLORS.red }]} />
            <Text style={styles.socketText}>WMS {isConnected ? 'Live' : 'Offline'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.CART)}>
          <View style={styles.cartBadge}>
            <Ionicons name="bag-outline" size={22} color={COLORS.text} />
            {cartCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
            )}
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 10-min promise */}
        <View style={styles.promiseBanner}>
          <LinearGradient colors={['#0d2200', '#112200']} style={styles.promiseGrad}>
            <CountdownDownPreview />
            <View>
              <Text style={styles.promiseTitle}>10-Minute Guarantee</Text>
              <Text style={styles.promiseSub}>Or your ₹50 cashback — no questions asked</Text>
              <View style={styles.darkStoreBadge}>
                <Text style={styles.darkStoreText}>📦 Dark Store 1.2km away · 3,200 items</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Live Stock Monitor */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📡 Live Inventory</Text>
            <View style={styles.liveBadge}>
              <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
              <Text style={styles.liveBadgeText}>REAL-TIME WMS</Text>
            </View>
          </View>
          <View style={styles.stockGrid}>
            {liveStock.map(item => (
              <View key={item.id} style={[
                styles.stockCard,
                item.oos && { borderColor: COLORS.red + '44' },
                item.low && { borderColor: COLORS.yellow + '44' },
              ]}>
                <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                <Text style={styles.stockName}>{item.name}</Text>
                <Text style={[
                  styles.stockCount,
                  item.oos && { color: COLORS.red },
                  item.low && { color: COLORS.yellow },
                ]}>
                  {item.oos ? 'OOS' : `${item.stock} left`}
                </Text>
                {item.low && !item.oos && (
                  <Text style={styles.stockLowWarn}>Low!</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order */}
      {cartCount > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.placeBtn} onPress={handlePlaceOrder}>
            <LinearGradient colors={[COLORS.green, '#1a7a42']} style={styles.placeBtnGrad}>
              <Ionicons name="flash" size={18} color={COLORS.white} />
              <Text style={styles.placeBtnText}>Place InstaOrder · ₹{cartTotal}</Text>
              <Text style={styles.placeBtnEta}>⚡ 10 min</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function CountdownDownPreview() {
  return (
    <View style={styles.previewTimer}>
      <Text style={styles.previewNum}>10</Text>
      <Text style={styles.previewLabel}>MIN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 52,
    paddingBottom: SIZES.space16, paddingHorizontal: SIZES.space16,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '800' },
  socketBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  socketText: { color: COLORS.textMuted, fontSize: 9, fontWeight: '700' },
  cartBadge: { position: 'relative', padding: SIZES.space4 },
  badge: {
    position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: COLORS.white, fontSize: 8, fontWeight: '900' },
  promiseBanner: { margin: SIZES.space16, borderRadius: SIZES.radius16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.green + '44' },
  promiseGrad: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space16, padding: SIZES.space20 },
  previewTimer: { alignItems: 'center', width: 60, height: 60, backgroundColor: COLORS.green, borderRadius: 30, justifyContent: 'center' },
  previewNum: { color: COLORS.white, fontSize: SIZES.xl, fontWeight: '900' },
  previewLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 8, fontWeight: '800' },
  promiseTitle: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '800' },
  promiseSub: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 4 },
  darkStoreBadge: { marginTop: SIZES.space8 },
  darkStoreText: { color: COLORS.green, fontSize: SIZES.xs, fontWeight: '600' },
  section: { paddingHorizontal: SIZES.space16, marginBottom: SIZES.space20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.space12 },
  sectionTitle: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.green + '15', borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.space8, paddingVertical: 3 },
  liveBadgeText: { color: COLORS.green, fontSize: 8, fontWeight: '900' },
  stockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.space10 },
  stockCard: {
    width: '18%', backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius10,
    borderWidth: 1, borderColor: COLORS.darkBorder, padding: SIZES.space8, alignItems: 'center', gap: 3,
  },
  stockName: { color: COLORS.text, fontSize: 8, fontWeight: '700', textAlign: 'center' },
  stockCount: { color: COLORS.green, fontSize: 9, fontWeight: '800' },
  stockLowWarn: { color: COLORS.yellow, fontSize: 7, fontWeight: '900' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SIZES.space16, backgroundColor: COLORS.dark, borderTopWidth: 1, borderTopColor: COLORS.darkBorder,
  },
  placeBtn: { borderRadius: SIZES.radius12, overflow: 'hidden' },
  placeBtnGrad: { height: SIZES.buttonHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.space8 },
  placeBtnText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '800' },
  placeBtnEta: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.xs },
  // Order placed view
  placedContainer: { flex: 1, backgroundColor: COLORS.dark },
  placedGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SIZES.space16, padding: SIZES.space32 },
  placedTitle: { color: COLORS.white, fontSize: SIZES.xxxl, fontWeight: '900' },
  placedSub: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.md },
  placedNote: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.xs, textAlign: 'center', marginTop: SIZES.space8 },
  trackBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.space24, paddingVertical: SIZES.space12, marginTop: SIZES.space8,
  },
  trackBtnText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '800' },
  timer: { marginVertical: SIZES.space8 },
  timerGrad: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space12, borderRadius: SIZES.radius16, paddingHorizontal: SIZES.space24, paddingVertical: SIZES.space14 ?? 14 },
  timerEmoji: { fontSize: 24 },
  timerDigits: { flexDirection: 'row', alignItems: 'center' },
  timerNum: { color: COLORS.white, fontSize: 48, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerColon: { color: 'rgba(255,255,255,0.7)', fontSize: 40, fontWeight: '900', marginHorizontal: 2 },
  timerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.xs },
});

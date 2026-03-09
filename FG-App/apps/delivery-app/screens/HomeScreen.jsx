import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Animated, Vibration, Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const C = {
  dark: '#0F0F0F', card: '#1a1a1a', brand: '#FF5722',
  green: '#22c55e', red: '#ef4444', muted: '#888', border: '#2a2a2a', text: '#f0f0f0',
};

// ── 30-second animated accept timer ────────────────────────────────────────
function AcceptTimerBar({ duration = 30, onExpire, onAccept, onReject }) {
  const [secs, setSecs] = useState(duration);
  const anim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 0, duration: duration * 1000, useNativeDriver: false }).start();
    const t = setInterval(() => setSecs(s => {
      if (s <= 1) { clearInterval(t); onExpire?.(); return 0; }
      return s - 1;
    }), 1000);
    // Pulse animation for urgency
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.02, duration: 600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();
    return () => clearInterval(t);
  }, []);

  const barColor = secs < 10 ? C.red : secs < 20 ? '#f59e0b' : C.green;
  const barWidth = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[styles.orderCard, { transform: [{ scale: pulseAnim }], borderColor: C.brand + '88' }]}>
      <LinearGradient colors={['#1a0500', '#1a1a1a']} style={styles.cardInner}>
        <View style={styles.orderBadge}><Text style={styles.orderBadgeTxt}>🔔 NEW ORDER REQUEST</Text></View>
        <Text style={styles.orderAmount}>₹349 · 2.3km away</Text>
        <Text style={styles.orderDetail}>📍 Pickup: Barbeque Nation, Sector 62</Text>
        <Text style={styles.orderDetail}>🏠 Drop: Tower 7, Mahagun Mywoods</Text>
        <Text style={styles.orderEarning}>💰 You earn: ₹52</Text>

        {/* Timer */}
        <View style={styles.timerWrap}>
          <Animated.View style={[styles.timerFill, { width: barWidth, backgroundColor: barColor }]} />
          <Text style={[styles.timerText, { color: barColor }]}>{secs}s</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onReject} style={styles.rejectBtn}>
            <Text style={styles.rejectTxt}>✕ Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAccept} style={styles.acceptBtn}>
            <LinearGradient colors={[C.brand, '#c0392b']} style={styles.acceptGrad}>
              <Text style={styles.acceptTxt}>✓ Accept Order</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation, isOnline, socket, riderId }) {
  const [pendingOrder, setPendingOrder] = useState(null);
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'delivered', msg: 'Delivered Order #FG8823', time: '2m ago', earn: 47 },
    { id: 2, type: 'missed', msg: 'Missed Order #FG8819', time: '18m ago', earn: 0 },
    { id: 3, type: 'delivered', msg: 'Delivered Order #FG8815', time: '45m ago', earn: 51 },
  ]);

  useEffect(() => {
    if (!socket) return;
    const handler = (order) => {
      Vibration.vibrate([0, 400, 100, 400]);
      setPendingOrder(order);
    };
    socket.on('order_request', handler);
    return () => socket.off('order_request', handler);
  }, [socket]);

  const handleAccept = () => {
    if (!pendingOrder) return;
    socket?.emit('rider_accept_delivery', { riderId, orderId: pendingOrder.orderId });
    navigation.navigate('ActiveDelivery', { order: pendingOrder });
    setPendingOrder(null);
  };

  const handleReject = () => {
    socket?.emit('rider_reject_delivery', { riderId, orderId: pendingOrder?.orderId });
    setPendingOrder(null);
    setRecentActivity(a => [{ id: Date.now(), type: 'missed', msg: `Skipped Order #${pendingOrder?.orderId}`, time: 'Just now', earn: 0 }, ...a]);
  };

  return (
    <View style={styles.container}>
      {/* Status banner */}
      <View style={[styles.statusBanner, { borderColor: isOnline ? C.green + '44' : C.border }]}>
        <View style={[styles.dot, { backgroundColor: isOnline ? C.green : C.muted }]} />
        <Text style={[styles.statusTxt, { color: isOnline ? C.green : C.muted }]}>
          {isOnline ? 'You are online — orders incoming' : 'Go online to receive orders'}
        </Text>
      </View>

      {/* Pending request */}
      {pendingOrder && (
        <AcceptTimerBar
          duration={30}
          onExpire={handleReject}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      {/* Recent activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <FlatList
        data={recentActivity}
        keyExtractor={i => i.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.activityRow}>
            <View style={[styles.actIcon, { backgroundColor: item.type === 'delivered' ? C.green + '22' : C.red + '22' }]}>
              <Ionicons name={item.type === 'delivered' ? 'checkmark-circle' : 'close-circle'} size={20} color={item.type === 'delivered' ? C.green : C.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actMsg}>{item.msg}</Text>
              <Text style={styles.actTime}>{item.time}</Text>
            </View>
            {item.earn > 0 && <Text style={[styles.actEarn, { color: C.green }]}>+₹{item.earn}</Text>}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark, padding: 16 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { fontSize: 13, fontWeight: '600' },
  orderCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, marginBottom: 20 },
  cardInner: { padding: 18 },
  orderBadge: { backgroundColor: C.brand + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  orderBadgeTxt: { color: C.brand, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  orderAmount: { fontSize: 22, fontWeight: '900', color: C.text, marginBottom: 6 },
  orderDetail: { color: '#aaa', fontSize: 13, marginBottom: 3 },
  orderEarning: { color: C.green, fontWeight: '800', fontSize: 14, marginTop: 6 },
  timerWrap: { height: 6, backgroundColor: '#222', borderRadius: 3, marginVertical: 14, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  timerText: { position: 'absolute', right: 0, top: -18, fontSize: 11, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, height: 46, backgroundColor: '#222', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rejectTxt: { color: C.muted, fontWeight: '700', fontSize: 13 },
  acceptBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  acceptGrad: { height: 46, alignItems: 'center', justifyContent: 'center' },
  acceptTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },
  sectionTitle: { color: C.text, fontSize: 14, fontWeight: '800', marginBottom: 12 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  actIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actMsg: { color: C.text, fontSize: 12, fontWeight: '600' },
  actTime: { color: C.muted, fontSize: 10, marginTop: 2 },
  actEarn: { fontSize: 15, fontWeight: '900' },
});

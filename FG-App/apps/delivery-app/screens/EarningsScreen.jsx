import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const C = { dark: '#0F0F0F', card: '#1a1a1a', brand: '#FF5722', green: '#22c55e', muted: '#888', border: '#2a2a2a', text: '#f0f0f0', purple: '#a855f7' };

const HISTORY = [
  { id: 'h1', orderId: 'FG8823', restaurant: 'Barbeque Nation', customer: 'Rohit K.', time: '14:32', date: 'Today', earn: 47, km: 2.1, rating: 5 },
  { id: 'h2', orderId: 'FG8815', restaurant: "McDonald's", customer: 'Priya S.', time: '13:05', date: 'Today', earn: 51, km: 3.4, rating: 5 },
  { id: 'h3', orderId: 'FG8801', restaurant: 'Pizza Hut', customer: 'Amit V.', time: '12:21', date: 'Today', earn: 38, km: 1.8, rating: 4 },
  { id: 'h4', orderId: 'FG8786', restaurant: 'Biryani Blues', customer: 'Sneha R.', time: '19:44', date: 'Yesterday', earn: 55, km: 4.2, rating: 5 },
  { id: 'h5', orderId: 'FG8771', restaurant: "Domino's Pizza", customer: 'Mohan L.', time: '18:10', date: 'Yesterday', earn: 42, km: 2.7, rating: 4 },
];

// Simple mini bar chart for the week
function WeekChart({ data }) {
  const max = Math.max(...data);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 50 }}>
      {data.map((v, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
          <View style={{ width: '100%', height: `${(v / max) * 45}px` || 4, backgroundColor: i === 6 ? C.brand : '#333', borderRadius: 3, minHeight: 4 }} />
          <Text style={{ color: C.muted, fontSize: 8 }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
        </View>
      ))}
    </View>
  );
}

export default function EarningsScreen() {
  const [tab, setTab] = useState('today');
  const dailyData = [320, 487, 290, 540, 410, 380, 487];

  const summary = {
    today: { total: 487, deliveries: 8, distance: 18.4, avgPerDel: 60 },
    week: { total: 2914, deliveries: 48, distance: 112, avgPerDel: 60 },
    month: { total: 11230, deliveries: 186, distance: 430, avgPerDel: 60 },
  };

  const s = summary[tab];

  return (
    <ScrollView style={styles.container}>
      {/* Hero earnings */}
      <LinearGradient colors={['#1a0500', '#0F0F0F']} style={styles.hero}>
        <Text style={styles.heroLabel}>{tab === 'today' ? "Today's" : tab === 'week' ? "This Week's" : "This Month's"} Earnings</Text>
        <Text style={styles.heroAmount}>₹{s.total.toLocaleString()}</Text>
        <View style={styles.subStats}>
          <Text style={styles.subStat}>📦 {s.deliveries} deliveries</Text>
          <Text style={styles.subStat}>🛵 {s.distance} km</Text>
          <Text style={styles.subStat}>⌀ ₹{s.avgPerDel}/order</Text>
        </View>
      </LinearGradient>

      {/* Period tabs */}
      <View style={styles.tabRow}>
        {['today', 'week', 'month'].map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabBtn, tab === t && styles.tabActive]}>
            <Text style={[styles.tabTxt, tab === t && { color: C.brand }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Week chart */}
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>7-Day Revenue (₹)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 80 }}>
          {dailyData.map((v, i) => {
            const max = Math.max(...dailyData);
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <Text style={{ color: C.muted, fontSize: 8 }}>{v}</Text>
                <View style={{ width: '100%', height: (v / max) * 50, backgroundColor: i === 6 ? C.brand : '#333', borderRadius: 4 }} />
                <Text style={{ color: C.muted, fontSize: 8 }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Breakdown */}
      <View style={styles.breakCard}>
        <Text style={styles.cardTitle}>Earnings Breakdown</Text>
        {[
          { label: 'Base pay', value: Math.round(s.total * 0.72), color: C.green },
          { label: 'Tips', value: Math.round(s.total * 0.12), color: C.purple },
          { label: 'Bonuses', value: Math.round(s.total * 0.1), color: C.brand },
          { label: 'Surge bonus', value: Math.round(s.total * 0.06), color: '#f59e0b' },
        ].map((b, i) => (
          <View key={i} style={styles.breakRow}>
            <View style={[styles.breakDot, { backgroundColor: b.color }]} />
            <Text style={styles.breakLabel}>{b.label}</Text>
            <Text style={[styles.breakVal, { color: b.color }]}>₹{b.value}</Text>
          </View>
        ))}
      </View>

      {/* Delivery history */}
      <Text style={styles.sectionTitle}>Recent Deliveries</Text>
      {HISTORY.map(h => (
        <View key={h.id} style={styles.historyRow}>
          <View style={styles.historyLeft}>
            <Text style={styles.historyId}>#{h.orderId}</Text>
            <Text style={styles.historyRestaurant}>{h.restaurant} → {h.customer}</Text>
            <Text style={styles.historyMeta}>{h.date} · {h.time} · {h.km}km</Text>
          </View>
          <View style={styles.historyRight}>
            <Text style={[styles.historyEarn, { color: C.green }]}>+₹{h.earn}</Text>
            <Text style={{ color: C.brand, fontSize: 11 }}>{'⭐'.repeat(h.rating)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },
  hero: { padding: 28, paddingTop: 52, alignItems: 'center', gap: 6 },
  heroLabel: { color: '#aaa', fontSize: 12, fontWeight: '700' },
  heroAmount: { color: C.green, fontSize: 40, fontWeight: '900' },
  subStats: { flexDirection: 'row', gap: 16, marginTop: 4 },
  subStat: { color: '#999', fontSize: 11, fontWeight: '600' },
  tabRow: { flexDirection: 'row', margin: 16, backgroundColor: C.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.border },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: C.brand + '22' },
  tabTxt: { color: C.muted, fontSize: 12, fontWeight: '700' },
  chartCard: { margin: 16, marginTop: 0, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTitle: { color: C.text, fontSize: 13, fontWeight: '800', marginBottom: 14 },
  breakCard: { margin: 16, marginTop: 0, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  breakRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  breakDot: { width: 8, height: 8, borderRadius: 4 },
  breakLabel: { flex: 1, color: '#aaa', fontSize: 13 },
  breakVal: { fontSize: 14, fontWeight: '800' },
  sectionTitle: { color: C.text, fontSize: 14, fontWeight: '800', marginHorizontal: 16, marginBottom: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 16, marginTop: 0, marginBottom: 8, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  historyLeft: { flex: 1, gap: 2 },
  historyId: { color: C.brand, fontSize: 12, fontWeight: '800' },
  historyRestaurant: { color: C.text, fontSize: 12, fontWeight: '600' },
  historyMeta: { color: C.muted, fontSize: 10, marginTop: 2 },
  historyRight: { alignItems: 'flex-end', gap: 3 },
  historyEarn: { fontSize: 18, fontWeight: '900' },
});

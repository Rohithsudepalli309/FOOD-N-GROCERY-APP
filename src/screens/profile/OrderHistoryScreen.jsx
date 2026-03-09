import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';

const STATUS_COLORS = {
  delivered: COLORS.green, cancelled: COLORS.red, preparing: COLORS.yellow, placed: COLORS.accent,
};

const ORDERS = [
  { id: 'FG11111111', restaurant: 'Barbeque Nation', items: 'Chicken Biryani, Paneer Tikka', total: 578, status: 'delivered', date: '7 Mar 2026', time: '1:20 PM' },
  { id: 'FG22222222', restaurant: 'Pizza Hut', items: 'Margherita Pizza, Garlic Bread', total: 448, status: 'delivered', date: '5 Mar 2026', time: '8:10 PM' },
  { id: 'FG33333333', restaurant: 'McDonald\'s', items: 'McAloo Tikki x2, Cold Coffee', total: 239, status: 'cancelled', date: '2 Mar 2026', time: '3:45 PM' },
  { id: 'FG44444444', restaurant: 'Grocery Store', items: 'Amul Butter, Tata Salt, Eggs', total: 358, status: 'delivered', date: '28 Feb 2026', time: '11:00 AM' },
];

export default function OrderHistoryScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={ORDERS}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate(ROUTES.ORDER_STATUS, { orderId: item.id })}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.restaurant}>{item.restaurant}</Text>
                <Text style={styles.items} numberOfLines={1}>{item.items}</Text>
                <Text style={styles.meta}>{item.date} · {item.time}</Text>
              </View>
              <View style={styles.rightCol}>
                <Text style={styles.total}>₹{item.total}</Text>
                <View style={[styles.statusChip, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
            {item.status === 'delivered' && (
              <TouchableOpacity style={styles.reorderBtn}>
                <Ionicons name="refresh-outline" size={14} color={COLORS.brand} />
                <Text style={styles.reorderText}>Reorder</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
      />
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
  title: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800' },
  list: { padding: SIZES.space16 },
  card: {
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius16,
    borderWidth: 1, borderColor: COLORS.darkBorder,
    padding: SIZES.space16, marginBottom: SIZES.space12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  restaurant: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700', marginBottom: 4 },
  items: { color: COLORS.textMuted, fontSize: SIZES.xs, marginBottom: 4 },
  meta: { color: COLORS.textDim, fontSize: SIZES.xs },
  rightCol: { alignItems: 'flex-end', gap: SIZES.space8 },
  total: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '800' },
  statusChip: { borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.space8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  reorderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space6,
    marginTop: SIZES.space12, paddingTop: SIZES.space12,
    borderTopWidth: 1, borderTopColor: COLORS.darkBorder,
  },
  reorderText: { color: COLORS.brand, fontSize: SIZES.xs, fontWeight: '700' },
});

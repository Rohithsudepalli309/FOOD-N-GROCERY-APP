import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import RestaurantCard from '../../components/restaurant/RestaurantCard';

const MOCK = {
  Biryani: [
    { id: 'b1', name: 'Biryani Blues', cuisine: 'Biryani, North Indian', rating: 4.6, deliveryTime: '30-45', minOrder: '199', image: 'https://picsum.photos/seed/biryani1/400/200' },
    { id: 'b2', name: 'Paradise Biryani', cuisine: 'Biryani, Hyderabadi', rating: 4.7, deliveryTime: '25-40', minOrder: '249', image: 'https://picsum.photos/seed/biryani2/400/200' },
  ],
  Pizza: [
    { id: 'p1', name: 'La Pino\'z', cuisine: 'Pizza, Italian', rating: 4.0, deliveryTime: '30-40', minOrder: '149', image: 'https://picsum.photos/seed/pizza1/400/200' },
    { id: 'p2', name: 'Domino\'s', cuisine: 'Pizza, Pasta', rating: 4.2, deliveryTime: '20-30', minOrder: '149', image: 'https://picsum.photos/seed/pizza2/400/200' },
  ],
};

export default function CategoryScreen({ navigation, route }) {
  const { category } = route.params || {};
  const restaurants = MOCK[category] || [];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{category}</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={restaurants}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>😕</Text>
            <Text style={styles.emptyText}>No restaurants in this category near you.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <RestaurantCard item={item} onPress={() => navigation.navigate(ROUTES.RESTAURANT_DETAIL, { restaurant: item })} />
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
  backBtn: { padding: SIZES.space6 },
  title: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800' },
  list: { padding: SIZES.space16 },
  empty: { alignItems: 'center', marginTop: 80, gap: SIZES.space12 },
  emptyText: { color: COLORS.textMuted, fontSize: SIZES.sm, textAlign: 'center', paddingHorizontal: SIZES.space32 },
});

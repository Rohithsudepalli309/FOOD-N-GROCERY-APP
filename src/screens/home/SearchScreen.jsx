import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import RestaurantCard from '../../components/restaurant/RestaurantCard';

const ALL = [
  { id: '1', name: 'Barbeque Nation', cuisine: 'North Indian', rating: 4.5, deliveryTime: '30-45', minOrder: '299', image: 'https://picsum.photos/seed/bbq/400/200' },
  { id: '2', name: 'Pizza Hut', cuisine: 'Pizza, Italian', rating: 4.2, deliveryTime: '25-35', minOrder: '149', image: 'https://picsum.photos/seed/pizzahut/400/200' },
  { id: '3', name: 'McDonald\'s', cuisine: 'Burger, Fast Food', rating: 4.4, deliveryTime: '20-30', minOrder: '99', image: 'https://picsum.photos/seed/mcdonalds/400/200' },
  { id: '4', name: 'Pav Bhaji Stall', cuisine: 'Street Food, Snacks', rating: 4.6, deliveryTime: '15-25', minOrder: '79', image: 'https://picsum.photos/seed/pavbhaji/400/200' },
  { id: '5', name: 'Chai Point', cuisine: 'Beverages, Snacks', rating: 4.3, deliveryTime: '20-30', minOrder: '49', image: 'https://picsum.photos/seed/chai/400/200' },
];

const FILTERS = ['All', 'Veg Only', 'Rating 4.0+', 'Under ₹100', 'Fast Delivery'];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const results = ALL.filter(r => {
    const matchQ = !query || r.name.toLowerCase().includes(query.toLowerCase()) || r.cuisine.toLowerCase().includes(query.toLowerCase());
    const matchF = activeFilter === 'All'
      || (activeFilter === 'Rating 4.0+' && r.rating >= 4.0)
      || (activeFilter === 'Under ₹100' && parseInt(r.minOrder) < 100)
      || (activeFilter === 'Fast Delivery' && parseInt(r.deliveryTime.split('-')[0]) <= 20);
    return matchQ && matchF;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Restaurants, dishes, cuisines..."
            placeholderTextColor={COLORS.textDim}
            style={styles.input}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {/* Filter Chips */}
        <FlatList
          data={FILTERS}
          horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={i => i}
          style={styles.filters}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(item)}
              style={[styles.chip, activeFilter === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, activeFilter === item && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySub}>Try a different search term or filter</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <RestaurantCard
              item={item}
              onPress={() => navigation.navigate(ROUTES.RESTAURANT_DETAIL, { restaurant: item })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: { paddingTop: 52, paddingHorizontal: SIZES.space16, backgroundColor: COLORS.dark, paddingBottom: SIZES.space8 },
  title: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '900', marginBottom: SIZES.space16 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.darkCard,
    borderRadius: SIZES.radius12, borderWidth: 1, borderColor: COLORS.darkBorder,
    paddingHorizontal: SIZES.space12, height: 48, marginBottom: SIZES.space12,
  },
  searchIcon: { marginRight: SIZES.space8 },
  input: { flex: 1, color: COLORS.text, fontSize: SIZES.md },
  filters: { marginBottom: SIZES.space8 },
  chip: {
    paddingHorizontal: SIZES.space12, paddingVertical: SIZES.space6,
    backgroundColor: COLORS.darkCard, borderWidth: 1, borderColor: COLORS.darkBorder,
    borderRadius: SIZES.radiusFull, marginRight: SIZES.space8,
  },
  chipActive: { backgroundColor: COLORS.brand + '22', borderColor: COLORS.brand },
  chipText: { color: COLORS.textMuted, fontSize: SIZES.xs, fontWeight: '600' },
  chipTextActive: { color: COLORS.brand },
  list: { padding: SIZES.space16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SIZES.space12 },
  emptyTitle: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '700' },
  emptySub: { color: COLORS.textMuted, fontSize: SIZES.sm },
});

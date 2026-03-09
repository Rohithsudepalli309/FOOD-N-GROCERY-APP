import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import RestaurantCard from '../../components/restaurant/RestaurantCard';

import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurants } from '../../store/slices/restaurantSlice';

const SORT_OPTIONS = ['Relevance', 'Rating', 'Delivery Time', 'Cost: Low to High'];

export default function RestaurantListScreen({ navigation }) {
  const dispatch = useDispatch();
  const { restaurants, isLoading } = useSelector(state => state.restaurant);
  const [sort, setSort] = React.useState('Relevance');

  React.useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const sorted = [...restaurants].sort((a, b) => {
    if (sort === 'Rating') return b.rating - a.rating;
    if (sort === 'Delivery Time') return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
    if (sort === 'Cost: Low to High') return parseInt(a.minOrder) - parseInt(b.minOrder);
    return 0;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>All Restaurants</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={sorted}
        keyExtractor={i => i.id?.toString() || Math.random().toString()}
        refreshing={isLoading}
        onRefresh={() => dispatch(fetchRestaurants())}
        ListHeaderComponent={
          <FlatList
            data={SORT_OPTIONS}
            horizontal showsHorizontalScrollIndicator={false}
            keyExtractor={i => i}
            style={styles.sortRow}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSort(item)} style={[styles.sortChip, sort === item && styles.sortActive]}>
                <Text style={[styles.sortText, sort === item && { color: COLORS.brand }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        }
        contentContainerStyle={styles.list}
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
  title: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800' },
  sortRow: { paddingHorizontal: SIZES.space16, marginVertical: SIZES.space12 },
  sortChip: {
    paddingHorizontal: SIZES.space12, paddingVertical: SIZES.space6,
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radiusFull,
    borderWidth: 1, borderColor: COLORS.darkBorder, marginRight: SIZES.space8,
  },
  sortActive: { borderColor: COLORS.brand, backgroundColor: COLORS.brand + '15' },
  sortText: { color: COLORS.textMuted, fontSize: SIZES.xs, fontWeight: '600' },
  list: { paddingHorizontal: SIZES.space16, paddingBottom: 40 },
});

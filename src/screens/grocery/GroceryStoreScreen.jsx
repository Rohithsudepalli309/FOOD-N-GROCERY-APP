import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { addItem, removeItem, selectItemInCart } from '../../store/slices/cartSlice';

const ALL_PRODUCTS = [
  { id: 'gp1', name: 'Organic Tomatoes 1kg', price: 29, mrp: 40, image: 'https://picsum.photos/seed/tomato/200/200', isVeg: true, category: 'Vegetables', stock: 50 },
  { id: 'gp2', name: 'Amul Butter 500g', price: 248, mrp: 275, image: 'https://picsum.photos/seed/butter/200/200', isVeg: true, category: 'Dairy', stock: 20 },
  { id: 'gp3', name: 'Fresh Spinach 250g', price: 18, mrp: 25, image: 'https://picsum.photos/seed/spinach/200/200', isVeg: true, category: 'Vegetables', stock: 30 },
  { id: 'gp4', name: 'Britannia Toast 400g', price: 55, mrp: 65, image: 'https://picsum.photos/seed/bread/200/200', isVeg: true, category: 'Snacks', stock: 0 },
  { id: 'gp5', name: 'Tata Salt 1kg', price: 21, mrp: 24, image: 'https://picsum.photos/seed/salt/200/200', isVeg: true, category: 'Others', stock: 100 },
  { id: 'gp6', name: 'Aashirvaad Atta 5kg', price: 248, mrp: 270, image: 'https://picsum.photos/seed/atta/200/200', isVeg: true, category: 'Grains', stock: 15 },
  { id: 'gp7', name: 'Tropicana OJ 1L', price: 89, mrp: 110, image: 'https://picsum.photos/seed/oj/200/200', isVeg: true, category: 'Beverages', stock: 25 },
  { id: 'gp8', name: 'Fresh Eggs 12pcs', price: 89, mrp: 95, image: 'https://picsum.photos/seed/eggs/200/200', isVeg: false, category: 'Dairy', stock: 10 },
];

function ProductTile({ item, navigation }) {
  const dispatch = useDispatch();
  const cartItem = useSelector(selectItemInCart(item.id));
  const qty = cartItem?.quantity ?? 0;
  const isOutOfStock = item.stock === 0;
  const discount = Math.round(((item.mrp - item.price) / item.mrp) * 100);

  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAIL, { product: item })}
    >
      <View style={styles.tileImageWrap}>
        <Image source={{ uri: item.image }} style={styles.tileImage} resizeMode="cover" />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
        {isOutOfStock && (
          <View style={styles.oosBadge}>
            <Text style={styles.oosText}>Out of Stock</Text>
          </View>
        )}
      </View>
      <View style={styles.tileInfo}>
        <Text style={styles.tileName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.tileStock}>{isOutOfStock ? '❌ OOS' : `✅ ${item.stock} left`}</Text>
        <View style={styles.tilePriceRow}>
          <Text style={styles.tilePrice}>₹{item.price}</Text>
          {item.mrp > item.price && <Text style={styles.tileMrp}>₹{item.mrp}</Text>}
        </View>
        {isOutOfStock ? (
          <TouchableOpacity style={styles.notifyBtn}>
            <Text style={styles.notifyText}>🔔 Notify Me</Text>
          </TouchableOpacity>
        ) : qty === 0 ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => dispatch(addItem({ item, restaurantId: 'grocery_store', restaurantName: 'Grocery' }))}
          >
            <Text style={styles.addBtnText}>+ ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => dispatch(removeItem(item.id))}>
              <Ionicons name="remove" size={14} color={COLORS.brand} />
            </TouchableOpacity>
            <Text style={styles.qtyVal}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => dispatch(addItem({ item, restaurantId: 'grocery_store', restaurantName: 'Grocery' }))}>
              <Ionicons name="add" size={14} color={COLORS.brand} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function GroceryStoreScreen({ navigation, route }) {
  const { category } = route.params || {};
  const [query, setQuery] = useState('');
  const filtered = ALL_PRODUCTS.filter(p =>
    (!category || p.category === category) &&
    (!query || p.name.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{category || 'All Products'}</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search products..."
          placeholderTextColor={COLORS.textDim}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <ProductTile item={item} navigation={navigation} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>😕</Text>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
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
  backBtn: { padding: SIZES.space4 },
  title: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space8,
    backgroundColor: COLORS.darkCard, margin: SIZES.space16,
    borderRadius: SIZES.radius12, borderWidth: 1, borderColor: COLORS.darkBorder,
    paddingHorizontal: SIZES.space12, height: 44,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: SIZES.sm },
  grid: { paddingHorizontal: SIZES.space12, paddingBottom: 40 },
  row: { gap: SIZES.space10, marginBottom: SIZES.space10 },
  tile: {
    flex: 1, backgroundColor: COLORS.darkCard,
    borderRadius: SIZES.radius12, borderWidth: 1, borderColor: COLORS.darkBorder, overflow: 'hidden',
  },
  tileImageWrap: { position: 'relative' },
  tileImage: { width: '100%', height: 120, backgroundColor: COLORS.darkCard2 },
  discountBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: COLORS.green, borderRadius: SIZES.radiusFull,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  discountText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  oosBadge: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  oosText: { color: COLORS.white, fontSize: SIZES.xs, fontWeight: '700' },
  tileInfo: { padding: SIZES.space10 },
  tileName: { color: COLORS.text, fontSize: SIZES.xs, fontWeight: '600', marginBottom: 4 },
  tileStock: { color: COLORS.textMuted, fontSize: 9, marginBottom: 6 },
  tilePriceRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space6, marginBottom: SIZES.space8 },
  tilePrice: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '800' },
  tileMrp: { color: COLORS.textMuted, fontSize: 10, textDecorationLine: 'line-through' },
  addBtn: {
    borderWidth: 1.5, borderColor: COLORS.brand, borderRadius: SIZES.radius6,
    paddingVertical: SIZES.space4, alignItems: 'center',
  },
  addBtnText: { color: COLORS.brand, fontSize: 10, fontWeight: '800' },
  notifyBtn: {
    borderWidth: 1, borderColor: COLORS.accent, borderRadius: SIZES.radius6,
    paddingVertical: SIZES.space4, alignItems: 'center',
  },
  notifyText: { color: COLORS.accent, fontSize: 9, fontWeight: '700' },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.brand, borderRadius: SIZES.radius6, overflow: 'hidden',
  },
  qtyBtn: { padding: SIZES.space6 },
  qtyVal: { flex: 1, color: COLORS.white, fontSize: SIZES.xs, fontWeight: '800', textAlign: 'center' },
  empty: { alignItems: 'center', marginTop: 60, gap: SIZES.space12 },
  emptyText: { color: COLORS.textMuted, fontSize: SIZES.sm },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { selectCartCount } from '../../store/slices/cartSlice';

const { width } = Dimensions.get('window');

const GROCERY_CATEGORIES = [
  { id: 'g1', emoji: '🥬', label: 'Vegetables', count: '200+' },
  { id: 'g2', emoji: '🍎', label: 'Fruits', count: '80+' },
  { id: 'g3', emoji: '🥛', label: 'Dairy', count: '120+' },
  { id: 'g4', emoji: '🍗', label: 'Meat & Fish', count: '150+' },
  { id: 'g5', emoji: '🧴', label: 'Personal Care', count: '300+' },
  { id: 'g6', emoji: '🫙', label: 'Snacks', count: '250+' },
  { id: 'g7', emoji: '🥤', label: 'Beverages', count: '180+' },
  { id: 'g8', emoji: '🧹', label: 'Cleaning', count: '100+' },
];

const FEATURED_PRODUCTS = [
  { id: 'p1', name: 'Amul Butter 500g', price: 248, mrp: 275, image: 'https://picsum.photos/seed/butter/200/200', badge: '10% OFF' },
  { id: 'p2', name: 'Tata Salt 1kg', price: 21, mrp: 24, image: 'https://picsum.photos/seed/salt/200/200', badge: 'Best Seller' },
  { id: 'p3', name: 'Aashirvaad Atta 5kg', price: 248, mrp: 270, image: 'https://picsum.photos/seed/atta/200/200', badge: '8% OFF' },
  { id: 'p4', name: 'Organic Tomatoes 1kg', price: 29, mrp: 40, image: 'https://picsum.photos/seed/tomato/200/200', badge: 'Fresh' },
  { id: 'p5', name: 'Britannia Biscuits', price: 30, mrp: 35, image: 'https://picsum.photos/seed/biscuit/200/200', badge: '14% OFF' },
  { id: 'p6', name: 'Tropicana OJ 1L', price: 89, mrp: 110, image: 'https://picsum.photos/seed/oj/200/200', badge: 'Deal' },
];

export default function GroceryHomeScreen({ navigation }) {
  const cartCount = useSelector(selectCartCount);
  const [deliveryZone] = useState('Sector 62, Noida');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#0d1a00', '#0F0F0F']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🛒 Quick Grocery</Text>
            <View style={styles.etaChip}>
              <Ionicons name="flash" size={12} color={COLORS.green} />
              <Text style={styles.etaText}>Delivery in 10 min</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate(ROUTES.CART)}>
            <Ionicons name="bag-outline" size={22} color={COLORS.text} />
            {cartCount > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>}
          </TouchableOpacity>
        </LinearGradient>

        {/* Dark Store Banner */}
        <View style={styles.section}>
          <LinearGradient colors={['#0d2200', '#111a00']} style={styles.darkstorebanner}>
            <View>
              <Text style={styles.darkstoreTitle}>📦 Dark Store Active</Text>
              <Text style={styles.darkstoreSub}>Nearest store: {deliveryZone}</Text>
              <Text style={styles.darkstoreItems}>3,200 items in stock · 2.1 km away</Text>
            </View>
            <View style={styles.darkstoreBadge}>
              <Text style={styles.darkstoreBadgeText}>OPEN</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Promo Banner */}
        <View style={styles.section}>
          <LinearGradient colors={['#1a0d33', '#0d0020']} style={styles.promoBanner}>
            <View>
              <Text style={styles.promoTitle}>🎯 Fresh Deals Daily</Text>
              <Text style={styles.promoSub}>Get ₹50 off on orders above ₹499</Text>
              <TouchableOpacity style={styles.promoBtn}>
                <Text style={styles.promoBtnText}>Shop Now →</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 56 }}>🥑</Text>
          </LinearGradient>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <View style={styles.catGrid}>
            {GROCERY_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catCard}
                onPress={() => navigation.navigate(ROUTES.GROCERY_STORE, { category: cat.label })}
              >
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catCount}>{cat.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.GROCERY_STORE, {})}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={FEATURED_PRODUCTS}
            horizontal showsHorizontalScrollIndicator={false}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAIL, { product: item })}
              >
                {item.badge && (
                  <View style={styles.productBadge}>
                    <Text style={styles.productBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.productPriceRow}>
                  <Text style={styles.productPrice}>₹{item.price}</Text>
                  <Text style={styles.productMrp}>₹{item.mrp}</Text>
                </View>
                <TouchableOpacity style={styles.productAddBtn}>
                  <Text style={styles.productAddText}>+ ADD</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: SIZES.space16, paddingHorizontal: SIZES.space16,
  },
  backBtn: { padding: SIZES.space4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '800' },
  etaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.green + '20', borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.space8, paddingVertical: 2, marginTop: 4,
  },
  etaText: { color: COLORS.green, fontSize: 10, fontWeight: '700' },
  cartBtn: { position: 'relative', padding: SIZES.space4 },
  cartBadge: {
    position: 'absolute', top: 0, right: 0,
    width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: COLORS.white, fontSize: 8, fontWeight: '900' },
  section: { paddingHorizontal: SIZES.space16, marginBottom: SIZES.space16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.space12 },
  sectionTitle: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '800', marginBottom: SIZES.space12 },
  seeAll: { color: COLORS.brand, fontSize: SIZES.sm, fontWeight: '600' },
  darkstorebanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: SIZES.radius12, padding: SIZES.space16,
    borderWidth: 1, borderColor: COLORS.green + '33',
  },
  darkstoreTitle: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '800', marginBottom: 4 },
  darkstoreSub: { color: COLORS.textMuted, fontSize: SIZES.xs },
  darkstoreItems: { color: COLORS.green, fontSize: SIZES.xs, fontWeight: '600', marginTop: 4 },
  darkstoreBadge: {
    backgroundColor: COLORS.green, borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.space8, paddingVertical: SIZES.space4,
  },
  darkstoreBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  promoBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: SIZES.radius16, padding: SIZES.space20,
    borderWidth: 1, borderColor: COLORS.purple + '33',
  },
  promoTitle: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '900', marginBottom: 6 },
  promoSub: { color: COLORS.textMuted, fontSize: SIZES.xs, marginBottom: SIZES.space12 },
  promoBtn: {
    backgroundColor: COLORS.purple, borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.space12, paddingVertical: SIZES.space6, alignSelf: 'flex-start',
  },
  promoBtnText: { color: COLORS.white, fontSize: SIZES.xs, fontWeight: '700' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.space10 },
  catCard: {
    width: (width - SIZES.space16 * 2 - SIZES.space10 * 3) / 4,
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius12,
    borderWidth: 1, borderColor: COLORS.darkBorder,
    alignItems: 'center', paddingVertical: SIZES.space12,
  },
  catEmoji: { fontSize: 26, marginBottom: 4 },
  catLabel: { color: COLORS.text, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  catCount: { color: COLORS.textMuted, fontSize: 9, marginTop: 2 },
  productCard: {
    width: 140, backgroundColor: COLORS.darkCard,
    borderRadius: SIZES.radius12, borderWidth: 1, borderColor: COLORS.darkBorder,
    padding: SIZES.space10, marginRight: SIZES.space12, position: 'relative',
  },
  productBadge: {
    position: 'absolute', top: 8, left: 8, zIndex: 1,
    backgroundColor: COLORS.brand, borderRadius: SIZES.radiusFull,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  productBadgeText: { color: COLORS.white, fontSize: 8, fontWeight: '800' },
  productImage: { width: '100%', height: 100, borderRadius: SIZES.radius8, marginBottom: SIZES.space8, backgroundColor: COLORS.darkCard2 },
  productName: { color: COLORS.text, fontSize: SIZES.xs, fontWeight: '600', marginBottom: SIZES.space6 },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space6, marginBottom: SIZES.space8 },
  productPrice: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '800' },
  productMrp: { color: COLORS.textMuted, fontSize: 10, textDecorationLine: 'line-through' },
  productAddBtn: {
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.brand,
    borderRadius: SIZES.radius6, paddingVertical: SIZES.space4, alignItems: 'center',
  },
  productAddText: { color: COLORS.brand, fontSize: 10, fontWeight: '800' },
});

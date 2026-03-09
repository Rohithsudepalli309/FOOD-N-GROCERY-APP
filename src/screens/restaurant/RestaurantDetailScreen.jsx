import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, SectionList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import FoodItemCard from '../../components/restaurant/FoodItemCard';
import RatingStars from '../../components/common/RatingStars';
import { selectCartCount, selectCartTotal } from '../../store/slices/cartSlice';

const MENU_DATA = [
  {
    title: '🔥 Bestsellers',
    data: [
      { id: 'm1', name: 'Chicken Biryani', price: 279, isVeg: false, isBestseller: true, description: 'Fragrant basmati rice with tender chicken & whole spices', image: 'https://picsum.photos/seed/biryani/140/100' },
      { id: 'm2', name: 'Paneer Tikka', price: 229, isVeg: true, isBestseller: true, description: 'Grilled cottage cheese with spiced marinade', image: 'https://picsum.photos/seed/paneer/140/100' },
    ],
  },
  {
    title: '🍽️ Starters',
    data: [
      { id: 'm3', name: 'Veg Spring Rolls', price: 149, isVeg: true, image: 'https://picsum.photos/seed/rolls/140/100' },
      { id: 'm4', name: 'Chicken Seekh Kebab', price: 199, isVeg: false, image: 'https://picsum.photos/seed/kebab/140/100' },
    ],
  },
  {
    title: '🍲 Main Course',
    data: [
      { id: 'm5', name: 'Dal Makhani', price: 199, isVeg: true, image: 'https://picsum.photos/seed/dal/140/100' },
      { id: 'm6', name: 'Butter Chicken', price: 299, isVeg: false, description: 'Creamy tomato curry with tender chicken', image: 'https://picsum.photos/seed/btchicken/140/100' },
      { id: 'm7', name: 'Kadai Paneer', price: 249, isVeg: true, image: 'https://picsum.photos/seed/kadai/140/100' },
    ],
  },
  {
    title: '🍞 Breads',
    data: [
      { id: 'm8', name: 'Garlic Naan (2 pcs)', price: 59, isVeg: true, image: 'https://picsum.photos/seed/naan/140/100' },
      { id: 'm9', name: 'Tandoori Roti', price: 29, isVeg: true, image: 'https://picsum.photos/seed/roti/140/100' },
    ],
  },
  {
    title: '🍨 Desserts',
    data: [
      { id: 'm10', name: 'Gulab Jamun (4 pcs)', price: 89, isVeg: true, isBestseller: true, image: 'https://picsum.photos/seed/gulab/140/100' },
    ],
  },
];

export default function RestaurantDetailScreen({ navigation, route }) {
  const { restaurant } = route.params || {};
  const cartCount = useSelector(selectCartCount);
  const cartTotal = useSelector(selectCartTotal);
  const [vegOnly, setVegOnly] = useState(false);

  const filteredSections = MENU_DATA.map(s => ({
    ...s,
    data: vegOnly ? s.data.filter(i => i.isVeg) : s.data,
  })).filter(s => s.data.length > 0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Hero Image */}
      <View style={styles.hero}>
        <Image
          source={{ uri: restaurant?.image || 'https://picsum.photos/seed/rest/800/300' }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-social-outline" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={filteredSections}
        keyExtractor={i => i.id}
        stickySectionHeadersEnabled
        ListHeaderComponent={() => (
          <View style={styles.infoSection}>
            <Text style={styles.name}>{restaurant?.name ?? 'Restaurant'}</Text>
            <Text style={styles.cuisine}>{restaurant?.cuisine ?? 'Multi-cuisine'}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaCard}>
                <Ionicons name="star" size={14} color={COLORS.green} />
                <Text style={styles.metaVal}>{restaurant?.rating ?? '4.2'}</Text>
                <Text style={styles.metaLabel}>Rating</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaCard}>
                <Ionicons name="time-outline" size={14} color={COLORS.accent} />
                <Text style={styles.metaVal}>{restaurant?.deliveryTime ?? '30-45'}</Text>
                <Text style={styles.metaLabel}>Minutes</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaCard}>
                <Ionicons name="receipt-outline" size={14} color={COLORS.yellow} />
                <Text style={styles.metaVal}>₹{restaurant?.minOrder ?? '199'}</Text>
                <Text style={styles.metaLabel}>Min Order</Text>
              </View>
            </View>

            {/* Offer */}
            {restaurant?.offer && (
              <View style={styles.offerRow}>
                <Ionicons name="pricetag" size={14} color={COLORS.brand} />
                <Text style={styles.offerText}>{restaurant.offer}</Text>
              </View>
            )}

            {/* Veg toggle */}
            <View style={styles.vegToggleRow}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setVegOnly(v => !v)} style={styles.vegToggle}>
                <View style={[styles.vegDot, { backgroundColor: COLORS.green }]} />
                <Text style={styles.vegText}>Veg Only</Text>
                <View style={[styles.toggleTrack, vegOnly && styles.toggleActive]}>
                  <View style={[styles.toggleKnob, vegOnly && styles.toggleKnobActive]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: SIZES.space16 }}>
            <FoodItemCard
              item={item}
              restaurantId={restaurant?.id ?? 'r1'}
              restaurantName={restaurant?.name ?? 'Restaurant'}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: cartCount > 0 ? 100 : 40 }}
      />

      {/* Cart FAB */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.cartFab}
          onPress={() => navigation.navigate(ROUTES.CART)}
          activeOpacity={0.9}
        >
          <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} style={styles.cartFabGrad}>
            <View style={styles.cartFabLeft}>
              <Text style={styles.cartCount}>{cartCount} items</Text>
              <Text style={styles.cartTotal}>₹{cartTotal.toFixed(0)}</Text>
            </View>
            <View style={styles.cartFabRight}>
              <Text style={styles.viewCart}>View Cart</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  hero: { height: 220, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute', top: 48, left: SIZES.space16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  shareBtn: {
    position: 'absolute', top: 48, right: SIZES.space16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  infoSection: { padding: SIZES.space16, backgroundColor: COLORS.dark },
  name: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '900', marginBottom: 4 },
  cuisine: { color: COLORS.textMuted, fontSize: SIZES.sm, marginBottom: SIZES.space16 },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius12,
    borderWidth: 1, borderColor: COLORS.darkBorder, padding: SIZES.space16,
    marginBottom: SIZES.space12,
  },
  metaCard: { flex: 1, alignItems: 'center', gap: 4 },
  metaVal: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '800' },
  metaLabel: { color: COLORS.textMuted, fontSize: 10 },
  metaDivider: { width: 1, backgroundColor: COLORS.darkBorder, marginHorizontal: SIZES.space8 },
  offerRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space6,
    backgroundColor: COLORS.brand + '15', borderRadius: SIZES.radius8,
    borderWidth: 1, borderColor: COLORS.brand + '33',
    padding: SIZES.space10, marginBottom: SIZES.space12,
  },
  offerText: { color: COLORS.brand, fontSize: SIZES.xs, fontWeight: '700', flex: 1 },
  vegToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SIZES.space8 },
  menuTitle: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '800' },
  vegToggle: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space6 },
  vegDot: { width: 10, height: 10, borderRadius: 5 },
  vegText: { color: COLORS.textMuted, fontSize: SIZES.xs },
  toggleTrack: { width: 36, height: 20, borderRadius: 10, backgroundColor: COLORS.darkBorder2, justifyContent: 'center', padding: 2 },
  toggleActive: { backgroundColor: COLORS.green + '44' },
  toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.textMuted },
  toggleKnobActive: { transform: [{ translateX: 16 }], backgroundColor: COLORS.green },
  sectionHeader: {
    backgroundColor: COLORS.dark, paddingHorizontal: SIZES.space16,
    paddingVertical: SIZES.space10, borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder,
  },
  sectionTitle: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700' },
  cartFab: {
    position: 'absolute', bottom: 20, left: SIZES.space16, right: SIZES.space16,
    borderRadius: SIZES.radius12, overflow: 'hidden', ...SHADOWS.brand,
  },
  cartFabGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.space20, paddingVertical: SIZES.space14 ?? 14,
  },
  cartFabLeft: {},
  cartCount: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.xs },
  cartTotal: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '900' },
  cartFabRight: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space6 },
  viewCart: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '700' },
});

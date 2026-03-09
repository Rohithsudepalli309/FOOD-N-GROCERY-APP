import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, ImageBackground, Dimensions, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import RestaurantCard from '../../components/restaurant/RestaurantCard';

const { width } = Dimensions.get('window');

// --- MOCK DATA ---
const BANNERS = [
  { id: '1', title: '50% OFF on First Order', sub: 'Use code: FIRSTFG', color: [COLORS.brand, '#E85D2A'], emoji: '🎉' },
  { id: '2', title: 'Free Delivery Today', sub: 'On orders above ₹199', color: ['#2D9CDB', '#1a7bad'], emoji: '🛵' },
  { id: '3', title: 'Grocery in 10 Min', sub: '3000+ products available', color: ['#FF9F43', '#e07b1a'], emoji: '🛒' },
];

const CATEGORIES = [
  { id: '1', label: 'Biryani', emoji: '🍛' },
  { id: '2', label: 'Pizza', emoji: '🍕' },
  { id: '3', label: 'Burger', emoji: '🍔' },
  { id: '4', label: 'Sushi', emoji: '🍣' },
  { id: '5', label: 'Chinese', emoji: '🥡' },
  { id: '6', label: 'Desserts', emoji: '🍦' },
  { id: '7', label: 'Pasta', emoji: '🍝' },
  { id: '8', label: 'Sandwich', emoji: '🥪' },
];

const RESTAURANTS = [
  { id: '1', name: 'Barbeque Nation', cuisine: 'North Indian, Barbeque', rating: 4.5, deliveryTime: '30-45', minOrder: '299', offer: '20% OFF up to ₹100', image: 'https://picsum.photos/seed/bbq/400/200' },
  { id: '2', name: 'Pizza Hut', cuisine: 'Pizza, Italian, Desserts', rating: 4.2, deliveryTime: '25-35', minOrder: '149', offer: 'Buy 1 Get 1 Free', image: 'https://picsum.photos/seed/pizzahut/400/200' },
  { id: '3', name: 'McDonald\'s', cuisine: 'Burger, Fast Food, Beverages', rating: 4.4, deliveryTime: '20-30', minOrder: '99', image: 'https://picsum.photos/seed/mcdonalds/400/200' },
  { id: '4', name: 'Haldiram\'s', cuisine: 'North Indian, Sweets, Snacks', rating: 4.3, deliveryTime: '35-50', minOrder: '199', isOpen: false, image: 'https://picsum.photos/seed/haldirams/400/200' },
  { id: '5', name: 'Domino\'s Pizza', cuisine: 'Pizza, Pasta, Italian', rating: 4.1, deliveryTime: '25-40', minOrder: '149', offer: 'Flat ₹50 OFF on ₹299+', image: 'https://picsum.photos/seed/dominos/400/200' },
];

export default function HomeScreen({ navigation }) {
  const user = useSelector(s => s.auth.user);
  const address = useSelector(s => s.location.address);
  const [activeBanner, setActiveBanner] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />}
      >
        {/* Header */}
        <LinearGradient colors={['#1a0500', '#0F0F0F']} style={styles.header}>
          <View style={styles.locationRow}>
            <View style={styles.locationLeft}>
              <View style={styles.locationTag}>
                <Ionicons name="location" size={14} color={COLORS.brand} />
                <Text style={styles.locationLabel}>Home</Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.brand} />
              </View>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {address || 'Set your delivery location'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarBtn}>
                <Text style={styles.avatarText}>{user?.name?.[0] ?? 'U'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate(ROUTES.SEARCH)}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <Text style={styles.searchText}>Search restaurants, dishes...</Text>
            <View style={styles.micButton}>
              <Ionicons name="mic" size={16} color={COLORS.brand} />
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* Promo Banners */}
        <View style={styles.section}>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            pagingEnabled={false}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 80));
              setActiveBanner(Math.min(idx, BANNERS.length - 1));
            }}
          >
            {BANNERS.map((b, i) => (
              <TouchableOpacity key={b.id} activeOpacity={0.9} style={{ marginRight: SIZES.space12 }}>
                <LinearGradient colors={b.color} style={styles.banner}>
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerEmoji}>{b.emoji}</Text>
                    <View>
                      <Text style={styles.bannerTitle}>{b.title}</Text>
                      <Text style={styles.bannerSub}>{b.sub}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.bannerDots}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[styles.bannerDot, i === activeBanner && styles.bannerDotActive]} />
            ))}
          </View>
        </View>

        {/* Quick Grocery */}
        <TouchableOpacity
          style={styles.groceryBanner}
          onPress={() => navigation.navigate(ROUTES.GROCERY_HOME)}
          activeOpacity={0.88}
        >
          <LinearGradient colors={['#0d1a0d', '#111']} style={styles.groceryGrad}>
            <View style={styles.groceryLeft}>
              <Text style={styles.groceryTitle}>🛒 Quick Grocery</Text>
              <Text style={styles.grocerySub}>Delivered in 10 minutes</Text>
              <View style={styles.groceryChip}>
                <Text style={styles.groceryChipText}>3000+ items →</Text>
              </View>
            </View>
            <Text style={{ fontSize: 64 }}>🥦</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What's on your mind?</Text>
          </View>
          <FlatList
            data={CATEGORIES}
            horizontal showsHorizontalScrollIndicator={false}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.catItem}
                onPress={() => navigation.navigate(ROUTES.CATEGORY, { category: item.label })}
              >
                <View style={styles.catEmoji}>
                  <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                </View>
                <Text style={styles.catLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Restaurant List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Restaurants</Text>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.RESTAURANT_LIST)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {RESTAURANTS.map((r) => (
            <RestaurantCard
              key={r.id}
              item={r}
              onPress={() => navigation.navigate(ROUTES.RESTAURANT_DETAIL, { restaurant: r })}
            />
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: { paddingTop: 52, paddingHorizontal: SIZES.space16, paddingBottom: SIZES.space16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.space12 },
  locationLeft: { flex: 1 },
  locationTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationLabel: { color: COLORS.brand, fontSize: SIZES.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  locationAddress: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700', marginTop: 2, maxWidth: 220 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space10 },
  iconBtn: { padding: SIZES.space6 },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.darkCard,
    borderRadius: SIZES.radius12, borderWidth: 1, borderColor: COLORS.darkBorder,
    paddingHorizontal: SIZES.space14 ?? 14, height: 46, gap: SIZES.space10,
  },
  searchText: { flex: 1, color: COLORS.textMuted, fontSize: SIZES.sm },
  micButton: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.brand + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  section: { paddingHorizontal: SIZES.space16, marginBottom: SIZES.space8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.space12, marginTop: SIZES.space16 },
  sectionTitle: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '800' },
  seeAll: { color: COLORS.brand, fontSize: SIZES.sm, fontWeight: '600' },
  banner: {
    width: width - 80, height: 110,
    borderRadius: SIZES.radius16, marginLeft: SIZES.space16,
    justifyContent: 'center', paddingHorizontal: SIZES.space20,
  },
  bannerContent: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space16 },
  bannerEmoji: { fontSize: 40 },
  bannerTitle: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '900' },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.xs, marginTop: 2 },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: SIZES.space12 },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.darkBorder2 },
  bannerDotActive: { width: 18, backgroundColor: COLORS.brand },
  groceryBanner: { marginHorizontal: SIZES.space16, marginBottom: SIZES.space4, borderRadius: SIZES.radius16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.darkBorder },
  groceryGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.space20, paddingVertical: SIZES.space16 },
  groceryLeft: {},
  groceryTitle: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '800' },
  grocerySub: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 4 },
  groceryChip: { marginTop: SIZES.space10, backgroundColor: COLORS.green + '22', borderWidth: 1, borderColor: COLORS.green + '44', borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.space12, paddingVertical: SIZES.space4, alignSelf: 'flex-start' },
  groceryChipText: { color: COLORS.green, fontSize: SIZES.xs, fontWeight: '700' },
  catItem: { alignItems: 'center', marginRight: SIZES.space16, width: 72 },
  catEmoji: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1, borderColor: COLORS.darkBorder,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SIZES.space6,
  },
  catLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
});

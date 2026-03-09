import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { addItem, removeItem, selectItemInCart, selectCartTotal } from '../../store/slices/cartSlice';

const { width } = Dimensions.get('window');

export default function MenuItemScreen({ navigation, route }) {
  const { item, restaurantId, restaurantName } = route.params || {};
  const dispatch = useDispatch();
  const cartItem = useSelector(selectItemInCart(item?.id));
  const cartTotal = useSelector(selectCartTotal);
  const qty = cartItem?.quantity ?? 0;

  const mockItem = item || {
    id: 'mock1', name: 'Butter Chicken', price: 299, isVeg: false, isBestseller: true,
    description: 'Rich, creamy tomato-based curry with tender pieces of chicken. Marinated overnight and slow-cooked to perfection. Served with naan or rice.',
    calories: 450, protein: 28, carbs: 18, fat: 22,
    customizations: ['Extra Butter', 'Less Spicy', 'Extra Spicy', 'No Onion', 'No Garlic'],
    image: 'https://picsum.photos/seed/butterchicken/600/400',
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: mockItem.image }} style={styles.image} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.imageGrad} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Name & Price */}
          <View style={styles.nameRow}>
            <View style={styles.vegIndicator}>
              <View style={[styles.vegDot, { backgroundColor: mockItem.isVeg ? COLORS.green : COLORS.red }]} />
            </View>
            <View style={styles.nameInfo}>
              <Text style={styles.name}>{mockItem.name}</Text>
              {mockItem.isBestseller && (
                <View style={styles.bestseller}>
                  <Ionicons name="flame" size={12} color={COLORS.brand} />
                  <Text style={styles.bestText}>Bestseller</Text>
                </View>
              )}
            </View>
            <Text style={styles.price}>₹{mockItem.price}</Text>
          </View>
          <Text style={styles.desc}>{mockItem.description}</Text>

          {/* Nutrition */}
          <View style={styles.nutritionCard}>
            <Text style={styles.sectionLabel}>Nutrition Info (per serving)</Text>
            <View style={styles.nutritionRow}>
              {[
                { label: 'Calories', val: mockItem.calories + ' kcal', icon: '🔥' },
                { label: 'Protein', val: mockItem.protein + 'g', icon: '💪' },
                { label: 'Carbs', val: mockItem.carbs + 'g', icon: '🌾' },
                { label: 'Fat', val: mockItem.fat + 'g', icon: '💧' },
              ].map(n => (
                <View key={n.label} style={styles.nutrientItem}>
                  <Text style={styles.nutrientIcon}>{n.icon}</Text>
                  <Text style={styles.nutrientVal}>{n.val}</Text>
                  <Text style={styles.nutrientLabel}>{n.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Customizations */}
          {mockItem.customizations && (
            <View style={styles.custSection}>
              <Text style={styles.sectionLabel}>Customizations (Optional)</Text>
              {mockItem.customizations.map(c => (
                <TouchableOpacity key={c} style={styles.custItem}>
                  <Text style={styles.custText}>{c}</Text>
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.brand} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Add to Cart */}
      <View style={styles.footer}>
        {qty === 0 ? (
          <TouchableOpacity

            style={styles.addBtn}
            onPress={() => dispatch(addItem({ item: mockItem, restaurantId: restaurantId ?? 'r1', restaurantName: restaurantName ?? 'Restaurant' }))}
          >
            <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} style={styles.addGrad}>
              <Text style={styles.addText}>Add to Cart — ₹{mockItem.price}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.counterRow}>
            <TouchableOpacity style={styles.cntBtn} onPress={() => dispatch(removeItem(mockItem.id))}>
              <Ionicons name="remove" size={20} color={COLORS.brand} />
            </TouchableOpacity>
            <Text style={styles.qty}>{qty}</Text>
            <TouchableOpacity style={styles.cntBtn} onPress={() => dispatch(addItem({ item: mockItem, restaurantId: restaurantId ?? 'r1', restaurantName: restaurantName ?? 'Restaurant' }))}>
              <Ionicons name="add" size={20} color={COLORS.brand} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewCartBtn} onPress={() => navigation.navigate(ROUTES.CART)}>
              <Text style={styles.viewCartText}>View Cart · ₹{cartTotal}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  imageWrap: { height: 280, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageGrad: { ...StyleSheet.absoluteFillObject },
  backBtn: {
    position: 'absolute', top: 48, left: SIZES.space16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: SIZES.space16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space10, marginBottom: SIZES.space12 },
  vegIndicator: {
    width: 18, height: 18, borderRadius: 3, borderWidth: 1.5,
    borderColor: COLORS.green, alignItems: 'center', justifyContent: 'center',
  },
  vegDot: { width: 9, height: 9, borderRadius: 5 },
  nameInfo: { flex: 1 },
  name: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '900' },
  bestseller: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  bestText: { color: COLORS.brand, fontSize: 10, fontWeight: '700' },
  price: { color: COLORS.brand, fontSize: SIZES.xxl, fontWeight: '900' },
  desc: { color: COLORS.textMuted, fontSize: SIZES.sm, lineHeight: 20, marginBottom: SIZES.space20 },
  sectionLabel: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700', marginBottom: SIZES.space12 },
  nutritionCard: {
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius12,
    borderWidth: 1, borderColor: COLORS.darkBorder, padding: SIZES.space16, marginBottom: SIZES.space20,
  },
  nutritionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  nutrientItem: { alignItems: 'center', gap: 4 },
  nutrientIcon: { fontSize: 20 },
  nutrientVal: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '800' },
  nutrientLabel: { color: COLORS.textMuted, fontSize: 10 },
  custSection: { marginBottom: SIZES.space16 },
  custItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SIZES.space12, borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder,
  },
  custText: { color: COLORS.text, fontSize: SIZES.sm },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SIZES.space16, backgroundColor: COLORS.dark,
    borderTopWidth: 1, borderTopColor: COLORS.darkBorder,
  },
  addBtn: { borderRadius: SIZES.radius12, overflow: 'hidden' },
  addGrad: { height: SIZES.buttonHeight, alignItems: 'center', justifyContent: 'center' },
  addText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '800' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space12 },
  cntBtn: {
    width: 44, height: 44, borderRadius: SIZES.radius8,
    backgroundColor: COLORS.darkCard, borderWidth: 1, borderColor: COLORS.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  qty: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  viewCartBtn: {
    flex: 1, height: 44, backgroundColor: COLORS.brand, borderRadius: SIZES.radius8,
    alignItems: 'center', justifyContent: 'center',
  },
  viewCartText: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '700' },
});

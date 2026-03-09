import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { addItem, removeItem, selectItemInCart } from '../../store/slices/cartSlice';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ navigation, route }) {
  const { product } = route.params || {};
  const dispatch = useDispatch();
  const cartItem = useSelector(selectItemInCart(product?.id ?? 'mock'));
  const qty = cartItem?.quantity ?? 0;
  const [selectedSize, setSelectedSize] = useState(0);

  const p = product || {
    id: 'mock_p', name: 'Amul Butter 500g', price: 248, mrp: 275,
    image: 'https://picsum.photos/seed/butter/600/400',
    category: 'Dairy', stock: 20, isVeg: true,
    description: 'Made from fresh cream, Amul Butter is rich in natural flavours. Perfect for cooking, baking, or spreading.',
    sizes: ['100g', '200g', '500g', '1kg'],
    sizePrices: [55, 103, 248, 480],
    nutrition: { calories: '720 kcal', fat: '80g', protein: '1g', carbs: '0.5g' },
  };

  const handleAdd = () => dispatch(addItem({ item: { ...p, price: p.sizePrices?.[selectedSize] ?? p.price }, restaurantId: 'grocery_store', restaurantName: 'Grocery' }));
  const handleRemove = () => dispatch(removeItem(p.id));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: p.image }} style={styles.image} resizeMode="cover" />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          {p.mrp > p.price && (
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>Save ₹{p.mrp - p.price}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.category}>{p.category}</Text>
            {p.isVeg && (
              <View style={styles.vegTag}>
                <View style={styles.vegDot} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{p.name}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{p.sizePrices?.[selectedSize] ?? p.price}</Text>
            {p.mrp && <Text style={styles.mrp}>₹{p.mrp}</Text>}
            {p.mrp > p.price && (
              <View style={styles.discountChip}>
                <Text style={styles.discountText}>{Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off</Text>
              </View>
            )}
          </View>

          {/* Size options */}
          {p.sizes && (
            <View style={styles.sizesWrap}>
              <Text style={styles.sizeLabel}>Select Size</Text>
              <View style={styles.sizesRow}>
                {p.sizes.map((s, i) => (
                  <TouchableOpacity
                    key={s} onPress={() => setSelectedSize(i)}
                    style={[styles.sizeBtn, i === selectedSize && styles.sizeBtnActive]}
                  >
                    <Text style={[styles.sizeBtnText, i === selectedSize && styles.sizeBtnTextActive]}>{s}</Text>
                    <Text style={[styles.sizeBtnPrice, i === selectedSize && styles.sizeBtnTextActive]}>₹{p.sizePrices[i]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Stock info */}
          <View style={styles.stockRow}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
            <Text style={styles.stockText}>{p.stock} units in stock · 10 min delivery</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <Text style={styles.desc}>{p.description}</Text>
          </View>

          {/* Nutrition */}
          {p.nutrition && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition (per 100g)</Text>
              <View style={styles.nutritionGrid}>
                {Object.entries(p.nutrition).map(([k, v]) => (
                  <View key={k} style={styles.nutrientCard}>
                    <Text style={styles.nutrientVal}>{v}</Text>
                    <Text style={styles.nutrientKey}>{k}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {qty === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <LinearGradient colors={[COLORS.green, '#1e8c4a']} style={styles.addGrad}>
              <Ionicons name="cart-outline" size={20} color={COLORS.white} />
              <Text style={styles.addText}>Add to Cart — ₹{p.sizePrices?.[selectedSize] ?? p.price}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.counterRow}>
            <TouchableOpacity style={styles.cntBtn} onPress={handleRemove}>
              <Ionicons name={qty === 1 ? 'trash-outline' : 'remove'} size={20} color={COLORS.green} />
            </TouchableOpacity>
            <Text style={styles.qty}>{qty} in cart</Text>
            <TouchableOpacity style={[styles.cntBtn, { backgroundColor: COLORS.green }]} onPress={handleAdd}>
              <Ionicons name="add" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewCartBtn} onPress={() => navigation.navigate(ROUTES.CART)}>
              <Text style={styles.viewCartText}>View Cart →</Text>
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
  image: { width: '100%', height: '100%', backgroundColor: COLORS.darkCard },
  backBtn: {
    position: 'absolute', top: 48, left: SIZES.space16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  saveBadge: {
    position: 'absolute', top: 48, right: SIZES.space16,
    backgroundColor: COLORS.green, borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.space10, paddingVertical: SIZES.space4,
  },
  saveText: { color: COLORS.white, fontSize: SIZES.xs, fontWeight: '800' },
  content: { padding: SIZES.space16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.space6 },
  category: { color: COLORS.textMuted, fontSize: SIZES.xs, fontWeight: '600', textTransform: 'uppercase' },
  vegTag: {
    width: 18, height: 18, borderRadius: 3, borderWidth: 1.5, borderColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  vegDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.green },
  name: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '900', marginBottom: SIZES.space12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space8, marginBottom: SIZES.space16 },
  price: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '900' },
  mrp: { color: COLORS.textMuted, fontSize: SIZES.md, textDecorationLine: 'line-through' },
  discountChip: {
    backgroundColor: COLORS.green + '22', borderWidth: 1, borderColor: COLORS.green + '55',
    borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.space8, paddingVertical: 2,
  },
  discountText: { color: COLORS.green, fontSize: SIZES.xs, fontWeight: '700' },
  sizesWrap: { marginBottom: SIZES.space16 },
  sizeLabel: { color: COLORS.textMuted, fontSize: SIZES.xs, fontWeight: '700', textTransform: 'uppercase', marginBottom: SIZES.space8 },
  sizesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.space8 },
  sizeBtn: {
    paddingHorizontal: SIZES.space12, paddingVertical: SIZES.space8,
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius8,
    borderWidth: 1, borderColor: COLORS.darkBorder, alignItems: 'center',
  },
  sizeBtnActive: { borderColor: COLORS.green, backgroundColor: COLORS.green + '15' },
  sizeBtnText: { color: COLORS.textMuted, fontSize: SIZES.xs, fontWeight: '700' },
  sizeBtnPrice: { color: COLORS.textMuted, fontSize: 10 },
  sizeBtnTextActive: { color: COLORS.green },
  stockRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space6,
    backgroundColor: COLORS.green + '10', borderRadius: SIZES.radius8,
    padding: SIZES.space10, marginBottom: SIZES.space16,
  },
  stockText: { color: COLORS.green, fontSize: SIZES.xs, fontWeight: '600' },
  section: { marginBottom: SIZES.space20 },
  sectionTitle: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700', marginBottom: SIZES.space10, borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder, paddingBottom: SIZES.space8 },
  desc: { color: COLORS.textMuted, fontSize: SIZES.sm, lineHeight: 20 },
  nutritionGrid: { flexDirection: 'row', gap: SIZES.space10 },
  nutrientCard: {
    flex: 1, backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius8,
    borderWidth: 1, borderColor: COLORS.darkBorder, padding: SIZES.space10, alignItems: 'center',
  },
  nutrientVal: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '800', marginBottom: 2 },
  nutrientKey: { color: COLORS.textMuted, fontSize: 9, fontWeight: '600', textTransform: 'capitalize' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.dark, borderTopWidth: 1, borderTopColor: COLORS.darkBorder, padding: SIZES.space16,
  },
  addBtn: { borderRadius: SIZES.radius12, overflow: 'hidden' },
  addGrad: { height: SIZES.buttonHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.space8 },
  addText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '800' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space10 },
  cntBtn: {
    width: 44, height: 44, borderRadius: SIZES.radius8,
    borderWidth: 1.5, borderColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  qty: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '600', flex: 1 },
  viewCartBtn: {
    height: 44, paddingHorizontal: SIZES.space16, backgroundColor: COLORS.green,
    borderRadius: SIZES.radius8, alignItems: 'center', justifyContent: 'center',
  },
  viewCartText: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '700' },
});

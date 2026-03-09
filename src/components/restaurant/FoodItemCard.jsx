import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { addItem, removeItem, selectItemInCart } from '../../store/slices/cartSlice';

export default function FoodItemCard({ item, restaurantId, restaurantName }) {
  const dispatch = useDispatch();
  const cartItem = useSelector(selectItemInCart(item.id));
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () => dispatch(addItem({ item, restaurantId, restaurantName }));
  const handleRemove = () => dispatch(removeItem(item.id));

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        {item.isVeg !== undefined && (
          <View style={[styles.vegIndicator, { borderColor: item.isVeg ? COLORS.green : COLORS.red }]}>
            <View style={[styles.vegDot, { backgroundColor: item.isVeg ? COLORS.green : COLORS.red }]} />
          </View>
        )}
        <Text style={styles.name}>{item.name}</Text>
        {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
        <Text style={styles.price}>₹{item.price}</Text>
        {item.isBestseller && (
          <View style={styles.bestseller}>
            <Ionicons name="flame" size={10} color={COLORS.brand} />
            <Text style={styles.bestsellerText}>Bestseller</Text>
          </View>
        )}
      </View>
      <View style={styles.right}>
        <Image
          source={{ uri: item.image || 'https://picsum.photos/seed/' + item.id + '/120/120' }}
          style={styles.image}
          resizeMode="cover"
        />
        {qty === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
            <Text style={styles.addText}>ADD</Text>
            <Ionicons name="add" size={14} color={COLORS.brand} />
          </TouchableOpacity>
        ) : (
          <View style={styles.counter}>
            <TouchableOpacity onPress={handleRemove} style={styles.counterBtn}>
              <Ionicons name="remove" size={16} color={COLORS.brand} />
            </TouchableOpacity>
            <Text style={styles.counterVal}>{qty}</Text>
            <TouchableOpacity onPress={handleAdd} style={styles.counterBtn}>
              <Ionicons name="add" size={16} color={COLORS.brand} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: SIZES.space16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
    alignItems: 'center',
  },
  left: { flex: 1, paddingRight: SIZES.space12 },
  vegIndicator: {
    width: 16, height: 16, borderRadius: 3, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.space6,
  },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  name: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '600', marginBottom: 4 },
  desc: { color: COLORS.textMuted, fontSize: SIZES.xs, lineHeight: 16, marginBottom: SIZES.space6 },
  price: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700' },
  bestseller: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SIZES.space6 },
  bestsellerText: { color: COLORS.brand, fontSize: 10, fontWeight: '700' },
  right: { alignItems: 'center', gap: SIZES.space8 },
  image: {
    width: 110, height: 90, borderRadius: SIZES.radius12,
    backgroundColor: COLORS.darkCard2,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1.5, borderColor: COLORS.brand,
    borderRadius: SIZES.radius8,
    paddingHorizontal: SIZES.space12, paddingVertical: SIZES.space6,
  },
  addText: { color: COLORS.brand, fontSize: SIZES.sm, fontWeight: '800' },
  counter: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.brand,
    borderRadius: SIZES.radius8,
    overflow: 'hidden',
  },
  counterBtn: { padding: SIZES.space8 },
  counterVal: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '800', minWidth: 24, textAlign: 'center' },
});

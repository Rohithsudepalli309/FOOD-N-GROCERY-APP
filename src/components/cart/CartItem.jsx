import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { addItem, removeItem } from '../../store/slices/cartSlice';

export default function CartItem({ item }) {
  const dispatch = useDispatch();
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image || 'https://picsum.photos/seed/' + item.id + '/80/80' }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.price}>₹{(item.price * item.quantity).toFixed(0)}</Text>
      </View>
      <View style={styles.counter}>
        <TouchableOpacity style={styles.btn} onPress={() => dispatch(removeItem(item.id))}>
          <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={COLORS.brand} />
        </TouchableOpacity>
        <Text style={styles.qty}>{item.quantity}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => dispatch(addItem({ item, restaurantId: item.restaurantId, restaurantName: item.restaurantName }))}>
          <Ionicons name="add" size={16} color={COLORS.brand} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: SIZES.space12, gap: SIZES.space12,
    backgroundColor: COLORS.darkCard,
    borderRadius: SIZES.radius12,
    marginBottom: SIZES.space10,
    borderWidth: 1, borderColor: COLORS.darkBorder,
  },
  image: { width: 60, height: 60, borderRadius: SIZES.radius8, backgroundColor: COLORS.darkCard2 },
  info: { flex: 1 },
  name: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '600', marginBottom: 4 },
  price: { color: COLORS.brand, fontSize: SIZES.md, fontWeight: '800' },
  counter: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.darkCard2,
    borderRadius: SIZES.radius8, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.darkBorder,
  },
  btn: { padding: SIZES.space8 },
  qty: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '700', minWidth: 24, textAlign: 'center' },
});

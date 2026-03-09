import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import RatingStars from '../common/RatingStars';
import Badge from '../common/Badge';

export default function RestaurantCard({ item, onPress, style }) {
  const discount = item.offer || null;
  const isClosed = item.isOpen === false;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={[styles.card, SHADOWS.small, style]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image || 'https://picsum.photos/seed/' + item.id + '/400/200' }}
          style={styles.image}
          resizeMode="cover"
        />
        {discount && (
          <View style={styles.offerBadge}>
            <Text style={styles.offerText}>{discount}</Text>
          </View>
        )}
        {isClosed && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>CLOSED</Text>
          </View>
        )}
        {item.isPureVeg && (
          <View style={styles.vegTag}>
            <View style={styles.vegDot} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.isPromoted && <Badge label="AD" color={COLORS.yellow} style={styles.adBadge} />}
        </View>
        <Text style={styles.cuisine} numberOfLines={1}>{item.cuisine}</Text>
        <View style={styles.metaRow}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={COLORS.green} />
            <Text style={styles.ratingText}>{item.rating?.toFixed(1) ?? '4.2'}</Text>
          </View>
          <View style={styles.dot} />
          <Text style={styles.meta}>{item.deliveryTime ?? '25-35'} min</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>₹{item.minOrder ?? '99'} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.darkCard,
    borderRadius: SIZES.radius16,
    overflow: 'hidden',
    marginBottom: SIZES.space16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  imageContainer: { height: 160, position: 'relative' },
  image: { width: '100%', height: '100%' },
  offerBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.brand,
    paddingVertical: 5, paddingHorizontal: SIZES.space12,
  },
  offerText: { color: COLORS.white, fontSize: SIZES.xs, fontWeight: '800', letterSpacing: 0.5 },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  closedText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '900', letterSpacing: 2 },
  vegTag: {
    position: 'absolute', top: SIZES.space8, right: SIZES.space8,
    width: 20, height: 20, borderRadius: 4,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  vegDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.green },
  info: { padding: SIZES.space12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  name: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700', flex: 1 },
  adBadge: { marginLeft: SIZES.space6 },
  cuisine: { color: COLORS.textMuted, fontSize: SIZES.xs, marginBottom: SIZES.space8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { color: COLORS.green, fontSize: SIZES.xs, fontWeight: '700' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.textDim },
  meta: { color: COLORS.textMuted, fontSize: SIZES.xs },
});

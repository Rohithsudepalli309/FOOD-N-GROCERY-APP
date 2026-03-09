import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

export default function Badge({ label, color = COLORS.brand, textColor = COLORS.white, style }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SIZES.space8,
    paddingVertical: SIZES.space2,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: SIZES.xs, fontWeight: '700' },
});

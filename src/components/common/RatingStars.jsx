import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export default function RatingStars({ rating = 0, size = 12, color = COLORS.yellow }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {stars.map(s => {
        const name = rating >= s ? 'star' : rating >= s - 0.5 ? 'star-half' : 'star-outline';
        return <Ionicons key={s} name={name} size={size} color={color} />;
      })}
    </View>
  );
}

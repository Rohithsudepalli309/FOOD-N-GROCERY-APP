import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants/theme';

export default function Button({
  title, onPress, variant = 'primary', loading = false,
  disabled = false, style, textStyle, fullWidth = true,
}) {
  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85} style={[{ borderRadius: SIZES.radius12 }, style]}>
        <LinearGradient
          colors={disabled ? ['#444', '#333'] : [COLORS.brand, COLORS.brandDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.button, fullWidth && styles.full]}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={[styles.textPrimary, textStyle]}>{title}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  if (variant === 'outline') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85}
        style={[styles.button, styles.outline, fullWidth && styles.full, style]}>
        {loading
          ? <ActivityIndicator color={COLORS.brand} />
          : <Text style={[styles.textOutline, textStyle]}>{title}</Text>
        }
      </TouchableOpacity>
    );
  }
  if (variant === 'ghost') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.7}
        style={[styles.ghost, style]}>
        <Text style={[styles.textGhost, textStyle]}>{title}</Text>
      </TouchableOpacity>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  button: {
    height: SIZES.buttonHeight,
    borderRadius: SIZES.radius12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.space20,
  },
  full: { width: '100%' },
  outline: {
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    backgroundColor: 'transparent',
  },
  ghost: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.space8,
  },
  textPrimary: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textOutline: {
    color: COLORS.brand,
    fontSize: SIZES.md,
    fontWeight: '700',
  },
  textGhost: {
    color: COLORS.brand,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
});

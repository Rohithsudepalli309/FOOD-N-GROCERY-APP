import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

export default function Input({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType = 'default', error, icon, style, inputStyle,
  maxLength, autoFocus, editable = true, onSubmitEditing,
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        focused && styles.focused,
        error && styles.error,
        !editable && styles.disabled,
      ]}>
        {icon && <Ionicons name={icon} size={20} color={focused ? COLORS.brand : COLORS.textMuted} style={styles.icon} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textDim}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          style={[styles.input, inputStyle]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={maxLength}
          autoFocus={autoFocus}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SIZES.space16 },
  label: { color: COLORS.textMuted, fontSize: SIZES.sm, fontWeight: '600', marginBottom: SIZES.space8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkCard,
    borderRadius: SIZES.radius12,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    height: SIZES.inputHeight,
    paddingHorizontal: SIZES.space16,
  },
  focused: { borderColor: COLORS.brand },
  error: { borderColor: COLORS.red },
  disabled: { opacity: 0.6 },
  icon: { marginRight: SIZES.space8 },
  input: { flex: 1, color: COLORS.text, fontSize: SIZES.md },
  eyeBtn: { padding: SIZES.space4 },
  errorText: { color: COLORS.red, fontSize: SIZES.xs, marginTop: SIZES.space4 },
});

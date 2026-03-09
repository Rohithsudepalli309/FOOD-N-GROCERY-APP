import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { loginSuccess } from '../../store/slices/authSlice';

export default function SignupScreen({ navigation }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.phone || form.phone.length !== 10) e.phone = 'Enter valid 10-digit number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      dispatch(loginSuccess({
        user: { id: Date.now().toString(), name: form.name, phone: form.phone, email: form.email },
        token: 'token-' + Date.now(),
      }));
      setLoading(false);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StatusBar style="light" />
        <LinearGradient colors={['#0d001a', '#0F0F0F']} style={StyleSheet.absoluteFill} />

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join F&G for the best food & grocery experience</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={form.name}
            onChangeText={v => setForm(p => ({ ...p, name: v }))}
            placeholder="Your full name"
            icon="person-outline"
            error={errors.name}
            autoFocus
          />
          <Input
            label="Mobile Number"
            value={form.phone}
            onChangeText={v => setForm(p => ({ ...p, phone: v.replace(/\D/, '') }))}
            placeholder="10-digit number"
            keyboardType="phone-pad"
            maxLength={10}
            icon="call-outline"
            error={errors.phone}
          />
          <Input
            label="Email (Optional)"
            value={form.email}
            onChangeText={v => setForm(p => ({ ...p, email: v }))}
            placeholder="For receipts & offers"
            keyboardType="email-address"
            icon="mail-outline"
            error={errors.email}
          />

          <Button title="Create Account 🚀" onPress={handleSignup} loading={loading} style={{ marginTop: SIZES.space8 }} />

          <View style={styles.terms}>
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={{ color: COLORS.brand }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: COLORS.brand }}>Privacy Policy</Text>
            </Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)} style={styles.loginBtn}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={{ color: COLORS.brand, fontWeight: '700' }}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  content: { flexGrow: 1, padding: SIZES.space24 },
  backBtn: { marginTop: SIZES.space40, marginBottom: SIZES.space16 },
  header: { marginBottom: SIZES.space32 },
  title: { color: COLORS.text, fontSize: SIZES.xxxl, fontWeight: '900' },
  subtitle: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: SIZES.space8, lineHeight: 20 },
  form: {},
  terms: { marginTop: SIZES.space16, alignItems: 'center' },
  termsText: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 18 },
  loginBtn: { alignItems: 'center', paddingVertical: SIZES.space16 },
  loginText: { color: COLORS.textMuted, fontSize: SIZES.sm },
});

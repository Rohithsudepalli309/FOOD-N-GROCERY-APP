import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { sendOtp, verifyOtp, setError, setOtpSent } from '../../store/slices/authSlice';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading, otpSent, phone, error } = useSelector(s => s.auth);
  const [phoneInput, setPhoneInput] = useState('');
  const [otp, setOtp] = useState('');
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleSendOtp = () => {
    if (phoneInput.length !== 10) {
      dispatch(setError('Please enter a valid 10-digit mobile number'));
      return;
    }
    dispatch(sendOtp(phoneInput)).unwrap()
      .then(() => {
        Animated.timing(slideAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      })
      .catch((err) => console.log('OTP Send Error:', err));
  };

  const handleOtpChange = (val, idx) => {
    const digits = [...otpDigits];
    digits[idx] = val;
    setOtpDigits(digits);
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
    if (!val && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const handleVerify = () => {
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) { dispatch(setError('Please enter the 6-digit OTP')); return; }
    
    dispatch(verifyOtp({ phone: phoneInput, otp: enteredOtp })).unwrap()
      .then((data) => {
        if (data.isNewUser) {
          // If new user, you could route them to a Profile setup screen first
          // For now the system logs them in smoothly
        }
      })
      .catch((err) => console.log('OTP Verify Error:', err));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StatusBar style="light" />
        <LinearGradient colors={['#1a0a00', '#0F0F0F']} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} style={styles.logo}>
            <Text style={styles.logoText}>F&G</Text>
          </LinearGradient>
          <Text style={styles.title}>
            {otpSent ? 'Verify OTP' : 'Login to F&G'}
          </Text>
          <Text style={styles.subtitle}>
            {otpSent
              ? `Enter the 6-digit code sent to +91 ${phone}`
              : 'Enter your mobile number to get started'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {!otpSent ? (
            <>
              <Input
                label="Mobile Number"
                value={phoneInput}
                onChangeText={(t) => { setPhoneInput(t.replace(/\D/g, '')); dispatch(setError(null)); }}
                placeholder="Enter 10-digit number"
                keyboardType="phone-pad"
                maxLength={10}
                icon="call-outline"
                error={error}
                autoFocus
              />
              <Button title="Send OTP" onPress={handleSendOtp} loading={isLoading} />
            </>
          ) : (
            <>
              {/* OTP Boxes */}
              <Text style={styles.otpLabel}>Enter OTP</Text>
              <View style={styles.otpRow}>
                {otpDigits.map((d, i) => (
                  <Input
                    key={i}
                    ref={otpRefs[i]}
                    value={d}
                    onChangeText={(v) => handleOtpChange(v.replace(/\D/, ''), i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={styles.otpBox}
                    inputStyle={{ textAlign: 'center', fontSize: SIZES.xl, fontWeight: '800' }}
                    autoFocus={i === 0}
                  />
                ))}
              </View>
              {error && <Text style={styles.error}>{error}</Text>}
              <Button title="Verify & Login" onPress={handleVerify} loading={isLoading} style={{ marginTop: SIZES.space8 }} />
              <TouchableOpacity onPress={() => dispatch(setOtpSent({ sent: false, phone: '' }))} style={styles.changeBtn}>
                <Text style={styles.changeText}>Change number</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>OR</Text>
            <View style={styles.divLine} />
          </View>

          <TouchableOpacity style={styles.signupBtn} onPress={() => navigation.navigate(ROUTES.SIGNUP)}>
            <Text style={styles.signupText}>
              New to F&G? <Text style={{ color: COLORS.brand, fontWeight: '700' }}>Create Account</Text>
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
  header: { alignItems: 'center', marginTop: SIZES.space40, marginBottom: SIZES.space32 },
  logo: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.space16 },
  logoText: { color: COLORS.white, fontSize: SIZES.xl, fontWeight: '900' },
  title: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: COLORS.textMuted, fontSize: SIZES.sm, textAlign: 'center', marginTop: SIZES.space8, lineHeight: 20, paddingHorizontal: SIZES.space20 },
  form: { flex: 1 },
  otpLabel: { color: COLORS.textMuted, fontSize: SIZES.sm, fontWeight: '600', marginBottom: SIZES.space12 },
  otpRow: { flexDirection: 'row', gap: SIZES.space8, marginBottom: SIZES.space16 },
  otpBox: { flex: 1, marginBottom: 0 },
  error: { color: COLORS.red, fontSize: SIZES.xs, marginBottom: SIZES.space12 },
  changeBtn: { alignItems: 'center', paddingVertical: SIZES.space12 },
  changeText: { color: COLORS.accent, fontSize: SIZES.sm, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space12, marginVertical: SIZES.space24 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.darkBorder },
  divText: { color: COLORS.textMuted, fontSize: SIZES.xs },
  signupBtn: { alignItems: 'center', paddingVertical: SIZES.space8 },
  signupText: { color: COLORS.textMuted, fontSize: SIZES.sm },
});

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useDispatch } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { loginSuccess } from '../../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

const ONBOARDING = [
  {
    emoji: '🍕',
    title: 'Food at Your\nDoorstep',
    subtitle: 'Order from 500+ restaurants near you. Fresh, hot and delivered fast.',
    color: COLORS.brand,
  },
  {
    emoji: '🛒',
    title: 'Groceries in\n10 Minutes',
    subtitle: 'Shop from thousands of products and get them delivered instantly.',
    color: '#FF9F43',
  },
  {
    emoji: '📍',
    title: 'Live Tracking,\nAlways',
    subtitle: 'Watch your order in real-time. Know exactly when it arrives.',
    color: COLORS.accent,
  },
];

export default function SplashScreen({ navigation }) {
  const dispatch = useDispatch();
  const [page, setPage] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [page]);

  const handleGetStarted = () => navigation.replace(ROUTES.LOGIN);

  // Demo auto-login (remove in production)
  const handleDemoLogin = () => {
    dispatch(loginSuccess({
      user: { id: '1', name: 'Demo User', phone: '9999999999', email: 'demo@fg.app' },
      token: 'demo-token',
    }));
  };

  const current = ONBOARDING[page];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0F0F0F', '#1a0a00', '#0F0F0F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
        <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} style={styles.logo}>
          <Text style={styles.logoText}>F&G</Text>
        </LinearGradient>
        <Text style={styles.appName}>Food & Groceries</Text>
        <Text style={styles.tagline}>Fast · Fresh · Reliable</Text>
      </Animated.View>

      {/* Onboarding Card */}
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>
      </Animated.View>

      {/* Dots */}
      <View style={styles.dots}>
        {ONBOARDING.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setPage(i)}>
            <View style={[styles.dot, i === page && { width: 24, backgroundColor: COLORS.brand }]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        {page < ONBOARDING.length - 1 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={() => setPage(p => p + 1)}>
            <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} style={styles.nextGrad}>
              <Text style={styles.nextText}>Next →</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.nextBtn} onPress={handleGetStarted}>
              <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} style={styles.nextGrad}>
                <Text style={styles.nextText}>Get Started 🚀</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDemoLogin} style={styles.demoBtn}>
              <Text style={styles.demoText}>Try Demo (Skip Login)</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity onPress={() => setPage(ONBOARDING.length - 1)} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark, alignItems: 'center' },
  logoWrap: { alignItems: 'center', marginTop: height * 0.1, marginBottom: SIZES.space32 },
  logo: {
    width: 80, height: 80, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.brand, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  logoText: { color: COLORS.white, fontSize: SIZES.xxl, fontWeight: '900' },
  appName: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800', marginTop: SIZES.space12 },
  tagline: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 4 },
  card: {
    backgroundColor: COLORS.darkCard,
    borderRadius: SIZES.radius24,
    borderWidth: 1, borderColor: COLORS.darkBorder,
    padding: SIZES.space28,
    width: width - 48,
    alignItems: 'center',
    marginHorizontal: SIZES.space24,
  },
  emoji: { fontSize: 64, marginBottom: SIZES.space16 },
  title: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '900', textAlign: 'center', lineHeight: 34, marginBottom: SIZES.space12 },
  subtitle: { color: COLORS.textMuted, fontSize: SIZES.sm, textAlign: 'center', lineHeight: 20 },
  dots: { flexDirection: 'row', gap: 8, marginTop: SIZES.space24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.darkBorder2 },
  ctas: { position: 'absolute', bottom: 48, width: width - 48, alignItems: 'center', gap: SIZES.space12 },
  nextBtn: { width: '100%', borderRadius: SIZES.radius12, overflow: 'hidden' },
  nextGrad: { height: SIZES.buttonHeight, alignItems: 'center', justifyContent: 'center' },
  nextText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '800' },
  demoBtn: { paddingVertical: SIZES.space8 },
  demoText: { color: COLORS.accent, fontSize: SIZES.sm, fontWeight: '600' },
  skipBtn: { paddingVertical: SIZES.space8 },
  skipText: { color: COLORS.textMuted, fontSize: SIZES.sm },
});

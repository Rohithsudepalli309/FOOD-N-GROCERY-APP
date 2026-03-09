import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { selectNotification, clearNotification } from '../../store/slices/uiSlice';
import { ROUTES } from '../../constants/routes';

const { width } = Dimensions.get('window');

const TYPE_CONFIG = {
  order_status:    { icon: 'bicycle', iconColor: COLORS.brand },
  new_order:       { icon: 'receipt', iconColor: COLORS.green },
  rating_prompt:   { icon: 'star', iconColor: COLORS.yellow },
  promo:           { icon: 'pricetag', iconColor: COLORS.purple },
  grocery_restock: { icon: 'bag-check', iconColor: COLORS.green },
};

export default function NotificationBanner({ navigation }) {
  const dispatch = useDispatch();
  const notification = useSelector(selectNotification);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const dismissTimer = useRef(null);

  const dismiss = useCallback(() => {
    Animated.spring(slideAnim, { toValue: -120, useNativeDriver: true }).start(() => {
      dispatch(clearNotification());
    });
  }, [slideAnim, dispatch]);

  useEffect(() => {
    if (!notification) return;

    // Slide in
    Animated.spring(slideAnim, {
      toValue: 0, tension: 80, friction: 10, useNativeDriver: true,
    }).start();

    // Auto-dismiss after 4s
    clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(dismiss, 4000);

    return () => clearTimeout(dismissTimer.current);
  }, [notification?.id]);

  if (!notification) return null;

  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.order_status;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity
        style={styles.inner}
        activeOpacity={0.92}
        onPress={() => {
          dismiss();
          if (notification.orderId && navigation) {
            navigation.navigate(ROUTES.ORDER_STATUS, { orderId: notification.orderId });
          }
        }}
      >
        <View style={[styles.iconWrap, { backgroundColor: config.iconColor + '22' }]}>
          <Ionicons name={config.icon} size={22} color={config.iconColor} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>{notification.title ?? 'F&G Update'}</Text>
          <Text style={styles.body} numberOfLines={2}>{notification.body ?? ''}</Text>
        </View>
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Progress bar */}
      <ProgressBar duration={4000} color={config.iconColor} />
    </Animated.View>
  );
}

function ProgressBar({ duration, color }) {
  const widthAnim = useRef(new Animated.Value(width - 32)).current;
  useEffect(() => {
    widthAnim.setValue(width - 32);
    Animated.timing(widthAnim, { toValue: 0, duration, useNativeDriver: false }).start();
  }, []);
  return <Animated.View style={[styles.progress, { width: widthAnim, backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 44, left: 16, right: 16, zIndex: 9999,
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius16,
    borderWidth: 1, borderColor: COLORS.darkBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 20,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space12,
    padding: SIZES.space14 ?? 14,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  title: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '800', marginBottom: 2 },
  body: { color: COLORS.textMuted, fontSize: SIZES.xs, lineHeight: 16 },
  closeBtn: { padding: SIZES.space4 },
  progress: { height: 2, borderRadius: 1 },
});

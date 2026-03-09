import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { logout } from '../../store/slices/authSlice';

const MENU_ITEMS = [
  { icon: 'receipt-outline', label: 'My Orders', route: ROUTES.ORDER_HISTORY, color: COLORS.accent },
  { icon: 'location-outline', label: 'Saved Addresses', route: ROUTES.ADDRESS, color: COLORS.brand },
  { icon: 'wallet-outline', label: 'FG Pay Wallet', route: ROUTES.WALLET, color: COLORS.green },
  { icon: 'gift-outline', label: 'Offers & Coupons', route: null, color: COLORS.yellow },
  { icon: 'help-circle-outline', label: 'Help & Support', route: null, color: COLORS.purple },
  { icon: 'information-circle-outline', label: 'About F&G', route: null, color: COLORS.textMuted },
];

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const [notifEnabled, setNotifEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#1a0a00', '#0F0F0F']} style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0] ?? 'U'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name ?? 'Guest User'}</Text>
              <Text style={styles.userPhone}>+91 {user?.phone ?? '9999999999'}</Text>
              {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={16} color={COLORS.brand} />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'Orders', val: '24', icon: '🛵' },
              { label: 'Reviews', val: '12', icon: '⭐' },
              { label: 'FG Credits', val: '₹240', icon: '💰' },
            ].map(s => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statEmoji}>{s.icon}</Text>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i === 0 && styles.menuItemFirst]}
              onPress={() => item.route && navigation.navigate(item.route)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications toggle */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleRow}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.brand + '20' }]}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.brand} />
            </View>
            <Text style={styles.menuLabel}>Push Notifications</Text>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: COLORS.darkBorder2, true: COLORS.brand + '80' }}
              thumbColor={notifEnabled ? COLORS.brand : COLORS.textMuted}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>F&G v1.0.0 · Made with ❤️ in India</Text>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: { padding: SIZES.space16, paddingTop: 52, paddingBottom: SIZES.space24 },
  title: { color: COLORS.text, fontSize: SIZES.xxl, fontWeight: '900', marginBottom: SIZES.space16 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space14 ?? 14,
    backgroundColor: COLORS.darkCard + '80', borderRadius: SIZES.radius16,
    borderWidth: 1, borderColor: COLORS.darkBorder, padding: SIZES.space16, marginBottom: SIZES.space16,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  avatarText: { color: COLORS.white, fontSize: SIZES.xl, fontWeight: '900' },
  userInfo: { flex: 1 },
  userName: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: '800' },
  userPhone: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  userEmail: { color: COLORS.textMuted, fontSize: SIZES.xs },
  editBtn: { padding: SIZES.space8 },
  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.darkCard + '80',
    borderRadius: SIZES.radius12, borderWidth: 1, borderColor: COLORS.darkBorder, padding: SIZES.space12,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 20 },
  statVal: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: 10 },
  menuSection: {
    backgroundColor: COLORS.darkCard, marginHorizontal: SIZES.space16,
    borderRadius: SIZES.radius16, borderWidth: 1, borderColor: COLORS.darkBorder,
    marginTop: SIZES.space16, overflow: 'hidden',
  },
  menuItemFirst: { borderTopWidth: 0 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space12,
    padding: SIZES.space16, borderTopWidth: 1, borderTopColor: COLORS.darkBorder,
  },
  menuIcon: { width: 36, height: 36, borderRadius: SIZES.radius8, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, color: COLORS.text, fontSize: SIZES.sm, fontWeight: '600' },
  toggleSection: {
    backgroundColor: COLORS.darkCard, marginHorizontal: SIZES.space16,
    borderRadius: SIZES.radius16, borderWidth: 1, borderColor: COLORS.darkBorder,
    marginTop: SIZES.space10,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space12, padding: SIZES.space16 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space10,
    marginHorizontal: SIZES.space16, marginTop: SIZES.space16,
    backgroundColor: COLORS.red + '10', borderRadius: SIZES.radius12,
    borderWidth: 1, borderColor: COLORS.red + '33', padding: SIZES.space14 ?? 14,
    justifyContent: 'center',
  },
  logoutText: { color: COLORS.red, fontSize: SIZES.md, fontWeight: '700' },
  version: { color: COLORS.textDim, fontSize: 10, textAlign: 'center', marginTop: SIZES.space20 },
});

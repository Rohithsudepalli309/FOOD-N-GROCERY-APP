import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const TRANSACTIONS = [
  { id: 't1', desc: 'Cashback — Barbeque Nation', amount: +45, type: 'credit', date: '7 Mar 2026' },
  { id: 't2', desc: 'Payment — Pizza Hut', amount: -448, type: 'debit', date: '5 Mar 2026' },
  { id: 't3', desc: 'Added to Wallet', amount: +500, type: 'credit', date: '1 Mar 2026' },
  { id: 't4', desc: 'Refund — Cancelled Order', amount: +239, type: 'credit', date: '2 Mar 2026' },
  { id: 't5', desc: 'Payment — Grocery Store', amount: -358, type: 'debit', date: '28 Feb 2026' },
];

const ADD_OPTIONS = [100, 200, 500, 1000];

export default function WalletScreen({ navigation }) {
  const balance = 240;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>FG Pay Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <LinearGradient colors={[COLORS.green, '#1a7a42']} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balance}>₹{balance}</Text>
          <Text style={styles.balanceSub}>Use at checkout · Cashback eligible</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.balanceBtn}>
              <Ionicons name="add" size={18} color={COLORS.white} />
              <Text style={styles.balanceBtnText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.balanceBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Ionicons name="arrow-up" size={18} color={COLORS.white} />
              <Text style={styles.balanceBtnText}>Transfer</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Add */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickAddRow}>
            {ADD_OPTIONS.map(amt => (
              <TouchableOpacity key={amt} style={styles.quickAddBtn}>
                <Text style={styles.quickAddText}>+₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cashback Info */}
        <View style={styles.cashbackCard}>
          <Ionicons name="gift-outline" size={20} color={COLORS.yellow} />
          <View style={styles.cashbackInfo}>
            <Text style={styles.cashbackTitle}>Earn Cashback on Every Order</Text>
            <Text style={styles.cashbackSub}>Up to 5% cashback on all FG Pay payments</Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {TRANSACTIONS.map(txn => (
            <View key={txn.id} style={styles.txnRow}>
              <View style={[styles.txnIcon, { backgroundColor: txn.type === 'credit' ? COLORS.green + '20' : COLORS.red + '20' }]}>
                <Ionicons
                  name={txn.type === 'credit' ? 'arrow-down-outline' : 'arrow-up-outline'}
                  size={18}
                  color={txn.type === 'credit' ? COLORS.green : COLORS.red}
                />
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnDesc}>{txn.desc}</Text>
                <Text style={styles.txnDate}>{txn.date}</Text>
              </View>
              <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? COLORS.green : COLORS.red }]}>
                {txn.type === 'credit' ? '+' : ''}₹{Math.abs(txn.amount)}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    paddingTop: 52, paddingBottom: SIZES.space12, paddingHorizontal: SIZES.space16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder,
  },
  title: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: '800' },
  balanceCard: {
    margin: SIZES.space16, borderRadius: SIZES.radius20,
    padding: SIZES.space24, alignItems: 'center',
    shadowColor: COLORS.green, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.sm, fontWeight: '600' },
  balance: { color: COLORS.white, fontSize: 48, fontWeight: '900', marginVertical: SIZES.space8 },
  balanceSub: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.xs, marginBottom: SIZES.space20 },
  balanceActions: { flexDirection: 'row', gap: SIZES.space12 },
  balanceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space6,
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.space16, paddingVertical: SIZES.space10,
  },
  balanceBtnText: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '700' },
  section: { paddingHorizontal: SIZES.space16, marginBottom: SIZES.space20 },
  sectionTitle: { color: COLORS.text, fontSize: SIZES.md, fontWeight: '700', marginBottom: SIZES.space12 },
  quickAddRow: { flexDirection: 'row', gap: SIZES.space10 },
  quickAddBtn: {
    flex: 1, backgroundColor: COLORS.darkCard,
    borderWidth: 1, borderColor: COLORS.green + '44',
    borderRadius: SIZES.radius10, paddingVertical: SIZES.space12, alignItems: 'center',
  },
  quickAddText: { color: COLORS.green, fontSize: SIZES.sm, fontWeight: '800' },
  cashbackCard: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space12,
    backgroundColor: COLORS.yellow + '10', borderRadius: SIZES.radius12,
    borderWidth: 1, borderColor: COLORS.yellow + '33',
    marginHorizontal: SIZES.space16, padding: SIZES.space14 ?? 14, marginBottom: SIZES.space20,
  },
  cashbackInfo: { flex: 1 },
  cashbackTitle: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '700' },
  cashbackSub: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  txnRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space12,
    paddingVertical: SIZES.space12, borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder,
  },
  txnIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1 },
  txnDesc: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '600' },
  txnDate: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  txnAmount: { fontSize: SIZES.md, fontWeight: '800' },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const ADDRESSES_DATA = [
  { id: 'a1', label: 'Home', address: 'B-12, Sector 62, Noida, UP 201309', icon: 'home', isDefault: true },
  { id: 'a2', label: 'Work', address: 'Tower A, DLF Cyber City, Gurugram, Haryana 122002', icon: 'business', isDefault: false },
  { id: 'a3', label: 'Parents', address: '15, Shanti Nagar, Jaipur, Rajasthan 302001', icon: 'heart', isDefault: false },
];

export default function AddressScreen({ navigation }) {
  const [addresses, setAddresses] = useState(ADDRESSES_DATA);

  const handleDelete = (id) => {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setAddresses(a => a.filter(x => x.id !== id)) },
    ]);
  };

  const handleSetDefault = (id) => setAddresses(a => a.map(x => ({ ...x, isDefault: x.id === id })));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Addresses</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={addresses}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity style={styles.addNewBtn}>
            <Ionicons name="add-circle" size={22} color={COLORS.brand} />
            <Text style={styles.addNewText}>Add New Address</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.isDefault && styles.cardDefault]}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconWrap, { backgroundColor: item.isDefault ? COLORS.brand + '20' : COLORS.darkCard2 }]}>
                <Ionicons name={item.icon + '-outline'} size={20} color={item.isDefault ? COLORS.brand : COLORS.textMuted} />
              </View>
              <View style={styles.addrInfo}>
                <View style={styles.labelRow}>
                  <Text style={styles.addrLabel}>{item.label}</Text>
                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addrText} numberOfLines={2}>{item.address}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              {!item.isDefault && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(item.id)}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.green} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="pencil-outline" size={18} color={COLORS.accent} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
  list: { padding: SIZES.space16, gap: SIZES.space10 },
  addNewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space10,
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius12,
    borderWidth: 1.5, borderColor: COLORS.brand + '44', borderStyle: 'dashed',
    padding: SIZES.space16, marginBottom: SIZES.space4,
  },
  addNewText: { color: COLORS.brand, fontSize: SIZES.sm, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.darkCard, borderRadius: SIZES.radius12,
    borderWidth: 1, borderColor: COLORS.darkBorder, padding: SIZES.space14 ?? 14,
    flexDirection: 'row', alignItems: 'center', gap: SIZES.space12,
  },
  cardDefault: { borderColor: COLORS.brand + '44', backgroundColor: COLORS.brand + '06' },
  cardLeft: { flex: 1, flexDirection: 'row', gap: SIZES.space12, alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: SIZES.radius10, alignItems: 'center', justifyContent: 'center' },
  addrInfo: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.space8, marginBottom: 4 },
  addrLabel: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: '700' },
  defaultBadge: {
    backgroundColor: COLORS.brand + '22', borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.space6, paddingVertical: 2,
  },
  defaultText: { color: COLORS.brand, fontSize: 8, fontWeight: '900' },
  addrText: { color: COLORS.textMuted, fontSize: SIZES.xs, lineHeight: 16 },
  actions: { flexDirection: 'row', gap: SIZES.space4 },
  actionBtn: { padding: SIZES.space6 },
});

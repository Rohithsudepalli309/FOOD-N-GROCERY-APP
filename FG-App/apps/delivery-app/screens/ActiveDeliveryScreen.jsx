import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const C = { dark: '#0F0F0F', card: '#1a1a1a', brand: '#FF5722', green: '#22c55e', red: '#ef4444', yellow: '#f59e0b', muted: '#888', border: '#2a2a2a', text: '#f0f0f0' };

const STEPS = [
  { key: 'assigned', label: 'Order Assigned', icon: '📱', desc: 'Head to restaurant' },
  { key: 'picked_up', label: 'Picked Up', icon: '📦', desc: 'Order in hand — navigate to customer' },
  { key: 'on_the_way', label: 'On the Way', icon: '🛵', desc: 'En route to customer' },
  { key: 'delivered', label: 'Delivered', icon: '🎉', desc: 'Order complete!' },
];

export default function ActiveDeliveryScreen({ route, navigation, socket, riderId }) {
  const order = route?.params?.order || { orderId: 'FG9934', restaurantId: 'r1', total: 349, otp: '7382' };
  const [currentStep, setCurrentStep] = useState(0);
  const [showOTP, setShowOTP] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  const openMaps = (destination) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    Linking.openURL(url);
  };

  const markPickedUp = () => {
    socket?.emit('order_picked_up', { riderId, orderId: order.orderId });
    setCurrentStep(2);
  };

  const markDelivered = () => {
    if (otpInput !== order.otp) {
      Alert.alert('Wrong OTP', 'Please enter the correct 4-digit OTP from the customer.');
      return;
    }
    socket?.emit('order_delivered', { riderId, orderId: order.orderId, otp: otpInput });
    setCurrentStep(3);
    setTimeout(() => navigation.goBack(), 2000);
  };

  const stepDone = currentStep >= 3;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1a0500', '#0F0F0F']} style={styles.header}>
        <Text style={styles.headerTitle}>Active Delivery</Text>
        <Text style={styles.headerOrder}>#{order.orderId}</Text>
        <Text style={[styles.headerEarning, { color: C.green }]}>₹52 on completion</Text>
      </LinearGradient>

      {/* Step progress */}
      <View style={styles.stepsCard}>
        <Text style={styles.cardTitle}>Delivery Steps</Text>
        {STEPS.map((step, i) => (
          <View key={step.key} style={styles.stepRow}>
            <View style={[styles.stepCircle, { backgroundColor: i <= currentStep ? C.brand : '#222', borderColor: i === currentStep ? C.brand : '#333' }]}>
              <Text style={{ fontSize: i <= currentStep ? 12 : 14 }}>{i <= currentStep ? '✓' : step.icon}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: i < currentStep ? C.brand : '#222' }]} />}
            <View style={{ flex: 1, paddingLeft: 12 }}>
              <Text style={[styles.stepLabel, { color: i <= currentStep ? C.text : C.muted }]}>{step.label}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Address cards */}
      <View style={styles.addrCard}>
        <View style={styles.addrRow}>
          <View style={[styles.addrDot, { backgroundColor: '#FF5722' }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addrLabel}>Pickup</Text>
            <Text style={styles.addrText}>Barbeque Nation, Sector 62, Noida</Text>
          </View>
          <TouchableOpacity onPress={() => openMaps('Sector+62+Noida')} style={styles.navBtn}>
            <Ionicons name="navigate" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.addrDivider} />
        <View style={styles.addrRow}>
          <View style={[styles.addrDot, { backgroundColor: C.green }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addrLabel}>Dropoff</Text>
            <Text style={styles.addrText}>Tower 7, Mahagun Mywoods, Noida</Text>
          </View>
          <TouchableOpacity onPress={() => openMaps('Mahagun+Mywoods+Noida')} style={[styles.navBtn, { backgroundColor: C.green }]}>
            <Ionicons name="navigate" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer contact */}
      <View style={styles.contactCard}>
        <Ionicons name="person-circle-outline" size={36} color={C.muted} />
        <View style={{ flex: 1 }}>
          <Text style={styles.contactName}>Rohit Kumar</Text>
          <Text style={styles.contactPhone}>+91 98765 43210</Text>
        </View>
        <TouchableOpacity onPress={() => Linking.openURL('tel:9876543210')} style={styles.callBtn}>
          <Ionicons name="call" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      {!stepDone && (
        <View style={styles.actions}>
          {currentStep === 0 && (
            <TouchableOpacity style={styles.primaryAction} onPress={() => setCurrentStep(1)}>
              <LinearGradient colors={[C.brand, '#c0392b']} style={styles.primaryGrad}>
                <Text style={styles.primaryTxt}>📦 I've Reached the Restaurant</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {currentStep === 1 && (
            <TouchableOpacity style={styles.primaryAction} onPress={markPickedUp}>
              <LinearGradient colors={[C.brand, '#c0392b']} style={styles.primaryGrad}>
                <Text style={styles.primaryTxt}>✅ Mark Order Picked Up</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {currentStep === 2 && !showOTP && (
            <TouchableOpacity style={styles.primaryAction} onPress={() => setShowOTP(true)}>
              <LinearGradient colors={[C.green, '#1a7a42']} style={styles.primaryGrad}>
                <Text style={styles.primaryTxt}>🎉 Mark as Delivered</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {currentStep === 2 && showOTP && (
            <View style={styles.otpBlock}>
              <Text style={styles.otpTitle}>🔑 Enter Customer OTP</Text>
              <Text style={styles.otpHint}>Ask customer for the 4-digit OTP</Text>
              <View style={styles.otpRow}>
                {[0,1,2,3].map(i => (
                  <View key={i} style={styles.otpBox}>
                    <Text style={styles.otpDigit}>{otpInput[i] || '—'}</Text>
                  </View>
                ))}
              </View>
              {/* Number pad */}
              <View style={styles.numpad}>
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                  <TouchableOpacity key={i} style={styles.numKey}
                    onPress={() => {
                      if (k === '⌫') setOtpInput(o => o.slice(0, -1));
                      else if (k !== '' && otpInput.length < 4) setOtpInput(o => o + k);
                    }}>
                    <Text style={styles.numTxt}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.primaryAction} onPress={markDelivered}>
                <LinearGradient colors={[C.green, '#1a7a42']} style={styles.primaryGrad}>
                  <Text style={styles.primaryTxt}>Confirm Delivery</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {stepDone && (
        <View style={styles.doneCard}>
          <Text style={styles.doneTxt}>🎉 Delivered Successfully!</Text>
          <Text style={[styles.doneEarn, { color: C.green }]}>+₹52 credited</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },
  header: { padding: 24, paddingTop: 52, gap: 4 },
  headerTitle: { color: '#aaa', fontSize: 12, fontWeight: '700' },
  headerOrder: { color: C.text, fontSize: 22, fontWeight: '900' },
  headerEarning: { fontSize: 14, fontWeight: '700' },
  stepsCard: { margin: 16, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTitle: { color: C.text, fontSize: 14, fontWeight: '800', marginBottom: 16 },
  stepRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepLine: { position: 'absolute', left: 15, top: 32, width: 2, height: 32 },
  stepLabel: { fontSize: 13, fontWeight: '700' },
  stepDesc: { color: C.muted, fontSize: 11, marginTop: 2 },
  addrCard: { margin: 16, marginTop: 0, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, gap: 12 },
  addrRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addrDot: { width: 10, height: 10, borderRadius: 5 },
  addrLabel: { fontSize: 10, color: C.muted, fontWeight: '700' },
  addrText: { fontSize: 12, color: C.text, marginTop: 2 },
  addrDivider: { height: 1, backgroundColor: C.border, marginLeft: 20 },
  navBtn: { width: 34, height: 34, backgroundColor: C.brand, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  contactCard: { margin: 16, marginTop: 0, backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactName: { color: C.text, fontSize: 14, fontWeight: '700' },
  contactPhone: { color: C.muted, fontSize: 11, marginTop: 2 },
  callBtn: { width: 38, height: 38, backgroundColor: C.green, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  actions: { padding: 16, gap: 12 },
  primaryAction: { borderRadius: 14, overflow: 'hidden' },
  primaryGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
  primaryTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
  otpBlock: { backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, gap: 10 },
  otpTitle: { color: C.text, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  otpHint: { color: C.muted, fontSize: 12, textAlign: 'center' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 8 },
  otpBox: { width: 52, height: 56, backgroundColor: '#222', borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  otpDigit: { color: C.brand, fontSize: 24, fontWeight: '900' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  numKey: { width: 68, height: 44, backgroundColor: '#222', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numTxt: { color: C.text, fontSize: 18, fontWeight: '700' },
  doneCard: { margin: 16, backgroundColor: C.green + '22', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: C.green, alignItems: 'center', gap: 8 },
  doneTxt: { color: C.text, fontSize: 18, fontWeight: '900' },
  doneEarn: { fontSize: 22, fontWeight: '900' },
});

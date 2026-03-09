import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { ROUTES } from '../constants/routes';

import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import BottomTabNavigator from './BottomTabNavigator';
import OrderStatusScreen from '../screens/tracking/OrderStatusScreen';
import LiveTrackingScreen from '../screens/tracking/LiveTrackingScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import OrderSummaryScreen from '../screens/cart/OrderSummaryScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} />
          <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
          <Stack.Screen name={ROUTES.SIGNUP} component={SignupScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name={ROUTES.MAIN} component={BottomTabNavigator} />
          <Stack.Screen name={ROUTES.CHECKOUT} component={CheckoutScreen} />
          <Stack.Screen name={ROUTES.ORDER_SUMMARY} component={OrderSummaryScreen} />
          <Stack.Screen name={ROUTES.ORDER_STATUS} component={OrderStatusScreen} />
          <Stack.Screen name={ROUTES.LIVE_TRACKING} component={LiveTrackingScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

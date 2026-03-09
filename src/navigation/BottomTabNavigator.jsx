import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS, SIZES } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { selectCartCount } from '../store/slices/cartSlice';

import FoodStackNavigator from './FoodStackNavigator';
import SearchScreen from '../screens/home/SearchScreen';
import CartScreen from '../screens/cart/CartScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

function CartTabIcon({ color, focused }) {
  const count = useSelector(selectCartCount);
  return (
    <View>
      <Ionicons name={focused ? 'bag' : 'bag-outline'} size={24} color={color} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.brand,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name={ROUTES.HOME}
        component={FoodStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) =>
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.SEARCH}
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, focused }) =>
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.CART}
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: (props) => <CartTabIcon {...props} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE}
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) =>
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#111111',
    borderTopColor: COLORS.darkBorder,
    borderTopWidth: 1,
    height: SIZES.tabBarHeight,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.brand,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
});

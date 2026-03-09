import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../constants/routes';

import HomeScreen from '../screens/home/HomeScreen';
import CategoryScreen from '../screens/home/CategoryScreen';
import RestaurantListScreen from '../screens/restaurant/RestaurantListScreen';
import RestaurantDetailScreen from '../screens/restaurant/RestaurantDetailScreen';
import MenuItemScreen from '../screens/restaurant/MenuItemScreen';
import GroceryHomeScreen from '../screens/grocery/GroceryHomeScreen';
import GroceryStoreScreen from '../screens/grocery/GroceryStoreScreen';
import ProductDetailScreen from '../screens/grocery/ProductDetailScreen';
import OrderHistoryScreen from '../screens/profile/OrderHistoryScreen';
import AddressScreen from '../screens/profile/AddressScreen';
import WalletScreen from '../screens/profile/WalletScreen';

const Stack = createNativeStackNavigator();

export default function FoodStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.HOME} component={HomeScreen} />
      <Stack.Screen name={ROUTES.CATEGORY} component={CategoryScreen} />
      <Stack.Screen name={ROUTES.RESTAURANT_LIST} component={RestaurantListScreen} />
      <Stack.Screen name={ROUTES.RESTAURANT_DETAIL} component={RestaurantDetailScreen} />
      <Stack.Screen name={ROUTES.MENU_ITEM} component={MenuItemScreen} />
      <Stack.Screen name={ROUTES.GROCERY_HOME} component={GroceryHomeScreen} />
      <Stack.Screen name={ROUTES.GROCERY_STORE} component={GroceryStoreScreen} />
      <Stack.Screen name={ROUTES.PRODUCT_DETAIL} component={ProductDetailScreen} />
      <Stack.Screen name={ROUTES.ORDER_HISTORY} component={OrderHistoryScreen} />
      <Stack.Screen name={ROUTES.ADDRESS} component={AddressScreen} />
      <Stack.Screen name={ROUTES.WALLET} component={WalletScreen} />
    </Stack.Navigator>
  );
}

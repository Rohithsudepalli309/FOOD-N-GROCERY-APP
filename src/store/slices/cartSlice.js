import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],        // [{ id, name, price, image, quantity, restaurantId, restaurantName, customizations }]
  restaurantId: null,
  restaurantName: null,
  coupon: null,
  discount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const { item, restaurantId, restaurantName } = action.payload;
      // Clear cart if different restaurant
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        state.items = [];
        state.coupon = null;
        state.discount = 0;
      }
      state.restaurantId = restaurantId;
      state.restaurantName = restaurantName;
      const existing = state.items.find(i => i.id === item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
    },
    removeItem: (state, action) => {
      const existing = state.items.find(i => i.id === action.payload);
      if (existing) {
        if (existing.quantity > 1) {
          existing.quantity -= 1;
        } else {
          state.items = state.items.filter(i => i.id !== action.payload);
        }
      }
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
      }
    },
    deleteItem: (state, action) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = null;
      state.coupon = null;
      state.discount = 0;
    },
    applyCoupon: (state, action) => {
      state.coupon = action.payload.code;
      state.discount = action.payload.discount;
    },
    removeCoupon: (state) => {
      state.coupon = null;
      state.discount = 0;
    },
  },
});

export const { addItem, removeItem, deleteItem, clearCart, applyCoupon, removeCoupon } = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectItemInCart = (id) => (state) =>
  state.cart.items.find(i => i.id === id);

export default cartSlice.reducer;

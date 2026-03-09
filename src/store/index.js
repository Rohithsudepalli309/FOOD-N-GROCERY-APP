import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import locationReducer from './slices/locationSlice';
import orderReducer from './slices/orderSlice';
import restaurantReducer from './slices/restaurantSlice';
import uiReducer from './slices/uiSlice';
import socketMiddleware from './middleware/socketMiddleware';

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    location: locationReducer,
    order: orderReducer,
    restaurant: restaurantReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore socket instance in state (it's not serializable)
        ignoredActions: ['auth/loginSuccess'],
      },
    }).concat(socketMiddleware),
});

export { store };
export default store;

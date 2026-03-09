import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../constants/apiClient';

export const placeOrder = createAsyncThunk(
  'order/placeOrder',
  async (orderPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/orders', orderPayload);
      return response.data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to place order');
    }
  }
);

export const fetchOrderHistory = createAsyncThunk(
  'order/fetchHistory',
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/orders/customer/${customerId}`);
      return response.data.orders;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch history');
    }
  }
);

const ORDER_DISPLAY = {
  placed:        { label: 'Order Placed',         emoji: '✅', color: '#FF5722' },
  confirmed:     { label: 'Restaurant Confirmed', emoji: '🍳', color: '#1DA1F2' },
  preparing:     { label: 'Being Prepared',       emoji: '👨‍🍳', color: '#FFCA28' },
  ready:         { label: 'Ready for Pickup',     emoji: '📦', color: '#66BB6A' },
  rider_assigned:{ label: 'Rider Assigned',       emoji: '🛵', color: '#AB47BC' },
  picked_up:     { label: 'Picked Up',            emoji: '🏃', color: '#26A69A' },
  on_the_way:    { label: 'On the Way',           emoji: '🛵', color: '#FF7043' },
  nearby:        { label: 'Almost There!',         emoji: '📍', color: '#EC407A' },
  delivered:     { label: 'Delivered',            emoji: '🎉', color: '#66BB6A' },
  rejected:      { label: 'Order Rejected',       emoji: '❌', color: '#EF5350' },
  cancelled:     { label: 'Cancelled',            emoji: '🚫', color: '#78909C' },
};

const initialState = {
  activeOrder: null,       // current live order
  orderHistory: [],        // past orders
  riderLocation: null,     // { lat, lng, heading, eta }
  riderDetails: null,      // { id, name, rating, vehicle }
  statusTimeline: [],      // array of { status, timestamp }
  surgeData: {},           // restaurantId → { multiplier, lastUpdated }
  isSocketConnected: false,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setActiveOrder(state, action) {
      state.activeOrder = action.payload;
      state.statusTimeline = [{ status: action.payload.status ?? 'placed', timestamp: Date.now() }];
    },
    updateOrderStatus(state, action) {
      const { orderId, status, rider, prepTimeMinutes } = action.payload;
      if (state.activeOrder?.id === orderId || state.activeOrder?.orderId === orderId) {
        state.activeOrder = { ...state.activeOrder, status, updatedAt: Date.now() };
        state.statusTimeline.push({ status, timestamp: Date.now() });
        if (rider) state.riderDetails = rider;
      }
    },
    updateRiderLocation(state, action) {
      state.riderLocation = action.payload;
    },
    setSurgeData(state, action) {
      const { restaurantId, surge } = action.payload;
      state.surgeData[restaurantId] = { multiplier: surge, lastUpdated: Date.now() };
    },
    setSocketConnected(state, action) {
      state.isSocketConnected = action.payload;
    },
    clearActiveOrder(state) {
      state.activeOrder = null;
      state.riderLocation = null;
      state.riderDetails = null;
      state.statusTimeline = [];
    },
    addToHistory(state, action) {
      state.orderHistory.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(placeOrder.fulfilled, (state, action) => {
      // Set the live order returned from the PostgreSQL DB
      state.activeOrder = action.payload;
      state.statusTimeline = [{ status: action.payload.status || 'placed', timestamp: Date.now() }];
    });
    builder.addCase(fetchOrderHistory.fulfilled, (state, action) => {
      state.orderHistory = action.payload;
    });
  }
});

export const {
  setActiveOrder, updateOrderStatus, updateRiderLocation,
  setSurgeData, setSocketConnected, clearActiveOrder, addToHistory,
} = orderSlice.actions;

// Selectors
export const selectActiveOrder = s => s.order.activeOrder;
export const selectRiderLocation = s => s.order.riderLocation;
export const selectRiderDetails = s => s.order.riderDetails;
export const selectStatusTimeline = s => s.order.statusTimeline;
export const selectOrderHistory = s => s.order.orderHistory;
export const selectSurge = restaurantId => s => s.order.surgeData[restaurantId];
export const selectIsSocketConnected = s => s.order.isSocketConnected;
export const selectStatusDisplay = status => ORDER_DISPLAY[status] ?? { label: status, emoji: '⏳', color: '#78909C' };

export default orderSlice.reducer;

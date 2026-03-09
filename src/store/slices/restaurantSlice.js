import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../constants/apiClient';

export const fetchRestaurants = createAsyncThunk(
  'restaurant/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/restaurants');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch restaurants');
    }
  }
);

export const fetchRestaurantMenu = createAsyncThunk(
  'restaurant/fetchMenu',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/restaurants/${restaurantId}/menu`);
      return { id: restaurantId, menu: response.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch menu');
    }
  }
);

const initialState = {
  restaurants: [],
  menus: {}, // Map of restaurantId -> array of menu items
  isLoading: false,
  error: null,
};

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchRestaurants.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(fetchRestaurants.fulfilled, (state, action) => {
      state.isLoading = false;
      state.restaurants = action.payload;
    });
    builder.addCase(fetchRestaurants.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    builder.addCase(fetchRestaurantMenu.fulfilled, (state, action) => {
      state.menus[action.payload.id] = action.payload.menu;
    });
  }
});

export default restaurantSlice.reducer;

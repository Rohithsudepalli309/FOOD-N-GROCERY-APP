import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../constants/apiClient';
import { ENDPOINTS } from '../../constants/api';

const initialState = {
  user: null,
  token: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,
  phone: null,
  otpSent: false,
};

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (phone, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/otp/send', { phone });
      return { phone: response.data.phone, devOtp: response.data.dev_otp };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to send OTP');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/otp/verify', { phone, otp });
      return response.data; // { success, isNewUser, user, accessToken, refreshToken }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Invalid OTP');
    }
  }
);

export const updateProfileRecord = createAsyncThunk(
  'auth/updateProfile',
  async ({ name, email }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put('/auth/profile', { name, email });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Update failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      state.otpSent = false;
      state.phone = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Send OTP
    builder.addCase(sendOtp.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(sendOtp.fulfilled, (state, action) => {
      state.isLoading = false;
      state.otpSent = true;
      state.phone = action.payload.phone;
    });
    builder.addCase(sendOtp.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Verify OTP
    builder.addCase(verifyOtp.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(verifyOtp.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.accessToken; // Store JWT
      state.isLoggedIn = true;
      state.error = null;
    });
    builder.addCase(verifyOtp.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Profile Update
    builder.addCase(updateProfileRecord.fulfilled, (state, action) => {
      state.user = action.payload.user;
    });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

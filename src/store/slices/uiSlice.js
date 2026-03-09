import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notification: null,  // { type, title, body, data, id }
  isLoading: false,
  toastMessage: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showNotification(state, action) {
      state.notification = { ...action.payload, id: Date.now() };
    },
    clearNotification(state) {
      state.notification = null;
    },
    showToast(state, action) {
      state.toastMessage = action.payload;
    },
    clearToast(state) {
      state.toastMessage = null;
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
  },
});

export const { showNotification, clearNotification, showToast, clearToast, setLoading } = uiSlice.actions;
export const selectNotification = s => s.ui.notification;
export const selectToast = s => s.ui.toastMessage;
export const selectIsLoading = s => s.ui.isLoading;
export default uiSlice.reducer;

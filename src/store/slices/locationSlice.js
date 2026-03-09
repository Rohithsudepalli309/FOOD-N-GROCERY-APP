import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  coords: null,         // { latitude, longitude }
  address: null,       // Human-readable address string
  city: null,
  pincode: null,
  savedAddresses: [],
  selectedAddress: null,
  isLoading: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCoords: (state, action) => { state.coords = action.payload; },
    setAddress: (state, action) => {
      state.address = action.payload.address;
      state.city = action.payload.city;
      state.pincode = action.payload.pincode;
    },
    setSavedAddresses: (state, action) => { state.savedAddresses = action.payload; },
    selectAddress: (state, action) => { state.selectedAddress = action.payload; },
    setLoading: (state, action) => { state.isLoading = action.payload; },
  },
});

export const { setCoords, setAddress, setSavedAddresses, selectAddress, setLoading } = locationSlice.actions;
export default locationSlice.reducer;

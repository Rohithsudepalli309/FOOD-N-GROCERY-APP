import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';
import { API_BASE_URL } from './api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s (Token Expiry)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      // In a full prod app, attempt refresh token here
      // For now, auto-logout on unauthorized
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default apiClient;

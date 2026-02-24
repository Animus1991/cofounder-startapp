import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get backend URL from environment
const getBaseUrl = () => {
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
    'http://localhost:8001';
  
  // Ensure we have /api suffix
  return backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token on 401
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../types';
import api from '../utils/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string, role: string) => Promise<User>;
  exchangeSession: (sessionId: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  needsOnboarding: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),

  login: async (email, password) => {
    console.log('[AuthStore] Attempting login for:', email);
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { access_token, user } = response.data;
    console.log('[AuthStore] Login successful, saving token...');
    
    try {
      await AsyncStorage.setItem('token', access_token);
      console.log('[AuthStore] Token saved to AsyncStorage');
    } catch (e) {
      console.error('[AuthStore] Failed to save token:', e);
    }
    
    set({ 
      user, 
      token: access_token, 
      isAuthenticated: true, 
      needsOnboarding: false,
      isLoading: false 
    });
    console.log('[AuthStore] State updated, isAuthenticated:', true);
    return user;
  },

  register: async (email, password, name, role) => {
    console.log('[AuthStore] Attempting registration for:', email);
    const response = await api.post<AuthResponse>('/auth/register', { email, password, name, role });
    const { access_token, user } = response.data;
    
    try {
      await AsyncStorage.setItem('token', access_token);
    } catch (e) {
      console.error('[AuthStore] Failed to save token:', e);
    }
    
    set({ 
      user, 
      token: access_token, 
      isAuthenticated: true, 
      needsOnboarding: true,
      isLoading: false 
    });
    return user;
  },

  exchangeSession: async (sessionId) => {
    console.log('[AuthStore] Exchanging session:', sessionId);
    const response = await api.post<AuthResponse>('/auth/session', { session_id: sessionId });
    const { access_token, user, needs_onboarding } = response.data;
    
    try {
      await AsyncStorage.setItem('token', access_token);
    } catch (e) {
      console.error('[AuthStore] Failed to save token:', e);
    }
    
    set({ 
      user, 
      token: access_token, 
      isAuthenticated: true, 
      needsOnboarding: needs_onboarding || false,
      isLoading: false 
    });
    return response.data;
  },

  logout: async () => {
    console.log('[AuthStore] Logging out...');
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout errors
    }
    try {
      await AsyncStorage.removeItem('token');
    } catch (e) {
      console.error('[AuthStore] Failed to remove token:', e);
    }
    set({ user: null, token: null, isAuthenticated: false, needsOnboarding: false, isLoading: false });
  },

  checkAuth: async () => {
    console.log('[AuthStore] Checking auth...');
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('[AuthStore] Token from storage:', token ? 'exists' : 'none');
      
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      
      const response = await api.get<User>('/auth/me');
      console.log('[AuthStore] Auth check successful, user:', response.data.name);
      set({ 
        user: response.data, 
        token, 
        isAuthenticated: true, 
        isLoading: false,
        needsOnboarding: response.data.needs_onboarding || false
      });
    } catch (error) {
      console.error('[AuthStore] Auth check failed:', error);
      try {
        await AsyncStorage.removeItem('token');
      } catch (e) {}
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const response = await api.put<User>('/users/profile', data);
    set({ user: response.data, needsOnboarding: false });
  },
}));

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../types';
import api from '../utils/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
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
  updateProfile: (data: Partial<User['profile']> & { name?: string; roles?: string[] }) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
  needsOnboarding: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),

  login: async (email, password) => {
    console.log('[AuthStore] Attempting login for:', email);
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { access_token, refresh_token, user } = response.data;
    console.log('[AuthStore] Login successful');
    
    try {
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('refresh_token', refresh_token);
    } catch (e) {
      console.error('[AuthStore] Failed to save tokens:', e);
    }
    
    set({ 
      user, 
      token: access_token,
      refreshToken: refresh_token,
      isAuthenticated: true, 
      needsOnboarding: user.needs_onboarding || false,
      isLoading: false 
    });
    return user;
  },

  register: async (email, password, name, role) => {
    console.log('[AuthStore] Attempting registration for:', email);
    const response = await api.post<AuthResponse>('/auth/register', { email, password, name, role });
    const { access_token, refresh_token, user } = response.data;
    
    try {
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('refresh_token', refresh_token);
    } catch (e) {
      console.error('[AuthStore] Failed to save tokens:', e);
    }
    
    set({ 
      user, 
      token: access_token,
      refreshToken: refresh_token,
      isAuthenticated: true, 
      needsOnboarding: true,
      isLoading: false 
    });
    return user;
  },

  exchangeSession: async (sessionId) => {
    console.log('[AuthStore] Exchanging session:', sessionId);
    const response = await api.post<AuthResponse>('/auth/session', { session_id: sessionId });
    const { access_token, refresh_token, user, needs_onboarding } = response.data;
    
    try {
      await AsyncStorage.setItem('token', access_token);
      if (refresh_token) await AsyncStorage.setItem('refresh_token', refresh_token);
    } catch (e) {
      console.error('[AuthStore] Failed to save tokens:', e);
    }
    
    set({ 
      user, 
      token: access_token,
      refreshToken: refresh_token,
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
      await AsyncStorage.removeItem('refresh_token');
    } catch (e) {
      console.error('[AuthStore] Failed to remove tokens:', e);
    }
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, needsOnboarding: false, isLoading: false });
  },

  checkAuth: async () => {
    console.log('[AuthStore] Checking auth...');
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
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
        refreshToken,
        isAuthenticated: true, 
        isLoading: false,
        needsOnboarding: response.data.needs_onboarding || false
      });
    } catch (error) {
      console.error('[AuthStore] Auth check failed:', error);
      // Try to refresh token
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          await get().refreshAccessToken();
          return;
        } catch (e) {
          console.error('[AuthStore] Token refresh failed:', e);
        }
      }
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('refresh_token');
      } catch (e) {}
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const response = await api.put<User>('/users/profile', data);
    set({ user: response.data, needsOnboarding: false });
  },

  refreshAccessToken: async () => {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await api.post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
      refresh_token: refreshToken
    });
    
    await AsyncStorage.setItem('token', response.data.access_token);
    await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
    
    set({ 
      token: response.data.access_token, 
      refreshToken: response.data.refresh_token 
    });
    
    // Retry auth check
    const userResponse = await api.get<User>('/auth/me');
    set({ 
      user: userResponse.data, 
      isAuthenticated: true, 
      isLoading: false,
      needsOnboarding: userResponse.data.needs_onboarding || false
    });
  },
}));

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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
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
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { access_token, user } = response.data;
    await AsyncStorage.setItem('token', access_token);
    set({ user, token: access_token, isAuthenticated: true, needsOnboarding: false });
  },

  register: async (email, password, name, role) => {
    const response = await api.post<AuthResponse>('/auth/register', { email, password, name, role });
    const { access_token, user } = response.data;
    await AsyncStorage.setItem('token', access_token);
    set({ user, token: access_token, isAuthenticated: true, needsOnboarding: true });
  },

  exchangeSession: async (sessionId) => {
    const response = await api.post<AuthResponse>('/auth/session', { session_id: sessionId });
    const { access_token, user, needs_onboarding } = response.data;
    await AsyncStorage.setItem('token', access_token);
    set({ 
      user, 
      token: access_token, 
      isAuthenticated: true, 
      needsOnboarding: needs_onboarding || false 
    });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout errors
    }
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, needsOnboarding: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      
      const response = await api.get<User>('/auth/me');
      set({ 
        user: response.data, 
        token, 
        isAuthenticated: true, 
        isLoading: false,
        needsOnboarding: response.data.needs_onboarding || false
      });
    } catch (error) {
      await AsyncStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const response = await api.put<User>('/users/profile', data);
    set({ user: response.data, needsOnboarding: false });
  },
}));

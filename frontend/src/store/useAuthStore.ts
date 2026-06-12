import { create } from 'zustand';
import axios from 'axios';
import { useMusicStore } from './useMusicStore';


export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar_url?: string;
  provider?: string;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;

  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

const API = 'http://localhost:1005/api';

// Persist token in localStorage
const getStoredToken = () => localStorage.getItem('ms_token');
const setStoredToken = (t: string | null) => {
  if (t) localStorage.setItem('ms_token', t);
  else localStorage.removeItem('ms_token');
};

// Set axios default auth header
const setAxiosAuth = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Init from storage
const storedToken = getStoredToken();
if (storedToken) setAxiosAuth(storedToken);

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: storedToken || null,
  loading: !!storedToken, // show loading while verifying token

  initAuth: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ loading: false });
      return;
    }
    setAxiosAuth(token);
    try {
      const { data } = await axios.get(`${API}/auth/me`, { timeout: 5000 });
      if (data.success) {
        set({ user: data.user, token, loading: false });
      } else {
        setStoredToken(null);
        setAxiosAuth(null);
        set({ token: null, user: null, loading: false });
      }
    } catch {
      setStoredToken(null);
      setAxiosAuth(null);
      set({ token: null, user: null, loading: false });
    }
  },

  login: async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      if (data.success) {
        setStoredToken(data.token);
        setAxiosAuth(data.token);
        set({ token: data.token, user: data.user });
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  },

  register: async (name, email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
      if (data.success) {
        setStoredToken(data.token);
        setAxiosAuth(data.token);
        set({ token: data.token, user: data.user });
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  },

  loginWithToken: async (token) => {
    setStoredToken(token);
    setAxiosAuth(token);
    try {
      const { data } = await axios.get(`${API}/auth/me`);
      if (data.success) {
        set({ token, user: data.user });
      }
    } catch {
      setStoredToken(null);
      setAxiosAuth(null);
    }
  },

  logout: () => {
    setStoredToken(null);
    setAxiosAuth(null);
    set({ token: null, user: null });
    useMusicStore.getState().resetPlayer();
  },

  isAdmin: () => get().user?.role === 'admin',
}));

import { create } from 'zustand';

export interface UserProfile {
  id: number;
  username: string;
  avatar: string;
  vtcId?: number;
  vtcName?: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  hydrate: () => {
    try {
      const token = localStorage.getItem('tnl_token');
      const raw   = localStorage.getItem('tnl_user');
      if (token && raw) {
        set({ token, user: JSON.parse(raw), isAuthenticated: true });
      }
    } catch {}
  },

  login: (token, user) => {
    try {
      localStorage.setItem('tnl_token', token);
      localStorage.setItem('tnl_user', JSON.stringify(user));
    } catch {}
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    try {
      localStorage.removeItem('tnl_token');
      localStorage.removeItem('tnl_user');
    } catch {}
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

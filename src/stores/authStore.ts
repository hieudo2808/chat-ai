
import { create } from 'zustand';
import type { User } from '../services/api/authApi';
import { authApi } from '../services/api/authApi';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginGuest: () => Promise<void>;
    checkAuth: () => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    loginGuest: async () => {
        set({ isLoading: true });
        try {
            const { token, user } = await authApi.loginGuest();
            if (token) {
                localStorage.setItem('access_token', token);
            }
            set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },
    checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
        }

        set({ isLoading: true });
        try {
            const { user } = await authApi.getMe();
            set({ user, isAuthenticated: true, isLoading: false });
        } catch {
            localStorage.removeItem('access_token');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },
    logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, isAuthenticated: false, isLoading: false });
    }
}));

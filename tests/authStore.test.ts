/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../src/stores/authStore';
import { authApi } from '../src/services/api/authApi';

vi.mock('../src/services/api/authApi', () => ({
    authApi: {
        loginGuest: vi.fn(),
        getMe: vi.fn()
    }
}));

describe('authStore', () => {
    const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
            clear: vi.fn(() => { store = {}; }),
            removeItem: vi.fn((key: string) => { delete store[key]; })
        };
    })();

    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
        localStorage.clear();
        useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
    });

    it('loginGuest should call api, set token and update state', async () => {
        const mockUser = { id: 'guest_123', type: 'guest' as const };
        (authApi.loginGuest as any).mockResolvedValue({ token: 'test_token', user: mockUser });

        await useAuthStore.getState().loginGuest();

        expect(authApi.loginGuest).toHaveBeenCalled();
        expect(localStorage.getItem('access_token')).toBe('test_token');
        const state = useAuthStore.getState();
        expect(state.user).toEqual(mockUser);
        expect(state.isAuthenticated).toBe(true);
    });

    it('checkAuth should call getMe and restore state if token exists', async () => {
        localStorage.setItem('access_token', 'test_token');
        const mockUser = { id: 'guest_123', type: 'guest' as const };
        (authApi.getMe as any).mockResolvedValue({ user: mockUser });

        await useAuthStore.getState().checkAuth();

        expect(authApi.getMe).toHaveBeenCalled();
        const state = useAuthStore.getState();
        expect(state.user).toEqual(mockUser);
        expect(state.isAuthenticated).toBe(true);
    });

    it('checkAuth should fail gracefully and logout if getMe fails', async () => {
        localStorage.setItem('access_token', 'invalid_token');
        (authApi.getMe as any).mockRejectedValue(new Error('Invalid token'));

        await useAuthStore.getState().checkAuth();

        expect(authApi.getMe).toHaveBeenCalled();
        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(localStorage.getItem('access_token')).toBeNull();
    });
});

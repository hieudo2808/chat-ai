import { fetchWithAuth } from './apiClient';

export interface User {
    id: string;
    type: 'guest' | 'user';
}

export interface AuthResponse {
    token?: string;
    user: User;
}

export const authApi = {
    loginGuest: async (): Promise<AuthResponse> => {
        const response = await fetchWithAuth('/auth/guest', { method: 'POST' });
        if (!response.ok) {
            throw new Error('Failed to login as guest');
        }
        return response.json();
    },
    
    getMe: async (): Promise<AuthResponse> => {
        const response = await fetchWithAuth('/auth/me', { method: 'GET' });
        if (!response.ok) {
            throw new Error('Failed to get user info');
        }
        return response.json();
    }
};

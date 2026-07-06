/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AuthStatus } from '../src/components/Auth/AuthStatus';
import { useAuthStore } from '../src/stores/authStore';

vi.mock('../src/stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../src/features/settings/hooks/useSettings', () => ({
    useSettings: vi.fn(() => ({
        settings: { userName: '' },
    })),
}));

describe('AuthStatus', () => {
    afterEach(() => {
        cleanup();
    });

    it('shows login component when not authenticated', () => {
        (useAuthStore as any).mockReturnValue({
            isAuthenticated: false,
            user: null,
            logout: vi.fn()
        });

        render(<AuthStatus />);
        expect(screen.getByText(/Tài khoản khách/i)).toBeTruthy();
    });

    it('shows user info and logout button when authenticated', () => {
        const mockLogout = vi.fn();
        (useAuthStore as any).mockReturnValue({
            isAuthenticated: true,
            user: { id: 'guest_123', type: 'user' },
            logout: mockLogout
        });

        render(<AuthStatus />);
        expect(screen.getByText(/guest_123/i)).toBeTruthy();
        
        const logoutBtn = screen.getByRole('button', { name: /Đăng xuất/i });
        fireEvent.click(logoutBtn);
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });
});

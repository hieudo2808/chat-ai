/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoginAsGuestButton } from '../src/components/Auth/LoginAsGuestButton';
import { useAuthStore } from '../src/stores/authStore';

vi.mock('../src/stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

describe('LoginAsGuestButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders button and calls loginGuest on click', async () => {
        const mockLoginGuest = vi.fn();
        (useAuthStore as any).mockReturnValue({
            isLoading: false,
            loginGuest: mockLoginGuest
        });

        render(<LoginAsGuestButton />);
        
        const button = screen.getByRole('button', { name: /login as guest/i }) as HTMLButtonElement;
        expect(button).toBeTruthy();
        expect(button.disabled).toBe(false);

        fireEvent.click(button);
        expect(mockLoginGuest).toHaveBeenCalledTimes(1);
    });

    it('disables button and shows loading text when isLoading is true', () => {
        (useAuthStore as any).mockReturnValue({
            isLoading: true,
            loginGuest: vi.fn()
        });

        render(<LoginAsGuestButton />);
        
        const button = screen.getByRole('button') as HTMLButtonElement;
        expect(button.disabled).toBe(true);
        expect(button.textContent).toMatch(/logging in/i);
    });
});

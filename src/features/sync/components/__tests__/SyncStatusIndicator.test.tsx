// @vitest-environment jsdom
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useSync } from '../../hooks/useSync';
import { useAuthStore } from '../../../../stores/authStore';

vi.mock('../../hooks/useNetworkStatus', () => ({
    useNetworkStatus: vi.fn(),
}));

vi.mock('../../hooks/useSync', () => ({
    useSync: vi.fn(),
}));

vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn(),
}));

describe('SyncStatusIndicator', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('should render nothing if not authenticated', () => {
        vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: false } as unknown as ReturnType<typeof useAuthStore>);
        vi.mocked(useNetworkStatus).mockReturnValue({ isOnline: true } as unknown as ReturnType<typeof useNetworkStatus>);
        vi.mocked(useSync).mockReturnValue({ isSyncing: false, lastSynced: null, sync: vi.fn() });

        const { container } = render(<SyncStatusIndicator />);
        expect(container.firstChild).toBeNull();
    });

    it('should show syncing state', () => {
        vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: true } as unknown as ReturnType<typeof useAuthStore>);
        localStorage.setItem('access_token', 'token123');
        vi.mocked(useNetworkStatus).mockReturnValue({ isOnline: true } as unknown as ReturnType<typeof useNetworkStatus>);
        vi.mocked(useSync).mockReturnValue({ isSyncing: true, lastSynced: null, sync: vi.fn() });

        render(<SyncStatusIndicator />);
        expect(screen.getByText(/syncing/i)).toBeDefined();
    });

    it('should trigger sync on online transition and interval', () => {
        const syncMock = vi.fn();
        vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: true } as unknown as ReturnType<typeof useAuthStore>);
        localStorage.setItem('access_token', 'token123');
        vi.mocked(useNetworkStatus).mockReturnValue({ isOnline: true } as unknown as ReturnType<typeof useNetworkStatus>);
        vi.mocked(useSync).mockReturnValue({ isSyncing: false, lastSynced: null, sync: syncMock });

        const { rerender } = render(<SyncStatusIndicator />);

        // Interval sync
        act(() => {
            vi.advanceTimersByTime(30000);
        });
        expect(syncMock).toHaveBeenCalledWith('token123');

        // Transition from offline to online
        vi.mocked(useNetworkStatus).mockReturnValue({ isOnline: false } as unknown as ReturnType<typeof useNetworkStatus>);
        rerender(<SyncStatusIndicator />);
        vi.mocked(useNetworkStatus).mockReturnValue({ isOnline: true } as unknown as ReturnType<typeof useNetworkStatus>);
        rerender(<SyncStatusIndicator />);

        expect(syncMock).toHaveBeenCalledTimes(3);
    });
});

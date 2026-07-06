// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NetworkStatusBanner } from '../NetworkStatusBanner';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

vi.mock('../../hooks/useNetworkStatus', () => ({
    useNetworkStatus: vi.fn()
}));

describe('NetworkStatusBanner', () => {
    it('should not render anything if online', () => {
        vi.mocked(useNetworkStatus).mockReturnValue({
            isOnline: true,
            checkHealth: vi.fn(),
            lastOnlineAt: undefined,
            lastOfflineAt: undefined
        });

        const { container } = render(<NetworkStatusBanner />);
        expect(container.firstChild).toBeNull();
    });

    it('should render offline banner if offline', () => {
        vi.mocked(useNetworkStatus).mockReturnValue({
            isOnline: false,
            checkHealth: vi.fn(),
            lastOnlineAt: undefined,
            lastOfflineAt: undefined
        });

        render(<NetworkStatusBanner />);
        expect(screen.getByText(/you are offline/i)).toBeDefined();
    });
});

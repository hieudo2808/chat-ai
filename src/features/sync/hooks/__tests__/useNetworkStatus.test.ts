// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'healthy' })
        });
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        vi.clearAllMocks();
    });

    it('should initialize with true if navigator is online', async () => {
        vi.stubGlobal('navigator', { onLine: true });
        const { result } = renderHook(() => useNetworkStatus(0));
        
        await act(async () => {
            // Wait for initial checkHealth to resolve
            await new Promise(resolve => setTimeout(resolve, 10));
        });
        
        expect(result.current.isOnline).toBe(true);
    });

    it('should initialize with false if navigator is offline', async () => {
        vi.stubGlobal('navigator', { onLine: false });
        const { result } = renderHook(() => useNetworkStatus(0));
        
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
        });
        
        expect(result.current.isOnline).toBe(false);
    });

    it('should react to offline/online events', async () => {
        vi.stubGlobal('navigator', { onLine: true });
        const { result } = renderHook(() => useNetworkStatus(0));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        await act(async () => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(result.current.isOnline).toBe(false);

        // When online event fires, it calls checkHealth which does fetch
        await act(async () => {
            vi.stubGlobal('navigator', { onLine: true });
            window.dispatchEvent(new Event('online'));
            await new Promise(resolve => setTimeout(resolve, 10)); // wait for fetch
        });
        expect(result.current.isOnline).toBe(true);
    });

    it('should update status if checkHealth fetch fails', async () => {
        vi.stubGlobal('navigator', { onLine: true });
        const { result } = renderHook(() => useNetworkStatus(0));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        expect(result.current.isOnline).toBe(true);

        vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('Network error'));

        await act(async () => {
            await result.current.checkHealth();
        });

        expect(result.current.isOnline).toBe(false);
    });
});

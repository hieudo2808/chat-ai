/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithAuth, API_BASE_URL } from '../src/services/api/apiClient';

describe('apiClient (fetchWithAuth)', () => {
    const originalFetch = global.fetch;

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
        global.fetch = vi.fn();
        Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
        localStorage.clear();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('should prepend API_BASE_URL and include Authorization header if token exists', async () => {
        localStorage.setItem('access_token', 'test_token_123');
        (global.fetch as any).mockResolvedValue(new Response('{}', { status: 200 }));

        await fetchWithAuth('/test-endpoint');

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, options] = (global.fetch as any).mock.calls[0];
        
        expect(url).toBe(`${API_BASE_URL}/test-endpoint`);
        const headers = options.headers as Record<string, string>;
        expect(headers['Authorization']).toBe('Bearer test_token_123');
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('should NOT include Authorization header if token is missing', async () => {
        (global.fetch as any).mockResolvedValue(new Response('{}', { status: 200 }));

        await fetchWithAuth('/test-endpoint');

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, options] = (global.fetch as any).mock.calls[0];
        
        expect(url).toBe(`${API_BASE_URL}/test-endpoint`);
        const headers = options.headers as Record<string, string> | undefined;
        expect(headers?.['Authorization']).toBeUndefined();
    });
});

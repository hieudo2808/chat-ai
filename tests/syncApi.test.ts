import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pushSync, pullSync } from '../src/features/sync/services/syncApi';

// Mock fetch
globalThis.fetch = vi.fn();

describe('syncApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should push data to server successfully', async () => {
        vi.mocked(globalThis.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: [], serverTime: '2026-07-02T00:00:00.000Z' }),
        });

        const changes = [
            {
                entity: 'character' as const,
                operation: 'create' as const,
                localId: 'char-1',
                data: { name: 'Test' },
                localUpdatedAt: '2026-07-02T00:00:00.000Z',
                version: 1,
            }
        ];

        const response = await pushSync(changes, 'test-token');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/sync/push'),
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                },
                body: JSON.stringify({ changes }),
            })
        );
        expect(response.serverTime).toBe('2026-07-02T00:00:00.000Z');
    });

    it('should throw error if fetch fails', async () => {
        vi.mocked(globalThis.fetch).mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error',
        });

        await expect(pushSync([], 'test-token')).rejects.toThrow('Sync push failed: 500');
    });

    it('should pull data from server successfully', async () => {
        vi.mocked(globalThis.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ changes: [], serverTime: '2026-07-02T00:00:00.000Z' }),
        });

        const response = await pullSync('2026-07-01T00:00:00.000Z', 'test-token');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/sync/pull?since=2026-07-01T00%3A00%3A00.000Z'),
            expect.objectContaining({
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer test-token',
                },
            })
        );
        expect(response.serverTime).toBe('2026-07-02T00:00:00.000Z');
    });
});

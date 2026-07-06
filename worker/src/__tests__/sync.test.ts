import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSyncPush, handleSyncPull } from '../routes/sync';

describe('sync routes', () => {
    let mockEnv: any;
    
    beforeEach(() => {
        mockEnv = {
            DB: {
                prepare: vi.fn().mockReturnThis(),
                bind: vi.fn().mockReturnThis(),
                run: vi.fn().mockResolvedValue({ success: true }),
                all: vi.fn().mockResolvedValue({ results: [] })
            },
            JWT_SECRET: 'test-secret',
            SECRET: 'test-secret'
        } as any;
    });

    it('handleSyncPush should process create character operation', async () => {
        const changes = [{
            entity: 'character',
            operation: 'create',
            localId: 'char-1',
            data: { id: 'char-1', name: 'Test' },
            localUpdatedAt: '2026-07-02T00:00:00.000Z',
            version: 1
        }];

        const req = new Request('http://localhost/sync/push', {
            method: 'POST',
            body: JSON.stringify({ changes })
        });
        
        const response = await handleSyncPush(req, mockEnv);
        expect(response.status).toBe(200);
        
        const json = await response.json() as { results: { status: string }[] };
        expect(json.results).toHaveLength(1);
        expect(json.results[0].status).toBe('synced');
        expect(mockEnv.DB.run).toHaveBeenCalled();
    });

    it('handleSyncPull should return changes since given time', async () => {
        const req = new Request('http://localhost/sync/pull?since=2026-07-01T00:00:00.000Z');
        
        mockEnv.DB.all.mockResolvedValueOnce({
            results: [{ id: 'char-1', name: 'Test', updated_at: '2026-07-02T00:00:00.000Z' }]
        });
        mockEnv.DB.all.mockResolvedValueOnce({ results: [] }); // For models

        const response = await handleSyncPull(req, mockEnv);
        expect(response.status).toBe(200);

        const json = await response.json() as { changes: { entity: string }[] };
        expect(json.changes).toBeDefined();
        expect(json.changes.length).toBe(1);
        expect(json.changes[0].entity).toBe('character');
        expect(mockEnv.DB.all).toHaveBeenCalledTimes(2);
    });
});

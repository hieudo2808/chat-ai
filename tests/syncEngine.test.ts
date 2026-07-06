import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processSyncQueue, syncPull } from '../src/features/sync/engine/syncEngine';
import * as mutationQueue from '../src/features/sync/engine/mutationQueue';
import * as syncApi from '../src/features/sync/services/syncApi';
import * as conflictResolver from '../src/features/sync/engine/conflictResolver';

vi.mock('../src/features/sync/engine/mutationQueue', () => ({
    getPendingMutations: vi.fn(),
    markMutationStatus: vi.fn(),
}));

vi.mock('../src/features/sync/services/syncApi', () => ({
    pushSync: vi.fn(),
    pullSync: vi.fn(),
}));

vi.mock('../src/features/sync/engine/conflictResolver', () => ({
    resolvePullConflicts: vi.fn(),
}));

describe('syncEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('processSyncQueue', () => {
        it('should do nothing if no pending mutations', async () => {
            vi.mocked(mutationQueue.getPendingMutations).mockResolvedValueOnce([]);
            await processSyncQueue('test-token');
            expect(syncApi.pushSync).not.toHaveBeenCalled();
        });

        it('should push mutations and mark as synced on success', async () => {
            const mutations = [{ id: 'mut-1', entity: 'character', operation: 'create', data: { name: 'A' }, localId: 'char-1', createdAt: Date.now() }] as unknown as import('../src/features/sync/engine/mutationQueue').OfflineMutation[];
            vi.mocked(mutationQueue.getPendingMutations).mockResolvedValueOnce(mutations);
            
            vi.mocked(syncApi.pushSync).mockResolvedValueOnce({
                results: [{ localId: 'char-1', serverId: 'server-1', status: 'synced' }],
                serverTime: new Date().toISOString()
            });

            await processSyncQueue('test-token');

            expect(mutationQueue.markMutationStatus).toHaveBeenCalledWith('mut-1', 'processing');
            expect(syncApi.pushSync).toHaveBeenCalledWith(expect.any(Array), 'test-token');
            expect(mutationQueue.markMutationStatus).toHaveBeenCalledWith('mut-1', 'synced', { serverId: 'server-1' });
        });

        it('should mark as failed and increment retryCount on item error', async () => {
            const mutations = [{ id: 'mut-1', retryCount: 0, entity: 'character', operation: 'create', data: {}, localId: 'char-1', createdAt: Date.now() }] as unknown as import('../src/features/sync/engine/mutationQueue').OfflineMutation[];
            vi.mocked(mutationQueue.getPendingMutations).mockResolvedValueOnce(mutations);
            
            vi.mocked(syncApi.pushSync).mockResolvedValueOnce({
                results: [{ localId: 'char-1', status: 'error', error: 'invalid data' }],
                serverTime: new Date().toISOString()
            });

            await processSyncQueue('test-token');

            expect(mutationQueue.markMutationStatus).toHaveBeenCalledWith('mut-1', 'failed', { 
                retryCount: 1, 
                lastError: 'invalid data' 
            });
        });

        it('should mark as conflict if server reports conflict', async () => {
            const mutations = [{ id: 'mut-1', retryCount: 0, entity: 'character', operation: 'update', data: {}, localId: 'char-1', createdAt: Date.now() }] as unknown as import('../src/features/sync/engine/mutationQueue').OfflineMutation[];
            vi.mocked(mutationQueue.getPendingMutations).mockResolvedValueOnce(mutations);
            
            vi.mocked(syncApi.pushSync).mockResolvedValueOnce({
                results: [{ localId: 'char-1', status: 'conflict' }],
                serverTime: new Date().toISOString()
            });

            await processSyncQueue('test-token');

            expect(mutationQueue.markMutationStatus).toHaveBeenCalledWith('mut-1', 'conflict');
        });

        it('should mark all as failed if network error occurs', async () => {
            const mutations = [{ id: 'mut-1', retryCount: 0, entity: 'character', operation: 'update', data: {}, localId: 'char-1', createdAt: Date.now() }] as unknown as import('../src/features/sync/engine/mutationQueue').OfflineMutation[];
            vi.mocked(mutationQueue.getPendingMutations).mockResolvedValueOnce(mutations);
            
            vi.mocked(syncApi.pushSync).mockRejectedValueOnce(new Error('Network error'));

            await processSyncQueue('test-token');

            expect(mutationQueue.markMutationStatus).toHaveBeenCalledWith('mut-1', 'failed', expect.objectContaining({ 
                retryCount: 1
            }));
        });
    });

    describe('syncPull', () => {
        it('should call syncApi.pullSync and pass to conflictResolver', async () => {
            const changes = [{ entity: 'character', operation: 'create', localId: 'server-1', version: 1, localUpdatedAt: '' }];
            vi.mocked(syncApi.pullSync).mockResolvedValueOnce({ changes, serverTime: '2023-01-01' } as unknown as import('../src/features/sync/services/syncApi').PullSyncResponse);

            await syncPull('test-token', '2022-01-01');

            expect(syncApi.pullSync).toHaveBeenCalledWith('2022-01-01', 'test-token');
            expect(conflictResolver.resolvePullConflicts).toHaveBeenCalledWith(changes);
        });
    });
});

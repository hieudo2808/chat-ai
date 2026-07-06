import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as repo from '../src/services/storage/modelProfileRepository';
import { dbPromise } from '../src/db/appDb';
import * as mutationQueue from '../src/features/sync/engine/mutationQueue';

vi.mock('../src/db/appDb', () => ({
    dbPromise: Promise.resolve({
        put: vi.fn(),
        get: vi.fn(),
        getAll: vi.fn(),
        getAllFromIndex: vi.fn(),
        delete: vi.fn()
    })
}));

vi.mock('../src/features/sync/engine/mutationQueue', () => ({
    addMutation: vi.fn()
}));

describe('modelProfileRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('saveModelProfile', () => {
        it('should create new model profile with pending_create and add to mutation queue', async () => {
            const mockDb = await dbPromise;
            const profile = { name: 'Test Model', provider: 'OpenAI' } as unknown as import('../src/types').AiModelProfile;

            const saved = await repo.createModelProfile(profile);

            expect(saved.syncStatus).toBe('pending_create');
            expect(mockDb.put).toHaveBeenCalledWith('models', saved);

            expect(mutationQueue.addMutation).toHaveBeenCalledWith({
                entity: 'model_profile',
                operation: 'create',
                localId: saved.id,
                payload: saved
            });
        });

        it('should update existing model profile with pending_update and queue mutation', async () => {
            const mockDb = await dbPromise;
            const existing = { id: 'mod-1', name: 'Old Model', syncStatus: 'synced', version: 1 };
            
            vi.mocked(mockDb.get).mockResolvedValueOnce(existing);

            const updated = await repo.updateModelProfile('mod-1', { name: 'New Model' } as unknown as Partial<import('../src/types').AiModelProfile>);

            expect(updated.syncStatus).toBe('pending_update');
            expect(updated.version).toBe(2);

            expect(mockDb.put).toHaveBeenCalledWith('models', updated);

            expect(mutationQueue.addMutation).toHaveBeenCalledWith({
                entity: 'model_profile',
                operation: 'update',
                localId: updated.id,
                serverId: updated.serverId,
                payload: updated
            });
        });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as repo from '../src/services/storage/characterRepository';
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

describe('characterRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createCharacter', () => {
        it('should save to IndexedDB with pending_create and add to mutation queue', async () => {
            const mockDb = await dbPromise;
            
            const character = {
                name: 'Test Character',
                avatar: 'https://test.com/avatar.png',
                description: 'Test description',
                personality: 'Test personality',
                firstMessage: 'Hello'
            } as unknown as import('../src/types').Character;

            const created = await repo.createCharacter(character);

            expect(created).toMatchObject({
                name: 'Test Character',
                syncStatus: 'pending_create',
            });

            expect(mockDb.put).toHaveBeenCalledWith('characters', created);
            
            expect(mutationQueue.addMutation).toHaveBeenCalledWith({
                entity: 'character',
                operation: 'create',
                localId: created.id,
                payload: created
            });
        });
    });

    describe('updateCharacter', () => {
        it('should fetch character, merge updates, save with pending_update, and queue mutation', async () => {
            const mockDb = await dbPromise;
            
            const existing = {
                id: 'char-123',
                name: 'Old Name',
                syncStatus: 'synced',
                serverId: 'server-123',
                version: 1
            };

            vi.mocked(mockDb.get).mockResolvedValueOnce(existing);

            const updated = await repo.updateCharacter('char-123', { name: 'New Name' });

            expect(updated).toMatchObject({
                id: 'char-123',
                name: 'New Name',
                syncStatus: 'pending_update',
                serverId: 'server-123'
            });

            expect(mockDb.put).toHaveBeenCalledWith('characters', updated);

            expect(mutationQueue.addMutation).toHaveBeenCalledWith({
                entity: 'character',
                operation: 'update',
                localId: 'char-123',
                serverId: 'server-123',
                payload: updated
            });
        });
    });
});

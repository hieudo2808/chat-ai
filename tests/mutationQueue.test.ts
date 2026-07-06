import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addMutation, getPendingMutations, type OfflineMutation } from '../src/features/sync/engine/mutationQueue';
import { dbPromise } from '../src/db/appDb';

vi.mock('../src/db/appDb', () => ({
    dbPromise: Promise.resolve({
        getAllFromIndex: vi.fn(),
        put: vi.fn(),
        get: vi.fn(),
        getAll: vi.fn(),
        delete: vi.fn(),
        transaction: vi.fn()
    })
}));

describe('mutationQueue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('addMutation', () => {
        it('should add a new mutation when none exists for the entity', async () => {
            const mockDb = await dbPromise;
            // No existing mutations
            vi.mocked(mockDb.getAllFromIndex).mockResolvedValueOnce([]);

            await addMutation({
                entity: 'character',
                operation: 'create',
                localId: 'char-1',
                payload: { name: 'Test' }
            });

            expect(mockDb.put).toHaveBeenCalledWith('offline_mutations', expect.objectContaining({
                entity: 'character',
                operation: 'create',
                localId: 'char-1',
                status: 'pending',
                payload: { name: 'Test' }
            }));
        });

        it('should compact update after create into a single create', async () => {
            const mockDb = await dbPromise;
            const existingMutation: OfflineMutation = {
                id: 'mut-1',
                entity: 'character',
                operation: 'create',
                localId: 'char-1',
                payload: { name: 'Test' },
                status: 'pending',
                retryCount: 0,
                createdAt: '2023-01-01',
                updatedAt: '2023-01-01',
                idempotencyKey: 'key-1'
            };

            // Existing mutation
            vi.mocked(mockDb.getAllFromIndex).mockResolvedValueOnce([existingMutation]);

            await addMutation({
                entity: 'character',
                operation: 'update',
                localId: 'char-1',
                payload: { name: 'Test Updated' }
            });

            // Should delete the old one or update it. In our compact logic, we might just update the existing one.
            expect(mockDb.put).toHaveBeenCalledWith('offline_mutations', expect.objectContaining({
                id: 'mut-1',
                operation: 'create', // keeps it as create
                payload: { name: 'Test Updated' }
            }));
        });

        it('should compact update after update', async () => {
            const mockDb = await dbPromise;
            const existingMutation: OfflineMutation = {
                id: 'mut-1',
                entity: 'character',
                operation: 'update',
                localId: 'char-1',
                payload: { name: 'Test' },
                status: 'pending',
                retryCount: 0,
                createdAt: '2023-01-01',
                updatedAt: '2023-01-01',
                idempotencyKey: 'key-1'
            };

            vi.mocked(mockDb.getAllFromIndex).mockResolvedValueOnce([existingMutation]);

            await addMutation({
                entity: 'character',
                operation: 'update',
                localId: 'char-1',
                payload: { name: 'Test 2' }
            });

            expect(mockDb.put).toHaveBeenCalledWith('offline_mutations', expect.objectContaining({
                id: 'mut-1',
                operation: 'update',
                payload: { name: 'Test 2' }
            }));
        });

        it('should drop create and delete if delete comes after create', async () => {
            const mockDb = await dbPromise;
            const existingMutation: OfflineMutation = {
                id: 'mut-1',
                entity: 'character',
                operation: 'create',
                localId: 'char-1',
                payload: { name: 'Test' },
                status: 'pending',
                retryCount: 0,
                createdAt: '2023-01-01',
                updatedAt: '2023-01-01',
                idempotencyKey: 'key-1'
            };

            vi.mocked(mockDb.getAllFromIndex).mockResolvedValueOnce([existingMutation]);

            await addMutation({
                entity: 'character',
                operation: 'delete',
                localId: 'char-1',
                payload: null
            });

            // Since it was pending create, and now it's deleted, we can just remove the pending create and not sync anything.
            expect(mockDb.delete).toHaveBeenCalledWith('offline_mutations', 'mut-1');
            expect(mockDb.put).not.toHaveBeenCalled();
        });

        it('should turn update then delete into a single delete', async () => {
            const mockDb = await dbPromise;
            const existingMutation: OfflineMutation = {
                id: 'mut-1',
                entity: 'character',
                operation: 'update',
                localId: 'char-1',
                payload: { name: 'Test' },
                status: 'pending',
                retryCount: 0,
                createdAt: '2023-01-01',
                updatedAt: '2023-01-01',
                idempotencyKey: 'key-1'
            };

            vi.mocked(mockDb.getAllFromIndex).mockResolvedValueOnce([existingMutation]);

            await addMutation({
                entity: 'character',
                operation: 'delete',
                localId: 'char-1',
                payload: null
            });

            expect(mockDb.put).toHaveBeenCalledWith('offline_mutations', expect.objectContaining({
                id: 'mut-1',
                operation: 'delete',
                payload: null
            }));
        });
    });

    describe('getPendingMutations', () => {
        it('should return mutations with status pending or failed (if retryCount < max)', async () => {
            const mockDb = await dbPromise;
            const pending = { id: 'mut-1', status: 'pending', createdAt: '2' };
            const failed = { id: 'mut-2', status: 'failed', retryCount: 1, createdAt: '1' };
            const tooManyRetries = { id: 'mut-3', status: 'failed', retryCount: 5, createdAt: '3' };

            vi.mocked(mockDb.getAllFromIndex).mockResolvedValueOnce([pending]);
            vi.mocked(mockDb.getAllFromIndex).mockResolvedValueOnce([failed, tooManyRetries]);

            const result = await getPendingMutations();

            // should be sorted by createdAt
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('mut-2'); // created at '1'
            expect(result[1].id).toBe('mut-1'); // created at '2'
        });
    });
});

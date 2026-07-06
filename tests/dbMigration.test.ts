import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runMigration } from '../src/db/migration';

const mockGetAll = vi.fn();
const mockPut = vi.fn();

describe('dbMigration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should migrate pending characters to offline_mutations', async () => {
        const mockDb = {
            getAll: mockGetAll,
            put: mockPut
        };

        mockGetAll.mockResolvedValueOnce([
            { id: 'char-1', syncStatus: 'pending_create', name: 'Char 1', version: 1 },
            { id: 'char-2', syncStatus: 'synced', name: 'Char 2', version: 1 },
            { id: 'char-3', syncStatus: 'pending_update', name: 'Char 3', version: 2 }
        ]);
        mockGetAll.mockResolvedValueOnce([]); // empty models

        await runMigration(mockDb as unknown as import('idb').IDBPDatabase<unknown>);

        expect(mockPut).toHaveBeenCalledWith('offline_mutations', expect.objectContaining({
            entity: 'character',
            operation: 'create',
            localId: 'char-1',
            status: 'pending'
        }));

        expect(mockPut).toHaveBeenCalledWith('offline_mutations', expect.objectContaining({
            entity: 'character',
            operation: 'update',
            localId: 'char-3',
            status: 'pending'
        }));
    });
});

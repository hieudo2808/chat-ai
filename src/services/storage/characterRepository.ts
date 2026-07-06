import { dbPromise } from '../../db/appDb';
import type { Character } from '../../types';
import type { SyncResult } from '../../features/sync/services/syncApi';
import { createId } from '../../utils/id';
import { addMutation } from '../../features/sync/engine/mutationQueue';

export async function createCharacter(input: Partial<Character>): Promise<Character> {
    const db = await dbPromise;
    const nowIso = new Date().toISOString();
    const nowTs = Date.now();
    
    const newChar: Character = {
        ...input,
        id: createId(),
        syncStatus: 'pending_create',
        localUpdatedAt: nowIso,
        version: 1,
        createdAt: nowTs,
        updatedAt: nowTs,
    } as Character;

    await db.put('characters', newChar);

    await addMutation({
        entity: 'character',
        operation: 'create',
        localId: newChar.id,
        payload: newChar
    });

    return newChar;
}

export async function updateCharacter(id: string, patch: Partial<Character>): Promise<Character> {
    const db = await dbPromise;
    const existing = await db.get('characters', id);
    if (!existing) throw new Error('Character not found');

    const nowIso = new Date().toISOString();
    const nowTs = Date.now();
    const updated: Character = {
        ...existing,
        ...patch,
        syncStatus: existing.syncStatus === 'pending_create' ? 'pending_create' : 'pending_update',
        localUpdatedAt: nowIso,
        version: (existing.version || 1) + 1,
        updatedAt: nowTs,
    };

    await db.put('characters', updated);

    await addMutation({
        entity: 'character',
        operation: 'update',
        localId: updated.id,
        serverId: updated.serverId,
        payload: updated
    });

    return updated;
}

export async function getCharacter(id: string): Promise<Character | undefined> {
    const db = await dbPromise;
    return db.get('characters', id);
}

export async function markSynced(id: string, result: SyncResult): Promise<void> {
    const db = await dbPromise;
    const existing = await db.get('characters', id);
    if (!existing) return;

    if (result.status === 'synced') {
        const updated: Character = {
            ...existing,
            syncStatus: 'synced',
            serverId: result.serverId || existing.serverId,
            serverUpdatedAt: result.serverUpdatedAt,
        };
        await db.put('characters', updated);
    } else {
        const updated: Character = {
            ...existing,
            syncStatus: 'sync_error',
            syncError: result.error,
        };
        await db.put('characters', updated);
    }
}

import { dbPromise } from '../../db/appDb';
import type { AiModelProfile } from '../../types';
import { createId } from '../../utils/id';
import { addMutation } from '../../features/sync/engine/mutationQueue';

export async function createModelProfile(input: Partial<AiModelProfile>): Promise<AiModelProfile> {
    const db = await dbPromise;
    const now = new Date().toISOString();
    
    const newModel: AiModelProfile = {
        ...input,
        id: createId(),
        syncStatus: 'pending_create',
        localUpdatedAt: now,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    } as AiModelProfile;

    await db.put('models', newModel);

    await addMutation({
        entity: 'model_profile',
        operation: 'create',
        localId: newModel.id,
        payload: newModel
    });

    return newModel;
}

export async function updateModelProfile(id: string, patch: Partial<AiModelProfile>): Promise<AiModelProfile> {
    const db = await dbPromise;
    const existing = await db.get('models', id);
    if (!existing) throw new Error('Model not found');

    const now = new Date().toISOString();
    const updated: AiModelProfile = {
        ...existing,
        ...patch,
        syncStatus: existing.syncStatus === 'pending_create' ? 'pending_create' : 'pending_update',
        localUpdatedAt: now,
        version: (existing.version || 1) + 1,
        updatedAt: Date.now(),
    };

    await db.put('models', updated);

    await addMutation({
        entity: 'model_profile',
        operation: 'update',
        localId: updated.id,
        serverId: updated.serverId,
        payload: updated
    });

    return updated;
}

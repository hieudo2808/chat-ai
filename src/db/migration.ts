import { createId } from '../utils/id';

export async function runMigration(db: import('idb').IDBPDatabase<import('./appDb').RoleChatDB>): Promise<void> {
    const now = new Date().toISOString();
    
    // Migrate characters
    const characters = await db.getAll('characters');
    for (const char of characters) {
        if (char.syncStatus === 'pending_create' || char.syncStatus === 'pending_update') {
            const operation = char.syncStatus === 'pending_create' ? 'create' : 'update';
            await db.put('offline_mutations', {
                id: createId(),
                entity: 'character',
                operation,
                localId: char.id,
                serverId: char.serverId,
                payload: char,
                status: 'pending',
                retryCount: 0,
                createdAt: now,
                updatedAt: now,
                idempotencyKey: createId()
            });

            // Keep syncStatus as is to indicate it is pending sync in the UI
            // However, the actual source of truth for pending is now offline_mutations.
        }
    }

    // Migrate models
    const models = await db.getAll('models');
    for (const model of models) {
        if (model.syncStatus === 'pending_create' || model.syncStatus === 'pending_update') {
            const operation = model.syncStatus === 'pending_create' ? 'create' : 'update';
            await db.put('offline_mutations', {
                id: createId(),
                entity: 'model_profile',
                operation,
                localId: model.id,
                serverId: model.serverId,
                payload: model,
                status: 'pending',
                retryCount: 0,
                createdAt: now,
                updatedAt: now,
                idempotencyKey: createId()
            });
        }
    }
}

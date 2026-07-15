import { openDB, type DBSchema } from 'idb';
import type { Settings, Character, Message, AiModelProfile } from '../types';

export interface RoleChatDB extends DBSchema {
    settings: {
        key: string;
        value: Settings;
    };
    characters: {
        key: string;
        value: Character;
    };
    messages: {
        key: string;
        value: Message;
        indexes: {
            characterId: string;
            createdAt: number;
        };
    };
    models: {
        key: string;
        value: AiModelProfile;
    };
    offline_mutations: {
        key: string;
        value: import('../features/sync/engine/mutationQueue').OfflineMutation;
        indexes: {
            status: string;
            entity: string;
        };
    };
}

export const dbPromise = openDB<RoleChatDB>('rolechat_db', 3, {
    async upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('characters')) {
                db.createObjectStore('characters', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('messages')) {
                const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
                messageStore.createIndex('characterId', 'characterId');
                messageStore.createIndex('createdAt', 'createdAt');
            }
        }
        if (oldVersion < 2) {
            if (!db.objectStoreNames.contains('models')) {
                db.createObjectStore('models', { keyPath: 'id' });
            }
        }
        if (oldVersion < 3) {
            if (!db.objectStoreNames.contains('offline_mutations')) {
                const mutationStore = db.createObjectStore('offline_mutations', { keyPath: 'id' });
                mutationStore.createIndex('status', 'status');
                mutationStore.createIndex('entity', 'entity');
            }

            // We cannot import runMigration directly into upgrade transaction easily
            // if it requires other async operations, but since it's just IDB operations
            // it's better to do the migration logic right here in the transaction.
            const characters = await tx.objectStore('characters').getAll();
            const now = new Date().toISOString();
            
            await Promise.all(characters.map(async (char) => {
                if (char.syncStatus === 'pending_create' || char.syncStatus === 'pending_update') {
                    const operation = char.syncStatus === 'pending_create' ? 'create' : 'update';
                    await tx.objectStore('offline_mutations').put({
                        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
                        entity: 'character',
                        operation,
                        localId: char.id,
                        serverId: char.serverId,
                        payload: char,
                        status: 'pending',
                        retryCount: 0,
                        createdAt: now,
                        updatedAt: now,
                        idempotencyKey: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
                    });
                }
            }));

            const models = await tx.objectStore('models').getAll();
            await Promise.all(models.map(async (model) => {
                if (model.syncStatus === 'pending_create' || model.syncStatus === 'pending_update') {
                    const operation = model.syncStatus === 'pending_create' ? 'create' : 'update';
                    await tx.objectStore('offline_mutations').put({
                        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
                        entity: 'model_profile',
                        operation,
                        localId: model.id,
                        serverId: model.serverId,
                        payload: model,
                        status: 'pending',
                        retryCount: 0,
                        createdAt: now,
                        updatedAt: now,
                        idempotencyKey: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
                    });
                }
            }));
        }
    },
});

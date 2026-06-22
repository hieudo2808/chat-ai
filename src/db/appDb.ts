import { openDB, type DBSchema } from 'idb';
import type { Settings, Character, Message } from '../types';

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
}

export const dbPromise = openDB<RoleChatDB>('rolechat_db', 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', {
                keyPath: 'id',
            });
        }
        if (!db.objectStoreNames.contains('characters')) {
            db.createObjectStore('characters', {
                keyPath: 'id',
            });
        }
        if (!db.objectStoreNames.contains('messages')) {
            const messageStore = db.createObjectStore('messages', {
                keyPath: 'id',
            });
            messageStore.createIndex('characterId', 'characterId');
            messageStore.createIndex('createdAt', 'createdAt');
        }
    },
});

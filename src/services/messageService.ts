import { dbPromise } from '../db/appDb';
import type { Message } from '../types';

export async function getMessagesByCharacterId(characterId: string): Promise<Message[]> {
    const db = await dbPromise;
    // Transaction on messages, readonly
    const tx = db.transaction('messages', 'readonly');
    const index = tx.store.index('characterId');
    
    // Get all messages for this character
    const messages = await index.getAll(characterId);
    
    // Sort ascending by createdAt (the index doesn't guarantee global ordering by createdAt if queried by characterId)
    return messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

export async function saveMessage(message: Message): Promise<Message> {
    const db = await dbPromise;

    const data: Message = {
        ...message,
        createdAt: message.createdAt || Date.now(),
    };

    await db.put('messages', data);
    return data;
}

export async function updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
    const db = await dbPromise;
    const existing = await db.get('messages', messageId);

    if (!existing) {
        throw new Error('Message not found');
    }

    const updated: Message = {
        ...existing,
        ...updates,
    };

    await db.put('messages', updated);
    return updated;
}

export async function deleteMessagesByCharacterId(characterId: string): Promise<void> {
    const db = await dbPromise;
    const tx = db.transaction('messages', 'readwrite');
    const index = tx.store.index('characterId');

    const keys = await index.getAllKeys(characterId);

    await Promise.all(keys.map(async (key) => {
        await tx.store.delete(key);
    }));

    await tx.done;
}

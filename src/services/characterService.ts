import { dbPromise } from '../db/appDb';
import type { Character } from '../types';

export async function getAllCharacters(): Promise<Character[]> {
    const db = await dbPromise;
    return db.getAll('characters');
}

export async function getCharacterById(id: string): Promise<Character | undefined> {
    const db = await dbPromise;
    return db.get('characters', id);
}

export async function saveCharacter(character: Character): Promise<Character> {
    const db = await dbPromise;
    const now = Date.now();

    const data: Character = {
        ...character,
        updatedAt: now,
        createdAt: character.createdAt || now,
    };

    await db.put('characters', data);
    return data;
}

export async function deleteCharacter(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete('characters', id);
}

import { describe, it, expect, beforeEach } from 'vitest';
import { dbPromise } from '../src/db/appDb';
import { 
    getAllCharacters, 
    getCharacterById, 
    saveCharacter, 
    deleteCharacter 
} from '../src/services/characterService';
import type { Character } from '../src/types';

describe('CharacterService', () => {
    beforeEach(async () => {
        const db = await dbPromise;
        await db.clear('characters');
    });

    const dummyChar: Character = {
        id: 'char_1',
        name: 'Luna',
        avatar: '🌙',
        description: 'Test char',
        personality: 'Calm',
        scenario: 'Room',
        firstMessage: 'Hello',
    };

    it('starts with an empty character list', async () => {
        const chars = await getAllCharacters();
        expect(chars).toEqual([]);
    });

    it('saves and retrieves a character', async () => {
        const saved = await saveCharacter(dummyChar);
        expect(saved.id).toBe('char_1');
        expect(saved.createdAt).toBeDefined();
        expect(saved.updatedAt).toBeDefined();

        const fetched = await getCharacterById('char_1');
        expect(fetched?.name).toBe('Luna');
    });

    it('gets all characters', async () => {
        await saveCharacter(dummyChar);
        await saveCharacter({ ...dummyChar, id: 'char_2', name: 'Sola' });

        const chars = await getAllCharacters();
        expect(chars.length).toBe(2);
    });

    it('updates an existing character', async () => {
        await saveCharacter(dummyChar);
        
        await saveCharacter({ ...dummyChar, name: 'Luna Updated' });
        
        const fetched = await getCharacterById('char_1');
        expect(fetched?.name).toBe('Luna Updated');
    });

    it('deletes a character', async () => {
        await saveCharacter(dummyChar);
        await deleteCharacter('char_1');

        const fetched = await getCharacterById('char_1');
        expect(fetched).toBeUndefined();

        const chars = await getAllCharacters();
        expect(chars.length).toBe(0);
    });
});

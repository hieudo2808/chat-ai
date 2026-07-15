import { useState, useEffect } from 'react';
import type { Character } from '~/types';
import { createId } from '~/utils/id';
import { getAllCharacters, saveCharacter as dbSaveCharacter, deleteCharacter as dbDeleteCharacter } from '~/services/characterService';



export function useCharacters() {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
    const [isCharacterEditorOpen, setIsCharacterEditorOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getAllCharacters();
                if (data.length > 0) {
                    setSelectedCharacterId(data[0].id);
                }
                setCharacters(data);
                setIsLoaded(true);
            } catch (err) {
                console.error('Failed to load characters', err);
                setIsLoaded(true);
            }
        }
        loadData();
    }, []);

    const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

    const saveCharacter = async (characterData: Character): Promise<Character> => {
        let newOrUpdatedChar: Character;
        if (characterData.id) {
            newOrUpdatedChar = await dbSaveCharacter(characterData);
            setCharacters((prev) => prev.map((char) => (char.id === newOrUpdatedChar.id ? newOrUpdatedChar : char)));
        } else {
            newOrUpdatedChar = await dbSaveCharacter({
                ...characterData,
                id: createId(),
            });
            setCharacters((prev) => [...prev, newOrUpdatedChar]);
            setSelectedCharacterId(newOrUpdatedChar.id);
        }
        return newOrUpdatedChar;
    };

    const importCharacter = async (importedCharacter: Character): Promise<Character> => {
        const newCharacter = await dbSaveCharacter(importedCharacter);

        setCharacters((prev) => [...prev, newCharacter]);
        setSelectedCharacterId(newCharacter.id);
        return newCharacter;
    };

    const deleteCharacter = async (id: string): Promise<string | null> => {
        const charToDelete = characters.find((c) => c.id === id);
        if (!charToDelete) return null;

        const confirmDelete = window.confirm(`Xóa nhân vật ${charToDelete.name}?`);
        if (!confirmDelete) return null;

        await dbDeleteCharacter(id);

        const nextCharacters = characters.filter((char) => char.id !== id);
        setCharacters(nextCharacters);
        if (nextCharacters.length > 0) {
            setSelectedCharacterId(nextCharacters[0].id);
            return nextCharacters[0].id;
        } else {
            setSelectedCharacterId('');
            return null;
        }
    };

    return {
        characters,
        selectedCharacter,
        selectedCharacterId,
        setSelectedCharacterId,
        isCharacterEditorOpen,
        setIsCharacterEditorOpen,
        isImportOpen,
        setIsImportOpen,
        editingCharacter,
        setEditingCharacter,
        saveCharacter,
        importCharacter,
        deleteCharacter,
        isLoaded,
    };
}

/* @vitest-environment jsdom */
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/App';
import { useChat } from '../src/features/chat/hooks/useChat';
import { useModelProfiles } from '../src/features/models/hooks/useModelProfiles';

vi.mock('../src/features/settings/hooks/useSettings', () => ({
    useSettings: vi.fn(() => ({
        settings: {
            id: 'settings_id',
            apiKey: 'settings-api-key',
            baseUrl: 'https://api.openai.com/v1',
            modelName: 'gpt-4o-mini',
            temperature: 0.8,
            maxTokens: 1024,
            topP: 1.0,
            repetitionPenalty: 1.0,
        },
        setSettings: vi.fn(),
    })),
}));

vi.mock('../src/features/characters/hooks/useCharacters', () => ({
    useCharacters: vi.fn(() => ({
        characters: [],
        selectedCharacter: null,
        selectedCharacterId: '',
        setSelectedCharacterId: vi.fn(),
        isCharacterEditorOpen: false,
        setIsCharacterEditorOpen: vi.fn(),
        isImportOpen: false,
        setIsImportOpen: vi.fn(),
        editingCharacter: null,
        setEditingCharacter: vi.fn(),
        saveCharacter: vi.fn(),
        importCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
        isLoaded: true,
    })),
}));

vi.mock('../src/features/chat/hooks/useChat', () => ({
    useChat: vi.fn(() => ({
        currentMessages: [],
        input: '',
        setInput: vi.fn(),
        isStreaming: false,
        handleSend: vi.fn(),
        handleStopStreaming: vi.fn(),
    })),
}));

vi.mock('../src/features/models/hooks/useModelProfiles', () => ({
    useModelProfiles: vi.fn(() => ({
        models: [
            {
                id: 'model-profile-id',
                name: 'Gemini Profile',
                provider: 'openrouter',
                baseUrl: 'https://openrouter.ai/api/v1',
                apiKey: 'gemini-api-key',
                modelName: 'gemini-2.0-flash',
                temperature: 0.5,
                maxTokens: 256,
                topP: 0.9,
                repetitionPenalty: 1.2,
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }
        ],
        isLoaded: true,
    })),
}));

vi.mock('../src/stores/authStore', () => ({
    useAuthStore: vi.fn(() => ({
        checkAuth: vi.fn(),
    })),
}));

describe('App effectiveSettings integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should overwrite settings with the default model profile parameters', () => {
        render(<App />);

        expect(useChat).toHaveBeenCalled();
        const callArgs = vi.mocked(useChat).mock.calls[0];
        const effectiveSettings = callArgs[1];

        // Should use default model profile properties
        expect(effectiveSettings.apiKey).toBe('gemini-api-key');
        expect(effectiveSettings.baseUrl).toBe('https://openrouter.ai/api/v1');
        expect(effectiveSettings.modelName).toBe('gemini-2.0-flash');
        expect(effectiveSettings.temperature).toBe(0.5);
        expect(effectiveSettings.maxTokens).toBe(256);
        expect(effectiveSettings.topP).toBe(0.9);
        expect(effectiveSettings.repetitionPenalty).toBe(1.2);
    });
});

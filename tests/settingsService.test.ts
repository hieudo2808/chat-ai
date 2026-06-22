import { describe, it, expect } from 'vitest';
import { getSettings, saveSettings } from '../src/services/settingsService';

describe('SettingsService', () => {
    it('returns default settings if nothing is saved', async () => {
        const settings = await getSettings();
        expect(settings.id).toBe('ai_settings');
        expect(settings.baseUrl).toBe('https://openrouter.ai/api/v1');
    });

    it('saves and retrieves custom settings', async () => {
        const customSettings = {
            id: 'ai_settings',
            apiKey: 'sk-test-123',
            baseUrl: 'https://api.openai.com/v1',
            modelName: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 500,
            updatedAt: Date.now(),
        };

        await saveSettings(customSettings);
        
        const settings = await getSettings();
        expect(settings.apiKey).toBe('sk-test-123');
        expect(settings.baseUrl).toBe('https://api.openai.com/v1');
        expect(settings.modelName).toBe('gpt-4o-mini');
    });
});

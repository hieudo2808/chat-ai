import { describe, it, expect } from 'vitest';
import { getSettings, saveSettings, DEFAULT_JAILBREAK } from '../src/services/settingsService';

describe('SettingsService', () => {
    it('returns default settings if nothing is saved', async () => {
        const settings = await getSettings();
        expect(settings.id).toBe('ai_settings');
        expect(settings.baseUrl).toBe('https://openrouter.ai/api/v1');
        expect(settings.globalJailbreak).toBe(DEFAULT_JAILBREAK);
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

    it('populates settings with default prompts list if missing', async () => {
        const settings = await getSettings();
        // @ts-ignore - prompts is not in Settings interface yet
        expect(settings.prompts).toBeDefined();
        // @ts-ignore
        expect(settings.prompts).toHaveLength(7);

        // @ts-ignore
        const ids = settings.prompts.map((p: any) => p.id);
        expect(ids).toContain('system_base');
        expect(ids).toContain('description');
        expect(ids).toContain('personality');
        expect(ids).toContain('scenario');
        expect(ids).toContain('examples');
        expect(ids).toContain('jailbreak');
        expect(ids).toContain('system_note');

        // @ts-ignore
        const systemBase = settings.prompts.find((p: any) => p.id === 'system_base');
        expect(systemBase?.role).toBe('system');
        expect(systemBase?.enabled).toBe(true);
        expect(systemBase?.injectionDepth).toBe(100);
    });
});

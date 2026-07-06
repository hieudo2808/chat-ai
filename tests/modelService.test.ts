/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getModelProfiles } from '../src/features/models/services/modelService';
import { dbPromise } from '../src/db/appDb';
import { getSettings } from '../src/services/settingsService';

vi.mock('../src/db/appDb', () => ({
    dbPromise: Promise.resolve({
        getAll: vi.fn(),
        put: vi.fn(),
    }),
}));

vi.mock('../src/services/settingsService', () => ({
    getSettings: vi.fn(),
}));

describe('modelService.getModelProfiles', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should migrate settings including topP and repetitionPenalty when models store is empty', async () => {
        const mockDb = await dbPromise;
        vi.mocked(mockDb.getAll).mockResolvedValueOnce([]); // Empty DB
        
        vi.mocked(getSettings).mockResolvedValueOnce({
            id: 'settings_id',
            apiKey: 'test-api-key',
            baseUrl: 'https://api.openai.com/v1',
            modelName: 'gpt-4',
            temperature: 0.7,
            maxTokens: 512,
            topP: 0.9,
            repetitionPenalty: 1.1,
            updatedAt: 12345,
        });

        const profiles = await getModelProfiles();

        expect(profiles).toHaveLength(1);
        const profile = profiles[0];
        expect(profile.name).toContain('Default Model');
        expect(profile.baseUrl).toBe('https://api.openai.com/v1');
        expect(profile.apiKey).toBe('test-api-key');
        expect(profile.modelName).toBe('gpt-4');
        expect(profile.temperature).toBe(0.7);
        expect(profile.maxTokens).toBe(512);
        
        // These will fail if they are not migrated!
        expect(profile.topP).toBe(0.9);
        expect(profile.repetitionPenalty).toBe(1.1);
        
        expect(mockDb.put).toHaveBeenCalledWith('models', profile);
    });
});

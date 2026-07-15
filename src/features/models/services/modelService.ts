import { dbPromise } from '~/db/appDb';
import type { AiModelProfile } from '~/types';
import { getSettings } from '~/services/settingsService';

export async function getModelProfiles(): Promise<AiModelProfile[]> {
    const db = await dbPromise;
    const models = await db.getAll('models');

    // Migration logic
    if (models.length === 0) {
        const oldSettings = await getSettings();
        if (oldSettings.baseUrl || oldSettings.modelName) {
            const defaultModel: AiModelProfile = {
                id: 'model_default',
                name: 'Default Model (Migrated)',
                provider: 'custom',
                baseUrl: oldSettings.baseUrl || 'https://openrouter.ai/api/v1',
                apiKey: oldSettings.apiKey || '',
                modelName: oldSettings.modelName || 'google/gemini-flash',
                temperature: oldSettings.temperature || 0.8,
                maxTokens: oldSettings.maxTokens || 1024,
                topP: oldSettings.topP ?? 1.0,
                repetitionPenalty: oldSettings.repetitionPenalty ?? 1.0,
                supportsStreaming: true,
                supportsJsonMode: false,
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            await db.put('models', defaultModel);
            return [defaultModel];
        }
    }
    return models;
}

export async function addModelProfile(profile: AiModelProfile): Promise<void> {
    const db = await dbPromise;
    await db.put('models', profile);
}

export async function updateModelProfile(profile: AiModelProfile): Promise<void> {
    const db = await dbPromise;
    profile.updatedAt = Date.now();
    await db.put('models', profile);
}

export async function deleteModelProfile(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete('models', id);
}

export async function setDefaultModel(id: string): Promise<void> {
    const db = await dbPromise;
    const models = await db.getAll('models');
    
    await Promise.all(models.map(async (model) => {
        if (model.id === id && !model.isDefault) {
            model.isDefault = true;
            model.updatedAt = Date.now();
            await db.put('models', model);
        } else if (model.id !== id && model.isDefault) {
            model.isDefault = false;
            model.updatedAt = Date.now();
            await db.put('models', model);
        }
    }));
}

import { dbPromise } from '../db/appDb';
import type { Settings } from '../types';

const SETTINGS_ID = 'ai_settings';

export async function getSettings(): Promise<Settings> {
    const db = await dbPromise;
    const settings = await db.get('settings', SETTINGS_ID);

    return (
        settings || {
            id: SETTINGS_ID,
            apiKey: '',
            baseUrl: 'https://openrouter.ai/api/v1',
            modelName: '',
            temperature: 0.8,
            maxTokens: 1024,
            updatedAt: Date.now(),
        }
    );
}

export async function saveSettings(settings: Settings): Promise<Settings> {
    const db = await dbPromise;

    const data = {
        ...settings,
        id: SETTINGS_ID,
        updatedAt: Date.now(),
    };

    await db.put('settings', data);

    return data;
}

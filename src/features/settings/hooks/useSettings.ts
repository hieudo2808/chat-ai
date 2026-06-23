import { useState, useEffect } from 'react';
import type { Settings } from '~/types';
import { getSettings, saveSettings } from '~/services/settingsService';

const defaultSettings: Settings = {
    id: 'ai_settings',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 1024,
    globalJailbreak: '',
    updatedAt: Date.now(),
};

export function useSettings() {
    const [settings, setSettingsState] = useState<Settings>(defaultSettings);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        getSettings().then((data) => {
            setSettingsState(data);
            setIsLoaded(true);
        }).catch(console.error);
    }, []);

    const setSettings = async (newSettings: Settings) => {
        setSettingsState(newSettings);
        await saveSettings(newSettings);
    };

    return {
        settings,
        setSettings,
        isSettingsOpen,
        setIsSettingsOpen,
        isLoaded,
    };
}

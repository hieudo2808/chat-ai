import { useState, useEffect, useCallback } from 'react';
import type { AiModelProfile } from '~/types';
import * as modelService from '../services/modelService';

export function useModelProfiles() {
    const [models, setModels] = useState<AiModelProfile[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const defaultModel = models.find(m => m.isDefault) || models[0];

    const loadModels = useCallback(async () => {
        try {
            const data = await modelService.getModelProfiles();
            setModels(data);
        } catch (error) {
            console.error('Failed to load models', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadModels();
    }, [loadModels]);

    const addModel = async (profile: Omit<AiModelProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newProfile: AiModelProfile = {
            ...profile,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // If it's the first model, make it default
        if (models.length === 0) {
            newProfile.isDefault = true;
        }

        await modelService.addModelProfile(newProfile);
        
        // If this new profile is marked as default, update the DB so others are not
        if (newProfile.isDefault) {
            await modelService.setDefaultModel(newProfile.id);
        }

        await loadModels();
    };

    const updateModel = async (profile: AiModelProfile) => {
        await modelService.updateModelProfile(profile);
        if (profile.isDefault) {
            await modelService.setDefaultModel(profile.id);
        }
        await loadModels();
    };

    const deleteModel = async (id: string) => {
        await modelService.deleteModelProfile(id);
        
        // If we deleted the default model, we should pick another one as default if any remain
        const remainingModels = models.filter(m => m.id !== id);
        const hasDefault = remainingModels.some(m => m.isDefault);
        if (!hasDefault && remainingModels.length > 0) {
            await modelService.setDefaultModel(remainingModels[0].id);
        }

        await loadModels();
    };

    const setAsDefault = async (id: string) => {
        await modelService.setDefaultModel(id);
        await loadModels();
    };

    return {
        models,
        defaultModel,
        isLoaded,
        addModel,
        updateModel,
        deleteModel,
        setAsDefault,
        reloadModels: loadModels
    };
}

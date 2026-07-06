// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useModelProfiles } from './useModelProfiles';
import * as modelService from '../services/modelService';
import type { AiModelProfile } from '~/types';

vi.mock('../services/modelService', () => ({
    getModelProfiles: vi.fn(),
    addModelProfile: vi.fn(),
    updateModelProfile: vi.fn(),
    deleteModelProfile: vi.fn(),
    setDefaultModel: vi.fn(),
}));

describe('useModelProfiles', () => {
    const mockModels: AiModelProfile[] = [
        {
            id: '1',
            name: 'Model 1',
            provider: 'custom',
            baseUrl: '',
            modelName: '',
            temperature: 0,
            maxTokens: 0,
            supportsStreaming: true,
            supportsJsonMode: false,
            isDefault: true,
            createdAt: 0,
            updatedAt: 0
        },
        {
            id: '2',
            name: 'Model 2',
            provider: 'custom',
            baseUrl: '',
            modelName: '',
            temperature: 0,
            maxTokens: 0,
            supportsStreaming: true,
            supportsJsonMode: false,
            isDefault: false,
            createdAt: 0,
            updatedAt: 0
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should load models on mount', async () => {
        vi.mocked(modelService.getModelProfiles).mockResolvedValue(mockModels);
        
        const { result } = renderHook(() => useModelProfiles());

        // Wait for state update
        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.models).toHaveLength(2);
        expect(result.current.isLoaded).toBe(true);
        expect(result.current.defaultModel?.id).toBe('1');
    });

    it('should set first model as default if deleted default', async () => {
        vi.mocked(modelService.getModelProfiles).mockResolvedValueOnce(mockModels);
        
        const { result } = renderHook(() => useModelProfiles());

        await act(async () => {
            await Promise.resolve();
        });

        vi.mocked(modelService.getModelProfiles).mockResolvedValueOnce([mockModels[1]]);
        
        await act(async () => {
            await result.current.deleteModel('1');
        });

        expect(modelService.deleteModelProfile).toHaveBeenCalledWith('1');
        expect(modelService.setDefaultModel).toHaveBeenCalledWith('2');
    });
});

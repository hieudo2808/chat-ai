/* @vitest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsModal } from '../src/features/settings/components/SettingsModal/SettingsModal';
import type { Settings } from '../src/types';

vi.mock('../src/features/models/hooks/useModelProfiles', () => ({
    useModelProfiles: vi.fn(() => ({
        models: [
            {
                id: 'model-1',
                name: 'Gemini Profile',
                provider: 'openrouter',
                baseUrl: 'https://openrouter.ai/api/v1',
                apiKey: 'key',
                modelName: 'gemini-flash',
                temperature: 0.8,
                maxTokens: 1024,
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }
        ],
        addModel: vi.fn(),
        updateModel: vi.fn(),
        deleteModel: vi.fn(),
        setAsDefault: vi.fn(),
        isLoaded: true,
    })),
}));

const mockSettings: Settings = {
    id: 'ai_settings',
    userName: 'Guest',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 1024,
    updatedAt: Date.now(),
};

describe('SettingsModal', () => {
    it('should render LLM Management tab and switch to it on click', () => {
        render(
            <SettingsModal 
                settings={mockSettings} 
                onClose={vi.fn()} 
                onSave={vi.fn()} 
            />
        );

        // Verify Quản lý LLM tab button is rendered
        const tabButton = screen.getByText('Quản lý LLM');
        expect(tabButton).toBeInTheDocument();

        // Click on tab
        fireEvent.click(tabButton);

        // Verify model management description is displayed
        expect(screen.getByText(/Quản lý kết nối LLM/i)).toBeInTheDocument();
        expect(screen.getByText('Gemini Profile')).toBeInTheDocument();
    });
});

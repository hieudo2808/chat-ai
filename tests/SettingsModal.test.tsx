/* @vitest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsModal } from '../src/features/settings/components/SettingsModal/SettingsModal';
import type { Settings } from '../src/types';

// ModelManagementTab internally uses useModelProfiles, so mock it here
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
    it('renders without crashing and shows Hồ sơ tab', () => {
        render(
            <SettingsModal
                settings={mockSettings}
                onClose={vi.fn()}
                onSave={vi.fn()}
            />
        );

        // LLM Defaults tab is removed — only 3 tabs remain
        expect(screen.getByText('Hồ sơ')).toBeInTheDocument();
        expect(screen.getByText('System Prompts')).toBeInTheDocument();
        expect(screen.getByText('Quản lý LLM')).toBeInTheDocument();
        expect(screen.queryByText('LLM Defaults')).not.toBeInTheDocument();
    });

    it('switches to System Prompts tab on click', () => {
        render(
            <SettingsModal
                settings={mockSettings}
                onClose={vi.fn()}
                onSave={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('System Prompts'));
        expect(screen.getByText('Quản lý khối Prompt')).toBeInTheDocument();
    });

    it('switches to Quản lý LLM tab and shows model list', () => {
        render(
            <SettingsModal
                settings={mockSettings}
                onClose={vi.fn()}
                onSave={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('Quản lý LLM'));
        expect(screen.getByText('Gemini Profile')).toBeInTheDocument();
    });
});

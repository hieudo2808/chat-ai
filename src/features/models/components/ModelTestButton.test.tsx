// @vitest-environment jsdom

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelTestButton } from './ModelTestButton';
import * as modelsApi from '../api/modelsApi';
import type { AiModelProfile } from '~/types';

vi.mock('../api/modelsApi', () => ({
    testModelProfile: vi.fn()
}));

const mockProfile: AiModelProfile = {
    id: 'test',
    name: 'Test',
    provider: 'custom',
    baseUrl: 'http://test.com',
    modelName: 'test-model',
    temperature: 0.8,
    maxTokens: 1000,
    supportsStreaming: true,
    supportsJsonMode: false,
    isDefault: false,
    createdAt: 0,
    updatedAt: 0
};

describe('ModelTestButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show success state if API call succeeds', async () => {
        vi.mocked(modelsApi.testModelProfile).mockResolvedValue(true);

        render(<ModelTestButton model={mockProfile} />);
        
        const button = screen.getByText('Test Connection');
        fireEvent.click(button);

        expect(screen.getByText('Testing...')).toBeInTheDocument();
        expect(modelsApi.testModelProfile).toHaveBeenCalledWith(mockProfile);

        await waitFor(() => {
            expect(screen.getByText('Success')).toBeInTheDocument();
        });
    });

    it('should show error state if API call fails', async () => {
        vi.mocked(modelsApi.testModelProfile).mockRejectedValue(new Error('Failed'));

        render(<ModelTestButton model={mockProfile} />);
        
        const button = screen.getByText('Test Connection');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Failed')).toBeInTheDocument();
        });
    });
});

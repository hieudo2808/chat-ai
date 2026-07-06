// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCharacterGeneration } from './useCharacterGeneration';
import * as api from '../api/characterGenerationApi';


vi.mock('../api/characterGenerationApi');

describe('useCharacterGeneration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with correct default state', () => {
        const { result } = renderHook(() => useCharacterGeneration());
        
        expect(result.current.idea).toBe('');
        expect(result.current.state.streamStatus).toBe('idle');
        expect(result.current.canGenerate).toBe(false); // Because idea is empty
    });

    it('should allow generation when idea is not empty', () => {
        const { result } = renderHook(() => useCharacterGeneration());
        
        act(() => {
            result.current.setIdea('A cool character');
        });

        expect(result.current.idea).toBe('A cool character');
        expect(result.current.canGenerate).toBe(true);
    });

    it('should start generation and update state', async () => {
        const mockApi = vi.spyOn(api, 'generateCharacterStream').mockImplementation(async ({ onEvent }) => {
            onEvent({ type: 'stream_started', seq: 1, streamId: 'test-stream' });
            onEvent({ type: 'field_delta', seq: 2, path: 'name', delta: 'Bob' });
            onEvent({ type: 'field_done', seq: 3, path: 'name', value: 'Bob' });
            onEvent({ type: 'done', seq: 4 });
        });

        const { result } = renderHook(() => useCharacterGeneration());
        
        act(() => {
            result.current.setIdea('A cool character');
        });

        await act(async () => {
            await result.current.startGeneration({
                apiKey: 'test',
                baseUrl: 'test',
                modelName: 'test',
            });
        });

        expect(mockApi).toHaveBeenCalled();
        expect(result.current.state.streamStatus).toBe('done');
        expect(result.current.state.fields.name.value).toBe('Bob');
        expect(result.current.canSave).toBe(true); // Since stream is done and name is not empty
    });

    it('should handle cancel generation', () => {
        const { result } = renderHook(() => useCharacterGeneration());
        
        act(() => {
            result.current.setIdea('A cool character');
        });

        // Mock API that doesn't resolve immediately
        vi.spyOn(api, 'generateCharacterStream').mockImplementation(({ onEvent }) => {
            onEvent({ type: 'stream_started', seq: 1, streamId: 'test-stream' });
            return new Promise(() => {}); // Never resolves
        });

        act(() => {
            result.current.startGeneration({ apiKey: '', baseUrl: '', modelName: '' });
        });

        expect(result.current.state.streamStatus).toBe('streaming');
        expect(result.current.canCancel).toBe(true);

        act(() => {
            result.current.cancelGeneration();
        });

        expect(result.current.state.streamStatus).toBe('cancelled');
    });

    it('should update field when editing', async () => {
        const { result } = renderHook(() => useCharacterGeneration());

        // Stream fake done
        vi.spyOn(api, 'generateCharacterStream').mockImplementation(async ({ onEvent }) => {
            onEvent({ type: 'stream_started', seq: 1, streamId: 'test' });
            onEvent({ type: 'done', seq: 2 });
        });

        act(() => {
            result.current.setIdea('test');
        });

        await act(async () => {
            await result.current.startGeneration({ apiKey: '', baseUrl: '', modelName: '' });
        });

        expect(result.current.state.streamStatus).toBe('done');

        act(() => {
            result.current.updateField('name', 'Alice');
        });

        expect(result.current.state.fields.name.value).toBe('Alice');
    });
});

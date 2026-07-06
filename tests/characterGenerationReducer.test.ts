import { describe, expect, it } from 'vitest';
import { characterGenerationReducer, getInitialState } from '../src/features/character-generation/state/characterGenerationReducer';

describe('characterGenerationReducer', () => {
    it('should handle stream_started', () => {
        const state = getInitialState();
        const newState = characterGenerationReducer(state, {
            type: 'stream_started',
            seq: 1,
            streamId: 'str_123'
        });
        
        expect(newState.streamStatus).toBe('streaming');
        expect(newState.streamId).toBe('str_123');
        expect(newState.seq).toBe(1);
    });

    it('should handle field_delta', () => {
        const state = getInitialState();
        const newState = characterGenerationReducer(state, {
            type: 'field_delta',
            seq: 2,
            path: 'name',
            delta: 'Nguyệt'
        });

        expect(newState.fields.name.value).toBe('Nguyệt');
        expect(newState.fields.name.status).toBe('streaming');

        const state2 = characterGenerationReducer(newState, {
            type: 'field_delta',
            seq: 3,
            path: 'name',
            delta: ' Cơ'
        });

        expect(state2.fields.name.value).toBe('Nguyệt Cơ');
    });

    it('should handle field_done', () => {
        const state = getInitialState();
        const newState = characterGenerationReducer(state, {
            type: 'field_done',
            seq: 10,
            path: 'description',
            value: 'Done desc'
        });

        expect(newState.fields.description.value).toBe('Done desc');
        expect(newState.fields.description.status).toBe('done');
    });

    it('should handle array_item', () => {
        const state = getInitialState();
        const newState = characterGenerationReducer(state, {
            type: 'array_item',
            seq: 4,
            path: 'tags',
            index: 0,
            value: 'android'
        });

        expect(newState.fields.tags.value).toEqual(['android']);
        expect(newState.fields.tags.status).toBe('streaming');

        const state2 = characterGenerationReducer(newState, {
            type: 'array_item',
            seq: 5,
            path: 'tags',
            index: 1,
            value: 'cổ trang'
        });

        expect(state2.fields.tags.value).toEqual(['android', 'cổ trang']);
        
        // Test overwrite/update item
        const state3 = characterGenerationReducer(state2, {
            type: 'array_item',
            seq: 6,
            path: 'tags',
            index: 1,
            value: 'cổ'
        });

        expect(state3.fields.tags.value).toEqual(['android', 'cổ']);
    });

    it('should handle done event', () => {
        let state = getInitialState();
        state = characterGenerationReducer(state, { type: 'field_delta', seq: 1, path: 'name', delta: 'abc' });
        
        expect(state.fields.name.status).toBe('streaming');
        
        state = characterGenerationReducer(state, { type: 'done', seq: 2 });
        
        expect(state.streamStatus).toBe('done');
        // Any streaming field with value should become done
        expect(state.fields.name.status).toBe('done');
    });

    it('should handle error event without losing data', () => {
        let state = getInitialState();
        state = characterGenerationReducer(state, { type: 'field_delta', seq: 1, path: 'name', delta: 'abc' });
        
        state = characterGenerationReducer(state, { 
            type: 'error', 
            seq: 2, 
            code: 'ERR', 
            message: 'Oops' 
        });
        
        expect(state.streamStatus).toBe('partial_error');
        expect(state.fields.name.value).toBe('abc'); // Retained data
    });
});

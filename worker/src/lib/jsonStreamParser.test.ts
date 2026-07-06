import { describe, expect, it } from 'vitest';
import { JsonStreamToNdjsonTransformer } from './jsonStreamParser';

describe('JsonStreamToNdjsonTransformer', () => {
    it('should transform full json into field_delta and field_done events', async () => {
        const transformer = new JsonStreamToNdjsonTransformer('stream_1');
        
        const chunks = [
            '{"name": "Ng',
            'uyệt", "description"',
            ': "Một an',
            'droid"}'
        ];

        const events: { type: string; path?: string; delta?: string; index?: number; value?: string; streamId?: string }[] = [];
        
        for (const chunk of chunks) {
            const evts = transformer.processChunk(chunk) as any[];
            events.push(...evts);
        }

        const doneEvents = transformer.finish() as any[];
        events.push(...doneEvents);

        // We expect stream_started first
        expect(events[0].type).toBe('stream_started');
        expect(events[0].streamId).toBe('stream_1');

        // Verify deltas
        const nameDeltas = events.filter(e => e.type === 'field_delta' && e.path === 'name');
        expect(nameDeltas.map(e => e.delta).join('')).toBe('Nguyệt');

        const descDeltas = events.filter(e => e.type === 'field_delta' && e.path === 'description');
        expect(descDeltas.map(e => e.delta).join('')).toBe('Một android');

        // Verify done
        expect(events.filter(e => e.type === 'field_done').map(e => e.path)).toEqual(expect.arrayContaining(['name', 'description']));
        expect(events.filter(e => e.type === 'done').length).toBe(1);
    });

    it('should handle array_item for tags', () => {
        const transformer = new JsonStreamToNdjsonTransformer('stream_2');
        
        const chunks = [
            '{"tags": ["android',
            '", "cổ ',
            'trang"]}'
        ];

        const events: { type: string; path?: string; delta?: string; index?: number; value?: string; streamId?: string }[] = [];
        
        for (const chunk of chunks) {
            const evts = transformer.processChunk(chunk) as any[];
            events.push(...evts);
        }

        const arrayItems = events.filter(e => e.type === 'array_item');
        expect(arrayItems).toEqual([
            expect.objectContaining({ path: 'tags', index: 0, value: 'android' }),
            expect.objectContaining({ path: 'tags', index: 1, value: 'cổ ' }),
            expect.objectContaining({ path: 'tags', index: 1, value: 'cổ trang' }),
        ]);
    });
});

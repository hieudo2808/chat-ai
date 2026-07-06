import { describe, expect, it, vi } from 'vitest';
import { readNdjsonStream } from '../src/services/streaming/ndjsonStreamReader';

describe('readNdjsonStream', () => {
    it('should parse simple NDJSON stream correctly', async () => {
        const mockEvents = [
            { type: 'start' },
            { type: 'data', value: 'hello' }
        ];
        
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(JSON.stringify(mockEvents[0]) + '\n'));
                controller.enqueue(new TextEncoder().encode(JSON.stringify(mockEvents[1]) + '\n'));
                controller.close();
            }
        });

        const response = new Response(stream);
        const onEvent = vi.fn();

        await readNdjsonStream({ response, onEvent });

        expect(onEvent).toHaveBeenCalledTimes(2);
        expect(onEvent).toHaveBeenNthCalledWith(1, mockEvents[0]);
        expect(onEvent).toHaveBeenNthCalledWith(2, mockEvents[1]);
    });

    it('should handle chunked lines properly', async () => {
        const stream = new ReadableStream({
            start(controller) {
                // First part of the JSON object
                controller.enqueue(new TextEncoder().encode('{"type":"chun'));
                // Second part, plus newline, plus start of next
                controller.enqueue(new TextEncoder().encode('ked"}\n{"type"'));
                // Finish next object
                controller.enqueue(new TextEncoder().encode(':"done"}\n'));
                controller.close();
            }
        });

        const response = new Response(stream);
        const onEvent = vi.fn();

        await readNdjsonStream({ response, onEvent });

        expect(onEvent).toHaveBeenCalledTimes(2);
        expect(onEvent).toHaveBeenNthCalledWith(1, { type: 'chunked' });
        expect(onEvent).toHaveBeenNthCalledWith(2, { type: 'done' });
    });

    it('should ignore empty lines', async () => {
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode('\n\n{"valid":true}\n\n'));
                controller.close();
            }
        });

        const response = new Response(stream);
        const onEvent = vi.fn();

        await readNdjsonStream({ response, onEvent });

        expect(onEvent).toHaveBeenCalledTimes(1);
        expect(onEvent).toHaveBeenCalledWith({ valid: true });
    });

    it('should respect AbortSignal', async () => {
        const controller = new AbortController();
        const stream = new ReadableStream({
            start(ctrl) {
                ctrl.enqueue(new TextEncoder().encode('{"ok":1}\n'));
                setTimeout(() => {
                    if (controller.signal.aborted) {
                        ctrl.close(); // Not standard but for test
                    } else {
                        ctrl.enqueue(new TextEncoder().encode('{"ok":2}\n'));
                        ctrl.close();
                    }
                }, 50);
            }
        });

        const response = new Response(stream);
        const onEvent = vi.fn();

        const promise = readNdjsonStream({ response, onEvent, signal: controller.signal });
        
        // Let event loop run once so the first chunk is read and processed
        await new Promise(resolve => setTimeout(resolve, 10));

        // Abort before second chunk arrives
        controller.abort();
        
        try {
            await promise;
        } catch (e: unknown) {
            expect((e as Error).name).toBe('AbortError');
        }

        expect(onEvent).toHaveBeenCalledTimes(1);
        expect(onEvent).toHaveBeenCalledWith({ ok: 1 });
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createChatCompletion, streamChatCompletion } from '../src/services/llmClient';
import type { Settings } from '../src/types';

describe('LLM Client', () => {
    const validSettings: Settings = {
        id: 'ai_settings',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com/v1',
        modelName: 'test-model',
        temperature: 0.7,
        maxTokens: 100,
        updatedAt: 0,
    };

    const validMessages = [
        { role: 'user' as const, content: 'Hello' }
    ];

    beforeEach(() => {
        vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('throws error if settings are missing or invalid', async () => {
        await expect(createChatCompletion({ settings: undefined as unknown as Settings, messages: validMessages })).rejects.toThrow('AI settings is missing');
        await expect(createChatCompletion({ settings: { ...validSettings, apiKey: '' }, messages: validMessages })).rejects.toThrow('API key is missing');
        await expect(createChatCompletion({ settings: { ...validSettings, baseUrl: '' }, messages: validMessages })).rejects.toThrow('Base URL is missing');
        await expect(createChatCompletion({ settings: { ...validSettings, modelName: '' }, messages: validMessages })).rejects.toThrow('Model name is missing');
    });

    it('sends correct request and parses successful response', async () => {
        // Mock successful fetch
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: 'Hello from AI'
                        }
                    }
                ]
            })
        } as unknown as Response);

        const reply = await createChatCompletion({ settings: validSettings, messages: validMessages });
        
        expect(reply).toBe('Hello from AI');
        expect(global.fetch).toHaveBeenCalledWith('https://api.test.com/v1/chat/completions', expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-key'
            },
            body: expect.stringContaining('"model":"test-model"')
        }));
    });

    it('throws error if API returns HTTP error', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: false,
            status: 401,
            text: async () => JSON.stringify({ error: { message: 'Invalid API key' } })
        } as unknown as Response);

        await expect(createChatCompletion({ settings: validSettings, messages: validMessages })).rejects.toThrow('Invalid API key');
    });

    it('returns empty string if choice is missing', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: []
            })
        } as unknown as Response);

        const reply = await createChatCompletion({ settings: validSettings, messages: validMessages });
        expect(reply).toBe('');
    });

    describe('streamChatCompletion', () => {
        it('throws error if response body is null (no streaming support)', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                body: null
            } as unknown as Response);

            await expect(streamChatCompletion({
                settings: validSettings,
                messages: validMessages,
                onToken: vi.fn()
            })).rejects.toThrow('Streaming is not supported by this provider.');
        });

        it('parses SSE data chunks and calls onToken', async () => {
            const onToken = vi.fn();
            
            // Mock reader
            const mockChunks = [
                new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n'),
                new TextEncoder().encode('data: {"choices":[{"delta":{"content":"lo"}}]}\n\n'),
                new TextEncoder().encode('data: [DONE]\n\n')
            ];
            
            let chunkIndex = 0;
            const mockReader = {
                read: vi.fn().mockImplementation(async () => {
                    if (chunkIndex >= mockChunks.length) {
                        return { done: true, value: undefined };
                    }
                    return { done: false, value: mockChunks[chunkIndex++] };
                }),
                cancel: vi.fn(),
            };

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                body: {
                    getReader: () => mockReader
                }
            } as unknown as Response);

            await streamChatCompletion({
                settings: validSettings,
                messages: validMessages,
                onToken
            });

            expect(onToken).toHaveBeenCalledTimes(2);
            expect(onToken).toHaveBeenNthCalledWith(1, 'Hel');
            expect(onToken).toHaveBeenNthCalledWith(2, 'lo');
        });
    });
});

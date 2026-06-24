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

        it('handles SSE chunk fragmentation correctly using buffer', async () => {
            const onToken = vi.fn();
            
            // Fragmented chunks:
            // Chunk 1 has a broken JSON line at the end
            // Chunk 2 has the rest of the JSON line
            const mockChunks = [
                new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hel'),
                new TextEncoder().encode('lo"}}]}\n\ndata: {"choices":[{"delta":{"content":" World"}}]}\n\ndata: [DONE]\n\n')
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
            expect(onToken).toHaveBeenNthCalledWith(1, 'Hello');
            expect(onToken).toHaveBeenNthCalledWith(2, ' World');
        });

        it('routes to direct Gemini native API when baseUrl contains generativelanguage.googleapis.com', async () => {
            const onToken = vi.fn();
            const geminiSettings = {
                ...validSettings,
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
                modelName: 'gemini-1.5-flash'
            };
            
            const mockChunks = [
                new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"Hi Gemini"}]}}]}\n\n'),
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

            const result = await streamChatCompletion({
                settings: geminiSettings,
                messages: [
                    { role: 'system', content: 'You are an AI' },
                    { role: 'user', content: 'Hello' }
                ],
                onToken
            });

            expect(result).toBe('Hi Gemini');
            expect(onToken).toHaveBeenCalledWith('Hi Gemini');
            
            expect(global.fetch).toHaveBeenCalledWith(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=test-key',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"safetySettings":')
                })
            );
            
            const fetchArgs = vi.mocked(global.fetch).mock.calls[0];
            const requestBody = JSON.parse(fetchArgs[1]?.body as string);
            expect(requestBody.systemInstruction.parts[0].text).toBe('You are an AI');
            expect(requestBody.contents[0].role).toBe('user');
            expect(requestBody.contents[0].parts[0].text).toBe('Hello');
            expect(requestBody.safetySettings[0].threshold).toBe('BLOCK_NONE');
        });

        it('handles interleaved system prompts for Gemini correctly', async () => {
            const onToken = vi.fn();
            const geminiSettings = {
                ...validSettings,
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
                modelName: 'gemini-1.5-flash'
            };
            
            const mockChunks = [
                new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"Hi"}]}}]}\n\n'),
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
                settings: geminiSettings,
                messages: [
                    { role: 'system', content: 'Base instruction' },
                    { role: 'user', content: 'Hello' },
                    { role: 'system', content: 'Interleaved constraint' }
                ],
                onToken
            });
            
            const fetchArgs = vi.mocked(global.fetch).mock.calls[0];
            const requestBody = JSON.parse(fetchArgs[1]?.body as string);
            
            expect(requestBody.systemInstruction.parts[0].text).toBe('Base instruction');
            expect(requestBody.contents.length).toBe(2);
            expect(requestBody.contents[0].role).toBe('user');
            expect(requestBody.contents[0].parts[0].text).toBe('Hello');
            expect(requestBody.contents[1].role).toBe('user');
            expect(requestBody.contents[1].parts[0].text).toBe('[System note: Interleaved constraint]');
        });

        it('supports aborting stream via AbortSignal', async () => {
            const onToken = vi.fn();
            const controller = new AbortController();
            
            let callCount = 0;
            const mockReader = {
                read: vi.fn().mockImplementation(async () => {
                    callCount++;
                    if (callCount > 3) {
                        controller.abort();
                        return { done: true, value: undefined };
                    }
                    return { done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"A"}}]}\n\n') };
                }),
                cancel: vi.fn().mockResolvedValue(undefined),
            };

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                body: {
                    getReader: () => mockReader
                }
            } as unknown as Response);

            try {
                await streamChatCompletion({
                    settings: validSettings,
                    messages: validMessages,
                    onToken,
                    signal: controller.signal
                });
            } catch (err) {
                // Ignore abort error
            }

            expect(mockReader.cancel).toHaveBeenCalled();
        });
    });
});

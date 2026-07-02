/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamChatCompletion } from './llmClient';

describe('llmClient (Worker)', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should call Gemini endpoint if baseUrl indicates Gemini', async () => {
        const mockResponse = {
            ok: true,
            body: {
                getReader: () => {
                    let count = 0;
                    return {
                        read: async () => {
                            if (count === 0) {
                                count++;
                                return {
                                    done: false,
                                    value: new TextEncoder().encode('data: {"candidates": [{"content": {"parts": [{"text": "Hello"}]}}]}\n\n'),
                                };
                            }
                            return { done: true };
                        },
                        releaseLock: () => {},
                        cancel: async () => {},
                    };
                },
            },
        };
        (globalThis.fetch as any).mockResolvedValue(mockResponse);

        const settings = {
            apiKey: 'gemini-key',
            baseUrl: 'https://generativelanguage.googleapis.com',
            modelName: 'gemini-pro',
        };
        const messages = [{ role: 'user' as const, content: 'Hi' }];
        
        let tokenCount = 0;
        const result = await streamChatCompletion({
            settings,
            messages,
            onToken: (token) => {
                expect(token).toBe('Hello');
                tokenCount++;
            }
        });

        expect(result).toBe('Hello');
        expect(tokenCount).toBe(1);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('gemini-pro:streamGenerateContent?alt=sse&key=gemini-key'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
        );
    });

    it('should call OpenAI endpoint if baseUrl is not Gemini', async () => {
        const mockResponse = {
            ok: true,
            body: {
                getReader: () => {
                    let count = 0;
                    return {
                        read: async () => {
                            if (count === 0) {
                                count++;
                                return {
                                    done: false,
                                    value: new TextEncoder().encode('data: {"choices": [{"delta": {"content": "Hi there"}}]}\n\n'),
                                };
                            }
                            return { done: true };
                        },
                        releaseLock: () => {},
                        cancel: async () => {},
                    };
                },
            },
        };
        (globalThis.fetch as any).mockResolvedValue(mockResponse);

        const settings = {
            apiKey: 'openrouter-key',
            baseUrl: 'https://openrouter.ai/api/v1',
            modelName: 'gpt-4',
        };
        const messages = [{ role: 'user' as const, content: 'Hi' }];
        
        let tokenCount = 0;
        const result = await streamChatCompletion({
            settings,
            messages,
            onToken: (token) => {
                expect(token).toBe('Hi there');
                tokenCount++;
            }
        });

        expect(result).toBe('Hi there');
        expect(tokenCount).toBe(1);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            'https://openrouter.ai/api/v1/chat/completions',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer openrouter-key',
                },
            })
        );
    });
});

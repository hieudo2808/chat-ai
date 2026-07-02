import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamChat } from '../src/features/chat/services/chatApi';
import { useAuthStore } from '../src/stores/authStore';

// Mock authStore to return a token
vi.mock('../src/stores/authStore', () => ({
    useAuthStore: {
        getState: vi.fn(() => ({ token: 'mock-token' }))
    }
}));

describe('chatApi', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should send POST request to /chat/stream and process stream', async () => {
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
                                    value: new TextEncoder().encode('Hello stream'),
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

        let received = '';
        await streamChat({
            characterId: 'char1',
            messages: [{ role: 'user', content: 'Hi' }],
            settings: { apiKey: 'key', baseUrl: 'url', modelName: 'model' },
            onToken: (token) => {
                received += token;
            },
        });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/chat/stream'),
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer mock-token',
                },
            })
        );
        expect(received).toBe('Hello stream');
    });

    it('should throw error if fetch fails', async () => {
        const mockResponse = {
            ok: false,
            status: 401,
            text: async () => JSON.stringify({ error: { message: 'Invalid token' } }),
        };
        (globalThis.fetch as any).mockResolvedValue(mockResponse);

        await expect(streamChat({
            characterId: 'char1',
            messages: [{ role: 'user', content: 'Hi' }],
            settings: { apiKey: 'key', baseUrl: 'url', modelName: 'model' },
            onToken: () => {},
        })).rejects.toThrow('Invalid token');
    });
});

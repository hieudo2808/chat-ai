/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleChatStream } from './chat';
import * as jwtLib from '../lib/jwt';
import * as llmClientLib from '../lib/llmClient';

describe('POST /chat/stream', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should return 401 if missing Authorization header', async () => {
        const req = new Request('http://localhost/chat/stream', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const res = await handleChatStream(req, { SECRET: 'secret' } as any);
        expect(res.status).toBe(401);
        
        const data = await res.json();
        expect(data.error.code).toBe('AUTH_MISSING_TOKEN');
    });

    it('should return 401 if token is invalid', async () => {
        vi.spyOn(jwtLib, 'verifyJwt').mockResolvedValue(null);

        const req = new Request('http://localhost/chat/stream', {
            method: 'POST',
            headers: { Authorization: 'Bearer invalid' },
            body: JSON.stringify({}),
        });

        const res = await handleChatStream(req, { SECRET: 'secret' } as any);
        expect(res.status).toBe(401);
        
        const data = await res.json();
        expect(data.error.code).toBe('AUTH_INVALID_TOKEN');
    });

    it('should return 400 if body is invalid', async () => {
        vi.spyOn(jwtLib, 'verifyJwt').mockResolvedValue({ id: 'user1' });

        const req = new Request('http://localhost/chat/stream', {
            method: 'POST',
            headers: { Authorization: 'Bearer valid' },
            body: JSON.stringify({
                // missing settings and messages
            }),
        });

        const res = await handleChatStream(req, { SECRET: 'secret' } as any);
        expect(res.status).toBe(400);
        
        const data = await res.json();
        expect(data.error.code).toBe('INVALID_CHAT_REQUEST');
    });

    it('should forward stream from LLM client if valid', async () => {
        vi.spyOn(jwtLib, 'verifyJwt').mockResolvedValue({ id: 'user1' });

        vi.spyOn(llmClientLib, 'streamChatCompletion').mockImplementation(async ({ onToken }) => {
            onToken('Hello');
            onToken(' World');
            return 'Hello World';
        });

        const req = new Request('http://localhost/chat/stream', {
            method: 'POST',
            headers: { Authorization: 'Bearer valid' },
            body: JSON.stringify({
                characterId: 'char1',
                settings: { apiKey: 'test', baseUrl: 'https://test', modelName: 'test-model' },
                messages: [{ role: 'user', content: 'Hi' }],
            }),
        });

        const res = await handleChatStream(req, { SECRET: 'secret' } as any);
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');

        // Read the stream
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let text = '';
        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                text += decoder.decode(value);
            }
        }
        expect(text).toBe('Hello World');
    });
});

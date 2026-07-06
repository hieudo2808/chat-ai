/* eslint-disable @typescript-eslint/no-explicit-any */
import { verifyJwt } from '../lib/jwt';
import { streamChatCompletion, Settings } from '../lib/llmClient';

export interface Env {
    DB: D1Database;
    JWT_SECRET: string;
}

export async function handleChatStream(request: Request, env: Env): Promise<Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
            error: {
                code: 'AUTH_MISSING_TOKEN',
                message: 'Missing access token.'
            }
        }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const token = authHeader.substring(7);
    const payload = await verifyJwt(token, env.JWT_SECRET);

    if (!payload) {
        return new Response(JSON.stringify({
            error: {
                code: 'AUTH_INVALID_TOKEN',
                message: 'Invalid or expired access token.'
            }
        }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({
            error: { code: 'INVALID_CHAT_REQUEST', message: 'Invalid JSON body' }
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!body || !body.settings || !body.messages || !Array.isArray(body.messages)) {
        return new Response(JSON.stringify({
            error: {
                code: 'INVALID_CHAT_REQUEST',
                message: 'Missing settings or messages in request body.'
            }
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { settings, messages } = body;

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Do not await this so we can stream the response immediately
    streamChatCompletion({
        settings: settings as Settings,
        messages,
        onToken: (token: string) => {
            writer.write(encoder.encode(token));
        }
    }).catch(err => {
        // Log error and close writer
        console.error('Stream error:', err);
    }).finally(() => {
        writer.close();
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked'
        }
    });
}

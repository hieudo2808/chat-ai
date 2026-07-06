/* eslint-disable @typescript-eslint/no-explicit-any */
import { verifyJwt } from '../lib/jwt';
import { streamChatCompletion, Settings } from '../lib/llmClient';
import { getCharacterGenerationSystemPrompt } from '../prompts/characterGenerationPrompt';
import { JsonStreamToNdjsonTransformer } from '../lib/jsonStreamParser';

export interface Env {
    DB: D1Database;
    JWT_SECRET: string;
}

export async function handleCharacterGenerateStream(request: Request, env: Env): Promise<Response> {
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
            error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' }
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!body || !body.settings || !body.idea) {
        return new Response(JSON.stringify({
            error: {
                code: 'INVALID_REQUEST',
                message: 'Missing settings or idea in request body.'
            }
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { settings, idea, language = 'vi' } = body;
    
    // Add json_object flag
    const llmSettings: Settings = {
        ...settings,
        responseFormat: 'json_object'
    };

    const systemPrompt = getCharacterGenerationSystemPrompt(language);
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: idea }
    ];

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // streamId could be generated randomly, but for now just static for MVP
    const streamId = 'gen_' + Date.now().toString(36);
    const transformer = new JsonStreamToNdjsonTransformer(streamId);

    const emitEvents = (events: any[]) => {
        for (const evt of events) {
            writer.write(encoder.encode(JSON.stringify(evt) + '\n'));
        }
    };

    // Do not await this so we can stream the response immediately
    streamChatCompletion({
        settings: llmSettings,
        messages,
        onToken: (token: string) => {
            const events = transformer.processChunk(token);
            if (events.length > 0) {
                emitEvents(events);
            }
        }
    }).then(() => {
        const events = transformer.finish();
        if (events.length > 0) {
            emitEvents(events);
        }
    }).catch(err => {
        console.error('Character generation stream error:', err);
        // Try to emit error event
        try {
            const errEvent = { type: 'error', seq: 99999, code: 'STREAM_ERROR', message: err.message };
            writer.write(encoder.encode(JSON.stringify(errEvent) + '\n'));
        } catch { /* empty */ }
    }).finally(() => {
        writer.close();
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'application/x-ndjson; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    });
}

import { handleGuestLogin, handleAuthMe } from './routes/auth';
import { handleChatStream } from './routes/chat';
import { handleSyncPush, handleSyncPull } from './routes/sync';
export { ChatRoomDO } from './durable_objects/ChatRoomDO';

export interface Env {
    DB: D1Database;
    JWT_SECRET: string;
    [key: string]: any;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        if (url.pathname === '/health' && request.method === 'GET') {
            return new Response(JSON.stringify({ ok: true, service: 'chat-ai-worker', status: 'healthy' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        if (url.pathname === '/auth/guest' && request.method === 'POST') {
            const res = await handleGuestLogin(request, env);
            const newResponse = new Response(res.body, res);
            for (const [k, v] of Object.entries(corsHeaders)) {
                newResponse.headers.set(k, v);
            }
            return newResponse;
        }

        if (url.pathname === '/auth/me' && request.method === 'GET') {
            const res = await handleAuthMe(request, env);
            const newResponse = new Response(res.body, res);
            for (const [k, v] of Object.entries(corsHeaders)) {
                newResponse.headers.set(k, v);
            }
            return newResponse;
        }

        if (url.pathname === '/chat/stream' && request.method === 'POST') {
            const res = await handleChatStream(request, env);
            const newResponse = new Response(res.body, res);
            for (const [k, v] of Object.entries(corsHeaders)) {
                newResponse.headers.set(k, v);
            }
            return newResponse;
        }

        if (url.pathname === '/sync/push' && request.method === 'POST') {
            const res = await handleSyncPush(request, env);
            const newResponse = new Response(res.body, res);
            for (const [k, v] of Object.entries(corsHeaders)) {
                newResponse.headers.set(k, v);
            }
            return newResponse;
        }

        if (url.pathname === '/sync/pull' && request.method === 'GET') {
            const res = await handleSyncPull(request, env);
            const newResponse = new Response(res.body, res);
            for (const [k, v] of Object.entries(corsHeaders)) {
                newResponse.headers.set(k, v);
            }
            return newResponse;
        }

        return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not Found' } }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    },
} satisfies ExportedHandler<any>;

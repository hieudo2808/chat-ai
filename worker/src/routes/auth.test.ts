/* eslint-disable @typescript-eslint/no-explicit-any */
import { env, createExecutionContext, waitOnExecutionContext, applyD1Migrations } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import worker from '../index';
import { verifyJwt } from '../lib/jwt';

describe('POST /auth/guest', () => {
    beforeAll(async () => {
        await applyD1Migrations(env.DB, env.TEST_MIGRATIONS as any);
    });

    it('should generate a guest token, return user data, and save to DB', async () => {
        const request = new Request('http://localhost/auth/guest', { method: 'POST' });
        const ctx = createExecutionContext();
        
        const testEnv = { ...env, JWT_SECRET: 'test-secret-key' };
        const response = await worker.fetch(request, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(200);
        const data = await response.json() as any;
        expect(data.token).toBeDefined();
        expect(data.user).toBeDefined();
        expect(data.user.id).toMatch(/^guest_/);

        const decoded = await verifyJwt(data.token, testEnv.JWT_SECRET);
        expect(decoded).toBeTruthy();
        expect(decoded?.sub).toBe(data.user.id);

        const dbUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(data.user.id).first();
        expect(dbUser).toBeDefined();
        expect(dbUser?.type).toBe('guest');
    });
});

describe('GET /auth/me', () => {
    it('should return 401 if token is missing', async () => {
        const request = new Request('http://localhost/auth/me', { method: 'GET' });
        const ctx = createExecutionContext();
        const testEnv = { ...env, JWT_SECRET: 'test-secret-key' };
        
        const response = await worker.fetch(request, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(401);
        const data = await response.json() as any;
        expect(data.error.code).toBe('AUTH_MISSING_TOKEN');
    });

    it('should return 401 if token is invalid', async () => {
        const request = new Request('http://localhost/auth/me', { 
            method: 'GET',
            headers: { 'Authorization': 'Bearer invalid-token-123' }
        });
        const ctx = createExecutionContext();
        const testEnv = { ...env, JWT_SECRET: 'test-secret-key' };
        
        const response = await worker.fetch(request, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(401);
        const data = await response.json() as any;
        expect(data.error.code).toBe('AUTH_INVALID_TOKEN');
    });

    it('should return 200 and user data if token is valid', async () => {
        const testEnv = { ...env, JWT_SECRET: 'test-secret-key' };
        
        // 1. Tạo token hợp lệ qua /auth/guest
        const loginReq = new Request('http://localhost/auth/guest', { method: 'POST' });
        const loginCtx = createExecutionContext();
        const loginRes = await worker.fetch(loginReq, testEnv, loginCtx);
        const loginData = await loginRes.json() as any;
        const validToken = loginData.token;

        // 2. Gọi /auth/me với token
        const request = new Request('http://localhost/auth/me', { 
            method: 'GET',
            headers: { 'Authorization': `Bearer ${validToken}` }
        });
        const ctx = createExecutionContext();
        
        const response = await worker.fetch(request, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(200);
        const data = await response.json() as any;
        expect(data.user).toBeDefined();
        expect(data.user.id).toBe(loginData.user.id);
    });
});

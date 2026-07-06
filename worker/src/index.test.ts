/* eslint-disable @typescript-eslint/no-explicit-any */
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from './index';

describe('Worker Auth API', () => {
	it('GET /health should return 200 healthy status', async () => {
		const request = new Request('http://localhost/health');
		const ctx = createExecutionContext();
		
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const data = await response.json() as any;
		expect(data.ok).toBe(true);
		expect(data.status).toBe('healthy');
	});
});

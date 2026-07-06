import { env, applyD1Migrations } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import { ensureUser } from '../repositories/userRepository';

describe('userRepository', () => {
	beforeAll(async () => {
		await applyD1Migrations(env.DB, env.TEST_MIGRATIONS as unknown);
	});

	it('should create a new user if it does not exist', async () => {
		const userId = 'guest-123';
		
		// Ensure user
		await ensureUser(env.DB, userId, 'guest');

		// Check if user was created
		const result = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
		
		expect(result).toBeDefined();
		expect(result?.id).toBe(userId);
		expect(result?.type).toBe('guest');
	});

	it('should not throw error if user already exists', async () => {
		const userId = 'guest-456';
		
		// Create first time
		await ensureUser(env.DB, userId, 'guest');
		
		// Create second time (should ignore/update)
		await ensureUser(env.DB, userId, 'guest');

		const results = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).all();
		
		// Still only 1 record
		expect(results.results.length).toBe(1);
	});
});

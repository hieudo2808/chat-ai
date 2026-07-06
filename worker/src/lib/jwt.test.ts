import { describe, it, expect } from 'vitest';
import { signJwt, verifyJwt } from './jwt';

describe('JWT Utility', () => {
	const secret = 'super-secret-key-12345';
	const payload = { sub: 'guest_123', type: 'guest' as const };

	it('should sign and generate a 3-part string', async () => {
		const token = await signJwt(payload, secret);
		expect(typeof token).toBe('string');
		expect(token.split('.').length).toBe(3);
	});

	it('should verify a valid token and return payload', async () => {
		const token = await signJwt(payload, secret);
		const decoded = await verifyJwt(token, secret);
		expect(decoded).toBeTruthy();
		expect(decoded).toMatchObject(payload);
	});

	it('should return null for an invalid token signature', async () => {
		const token = await signJwt(payload, secret);
		const invalidToken = token.slice(0, -5) + 'wrong'; // Làm hỏng signature
		const decoded = await verifyJwt(invalidToken, secret);
		expect(decoded).toBeNull();
	});
});

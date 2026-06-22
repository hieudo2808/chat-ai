import { describe, it, expect } from 'vitest';

describe('Environment Setup', () => {
    it('has indexedDB available globally (mocked by fake-indexeddb)', () => {
        expect(typeof indexedDB).toBe('object');
        expect(indexedDB).toBeDefined();
    });
});

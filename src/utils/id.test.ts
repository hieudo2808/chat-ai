import { expect, test, describe } from 'vitest';
import { createId } from './id';

describe('ID Utility', () => {
    test('createId should generate unique strings', () => {
        const id1 = createId();
        const id2 = createId();
        
        expect(typeof id1).toBe('string');
        expect(id1.length).toBeGreaterThan(0);
        expect(id1).not.toBe(id2);
    });
});

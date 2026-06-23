import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { normalizeCharacter } from '../src/utils/normalizeCharacter';

describe('normalizeCharacter', () => {
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(1700000000000));
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('maps from tavern v2 format correctly', () => {
        const v2Raw = {
            data: {
                name: 'Tavern Char',
                description: 'A description',
                personality: 'A personality',
                scenario: 'A scenario',
                first_mes: 'Hello there',
                mes_example: 'User: hi\nChar: hi',
                system_prompt: 'System rule',
                extensions: {
                    depth_prompt: {
                        prompt: 'System rule',
                        depth: 4
                    }
                }
            }
        };

        const result = normalizeCharacter(v2Raw);
        
        expect(result.id).toBeDefined();
        expect(result.name).toBe('Tavern Char');
        expect(result.description).toBe('A description');
        expect(result.personality).toBe('A personality');
        expect(result.scenario).toBe('A scenario');
        expect(result.firstMessage).toBe('Hello there');
        expect(result.exampleMessages).toBe('User: hi\nChar: hi');
        expect(result.advancedPrompt).toBe('System rule');
        expect(result.advancedPromptDepth).toBe(4);
        expect(result.createdAt).toBe(1700000000000);
        expect(result.updatedAt).toBe(1700000000000);
    });

    it('maps from flat fallback format correctly', () => {
        const flatRaw = {
            name: 'Flat Char',
            desc: 'Desc',
            greeting: 'Greeting',
            exampleMessages: 'Ex'
        };

        const result = normalizeCharacter(flatRaw);
        
        expect(result.name).toBe('Flat Char');
        expect(result.description).toBe('Desc');
        expect(result.firstMessage).toBe('Greeting');
        expect(result.exampleMessages).toBe('Ex');
    });

    it('provides defaults for missing fields', () => {
        const emptyRaw = {};
        const result = normalizeCharacter(emptyRaw);
        
        expect(result.name).toBe('Unnamed Character');
        expect(result.avatar).toBe('👤');
        expect(result.description).toBe('');
        expect(result.advancedPromptDepth).toBe(0);
    });
});

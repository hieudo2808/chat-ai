import { describe, expect, it } from 'vitest';
import { getCharacterGenerationSystemPrompt } from './characterGenerationPrompt';

describe('characterGenerationPrompt', () => {
    it('should generate system prompt with schema and safety rules', () => {
        const prompt = getCharacterGenerationSystemPrompt('vi');
        
        // Should contain schema requirements
        expect(prompt).toContain('"name": "string');
        expect(prompt).toContain('"description": "string');
        expect(prompt).toContain('"tags": ["string", "string"]');
        expect(prompt).toContain('"exampleDialogues": ["string", "string"]');

        // Should contain safety rules
        expect(prompt.toLowerCase()).toContain('safety');

        // Should specify language
        expect(prompt.toLowerCase()).toContain('vietnamese');
    });

    it('should support english language', () => {
        const prompt = getCharacterGenerationSystemPrompt('en');
        expect(prompt.toLowerCase()).toContain('english');
    });
});

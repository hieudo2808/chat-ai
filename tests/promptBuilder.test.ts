import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildChatMessages } from '../src/services/promptBuilder';
import type { Character, Message } from '../src/types';

describe('PromptBuilder', () => {
    const dummyCharacter: Character = {
        id: 'char_1',
        name: 'Luna',
        avatar: '🌙',
        description: 'A mysterious girl.',
        personality: 'Calm and collected.',
        scenario: 'In a dark room.',
        firstMessage: 'Hello there.',
        exampleMessages: 'User: Hi\nLuna: Hello',
        advancedPrompt: 'Always speak in riddles.',
    };

    describe('buildSystemPrompt', () => {
        it('includes all relevant character fields but skips firstMessage by default', () => {
            const prompt = buildSystemPrompt(dummyCharacter);
            expect(prompt).toContain('Luna');
            expect(prompt).toContain('A mysterious girl.');
            expect(prompt).toContain('Calm and collected.');
            expect(prompt).toContain('In a dark room.');
            expect(prompt).not.toContain('Hello there.');
            expect(prompt).toContain('User: Hi\nLuna: Hello');
            expect(prompt).not.toContain('Always speak in riddles.');
        });

        it('handles missing fields gracefully', () => {
            const minimalChar: Character = {
                id: 'char_2',
                name: 'Bob',
                avatar: 'B',
                description: '',
                personality: '',
                scenario: '',
                firstMessage: '',
            };
            const prompt = buildSystemPrompt(minimalChar);
            expect(prompt).toContain('Bob');
        });
    });

    describe('buildChatMessages', () => {
        it('constructs api messages with system, history, injected prompts, and new message', () => {
            const history: Message[] = [
                { id: '1', characterId: 'char_1', role: 'user', content: 'Msg 1' },
                { id: '2', characterId: 'char_1', role: 'assistant', content: 'Msg 2' },
            ];

            const apiMessages = buildChatMessages({
                character: dummyCharacter,
                history,
                userMessage: 'New User Message'
            });

            expect(apiMessages.length).toBe(5); // system + 2 history + 1 advanced prompt + new user
            expect(apiMessages[0].role).toBe('system');
            expect(apiMessages[0].content).toContain('Luna');
            expect(apiMessages[1].role).toBe('user');
            expect(apiMessages[1].content).toBe('Msg 1');
            expect(apiMessages[2].role).toBe('assistant');
            expect(apiMessages[2].content).toBe('Msg 2');
            expect(apiMessages[3].role).toBe('system');
            expect(apiMessages[3].content).toBe('Always speak in riddles.');
            expect(apiMessages[4].role).toBe('user');
            expect(apiMessages[4].content).toContain('New User Message');
            expect(apiMessages[4].content).toContain('[System note:');
        });

        it('slices history to max 10 messages', () => {
            const history: Message[] = [];
            for (let i = 0; i < 25; i++) {
                history.push({
                    id: `msg_${i}`,
                    characterId: 'char_1',
                    role: i % 2 === 0 ? 'user' : 'assistant',
                    content: `History ${i}`,
                });
            }

            const apiMessages = buildChatMessages({
                character: dummyCharacter,
                history,
                userMessage: ''
            });

            // 1 system + 10 history + 1 advanced prompt (depth 0)
            expect(apiMessages.length).toBe(12);
            // The first history message included should be index 15
            expect(apiMessages[1].content).toBe('History 15');
        });

        it('ignores invalid roles in history', () => {
            const history: Message[] = [
                { id: '1', characterId: 'char_1', role: 'system', content: 'Ignore me' }, // invalid role for history
                { id: '2', characterId: 'char_1', role: 'user', content: 'Valid' },
            ];

            const apiMessages = buildChatMessages({
                character: dummyCharacter,
                history,
                userMessage: ''
            });

            expect(apiMessages.length).toBe(3); // system + 1 valid history + 1 advanced prompt
            expect(apiMessages[1].role).toBe('user');
            expect(apiMessages[1].content).toBe('Valid');
            expect(apiMessages[2].role).toBe('system');
            expect(apiMessages[2].content).toBe('Always speak in riddles.');
        });
    });
});

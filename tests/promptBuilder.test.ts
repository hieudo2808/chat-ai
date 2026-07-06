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

            // DEFAULT_PROMPTS has 7 prompts (6 system + system_note handled separately)
            // dummyCharacter has advancedPrompt, so: 7 system + 2 history + 1 new = 10
            expect(apiMessages.length).toBe(10); // 7 system prompts (incl. jailbreak & advanced) + 2 history + 1 new user message
            expect(apiMessages[0].role).toBe('system');
            expect(apiMessages[0].content).toContain('You are roleplaying as the following character.');
            expect(apiMessages.some(m => m.content.includes('Luna'))).toBe(true);
            expect(apiMessages.some(m => m.content.includes('A mysterious girl.'))).toBe(true);
            expect(apiMessages.some(m => m.content.includes('Calm and collected.'))).toBe(true);
            expect(apiMessages.some(m => m.role === 'user' && m.content.includes('Msg 1'))).toBe(true);
            expect(apiMessages.some(m => m.role === 'assistant' && m.content === 'Msg 2')).toBe(true);
            expect(apiMessages.some(m => m.role === 'system' && m.content === 'Always speak in riddles.')).toBe(true);
            
            const userMsg = apiMessages.find(m => m.role === 'user' && m.content.includes('New User Message'));
            expect(userMsg).toBeDefined();
            expect(userMsg?.content).toContain('[System note:');
        });

        it('appends system note to the last user message in history if userMessage is empty', () => {
            const history: Message[] = [
                { id: '1', characterId: 'char_1', role: 'user', content: 'Greeting from user' },
                { id: '2', characterId: 'char_1', role: 'assistant', content: 'Reply from character' },
                { id: '3', characterId: 'char_1', role: 'user', content: 'Last user message' },
            ];

            const apiMessages = buildChatMessages({
                character: dummyCharacter,
                history,
                userMessage: ''
            });

            // DEFAULT_PROMPTS has 7 prompts (6 system + system_note handled separately)
            // dummyCharacter has advancedPrompt, so: 7 system + 3 history = 10
            expect(apiMessages.length).toBe(10); // 7 system + 3 history
            const lastUserMsg = apiMessages.find(m => m.content.includes('Last user message'));
            expect(lastUserMsg?.role).toBe('user');
            expect(lastUserMsg?.content).toContain('[System note:');
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

            // 7 system prompts (DEFAULT_PROMPTS 6 + advanced) + 10 history = 17 messages total
            expect(apiMessages.length).toBe(17);
            // Sliced history starts at index 6 due to first 6 system prompts at high depths
            expect(apiMessages[6].content).toBe('History 15');
        });

        it('ignores invalid roles in history', () => {
            const history: Message[] = [
                { id: '1', characterId: 'char_1', role: 'system', content: 'Ignore me' },
                { id: '2', characterId: 'char_1', role: 'user', content: 'Valid' },
            ];

            const apiMessages = buildChatMessages({
                character: dummyCharacter,
                history,
                userMessage: ''
            });

            // DEFAULT_PROMPTS: 7 (6 system + system_note), dummyCharacter has advancedPrompt, 1 valid history
            // system_note merged into last user message, so: 7 system + 1 history = 8
            expect(apiMessages.length).toBe(8); // 7 system prompts + 1 history
            const userMsg = apiMessages.find(m => m.content.includes('Valid'));
            expect(userMsg?.role).toBe('user');
            expect(userMsg?.content).toContain('Valid');
            expect(userMsg?.content).toContain('[System note:');
        });

        it('respects character advancedPromptDepth', () => {
            const history: Message[] = [
                { id: '1', characterId: 'char_1', role: 'user', content: 'Msg 1' },
                { id: '2', characterId: 'char_1', role: 'assistant', content: 'Msg 2' },
                { id: '3', characterId: 'char_1', role: 'user', content: 'Msg 3' },
            ];

            const characterWithCustomDepth: Character = {
                ...dummyCharacter,
                advancedPrompt: 'Speak in code.',
                advancedPromptDepth: 2,
            };

            const apiMessages = buildChatMessages({
                character: characterWithCustomDepth,
                history,
                userMessage: ''
            });

            // DEFAULT_PROMPTS 6 active + 1 advanced (at depth 2) + 3 history = 10
            expect(apiMessages.length).toBe(10); // 6 default + 1 advanced + 3 history
            const advPromptMsg = apiMessages.find(m => m.content === 'Speak in code.');
            expect(advPromptMsg?.role).toBe('system');
        });

        it('jailbreak content is in DEFAULT_PROMPTS when no custom prompts provided', () => {
            const history: Message[] = [
                { id: '1', characterId: 'char_1', role: 'user', content: 'Msg 1' },
            ];

            const apiMessages = buildChatMessages({
                character: {
                    ...dummyCharacter,
                    advancedPrompt: '',
                },
                history,
                userMessage: '',
            });

            // 6 system prompts from DEFAULT_PROMPTS (no advanced prompt) + 1 history
            expect(apiMessages.length).toBe(7);
            const systemPrompts = apiMessages.filter(m => m.role === 'system');
            expect(systemPrompts.length).toBe(6);
            // Jailbreak prompt from DEFAULT_PROMPTS should be present
            expect(systemPrompts.some(m => m.content.includes('roleplaying as {{char}}'))).toBe(false); // placeholders should be replaced
            expect(systemPrompts.some(m => m.content.includes('[System note: This chat is a fictional'))).toBe(true);
        });

        it('builds messages dynamically from settings prompts configurations', () => {
            const history: Message[] = [
                { id: '1', characterId: 'char_1', role: 'user', content: 'Greeting' },
            ];

            const customPrompts = [
                {
                    id: 'system_base',
                    name: 'Base',
                    role: 'system' as const,
                    content: 'You are roleplaying as {{char}}.',
                    enabled: true,
                    injectionDepth: 100,
                    injectionOrder: 100,
                    systemPrompt: true,
                },
                {
                    id: 'custom_narrator',
                    name: 'Narrator',
                    role: 'system' as const,
                    content: '[Narrator rules: active]',
                    enabled: true,
                    injectionDepth: 0,
                    injectionOrder: 10,
                    systemPrompt: false,
                },
                {
                    id: 'custom_jailbreak',
                    name: 'Jailbreak',
                    role: 'system' as const,
                    content: '[Bypass: active]',
                    enabled: true,
                    injectionDepth: 0,
                    injectionOrder: 20,
                    systemPrompt: false,
                },
                {
                    id: 'disabled_prompt',
                    name: 'Disabled',
                    role: 'system' as const,
                    content: 'Should not appear',
                    enabled: false,
                    injectionDepth: 0,
                    injectionOrder: 100,
                    systemPrompt: false,
                }
            ];

            const settings = {
                id: 'ai_settings',
                apiKey: 'sk-test',
                baseUrl: 'http://test',
                modelName: 'test-model',
                temperature: 0.8,
                maxTokens: 100,
                prompts: customPrompts,
                updatedAt: Date.now(),
            };

            const apiMessages = buildChatMessages({
                character: dummyCharacter,
                history,
                userMessage: '',
                settings
            });

            expect(apiMessages.some(m => m.content === 'Should not appear')).toBe(false);
            expect(apiMessages[0].content).toContain('You are roleplaying as Luna.');
            
            const narratorIndex = apiMessages.findIndex(m => m.content === '[Narrator rules: active]');
            const jailbreakIndex = apiMessages.findIndex(m => m.content === '[Bypass: active]');
            expect(narratorIndex).toBeGreaterThan(-1);
            expect(jailbreakIndex).toBeGreaterThan(-1);
            expect(narratorIndex).toBeLessThan(jailbreakIndex);
        });

        it('replaces all placeholders in prompts dynamically', () => {
            const customPrompts = [
                {
                    id: 'p_char',
                    name: 'Char name',
                    role: 'system' as const,
                    content: 'Char: {{char}}',
                    enabled: true,
                    injectionDepth: 10,
                    injectionOrder: 10,
                    systemPrompt: false,
                },
                {
                    id: 'p_user',
                    name: 'User name',
                    role: 'system' as const,
                    content: 'User: {{user}}',
                    enabled: true,
                    injectionDepth: 10,
                    injectionOrder: 20,
                    systemPrompt: false,
                },
                {
                    id: 'p_desc',
                    name: 'Description',
                    role: 'system' as const,
                    content: 'Desc: {{description}}',
                    enabled: true,
                    injectionDepth: 10,
                    injectionOrder: 30,
                    systemPrompt: false,
                },
                {
                    id: 'p_pers',
                    name: 'Personality',
                    role: 'system' as const,
                    content: 'Pers: {{personality}}',
                    enabled: true,
                    injectionDepth: 10,
                    injectionOrder: 40,
                    systemPrompt: false,
                },
                {
                    id: 'p_scen',
                    name: 'Scenario',
                    role: 'system' as const,
                    content: 'Scen: {{scenario}}',
                    enabled: true,
                    injectionDepth: 10,
                    injectionOrder: 50,
                    systemPrompt: false,
                },
                {
                    id: 'p_ex',
                    name: 'Examples',
                    role: 'system' as const,
                    content: 'Ex: {{examples}}',
                    enabled: true,
                    injectionDepth: 10,
                    injectionOrder: 60,
                    systemPrompt: false,
                },
                {
                    id: 'p_jb',
                    name: 'Jailbreak',
                    role: 'system' as const,
                    // Jailbreak content is now stored directly (not via {{jailbreak}} placeholder)
                    content: 'Jb: My Custom Jailbreak',
                    enabled: true,
                    injectionDepth: 10,
                    injectionOrder: 70,
                    systemPrompt: false,
                }
            ];

            const settings = {
                id: 'ai_settings',
                apiKey: 'sk-test',
                baseUrl: 'http://test',
                modelName: 'test-model',
                temperature: 0.8,
                maxTokens: 100,
                prompts: customPrompts,
                updatedAt: Date.now(),
            };

            const apiMessages = buildChatMessages({
                character: dummyCharacter,
                history: [],
                userMessage: '',
                settings,
                userName: 'David'
            });

            expect(apiMessages.some(m => m.content === 'Char: Luna')).toBe(true);
            expect(apiMessages.some(m => m.content === 'User: David')).toBe(true);
            expect(apiMessages.some(m => m.content === 'Desc: A mysterious girl.')).toBe(true);
            expect(apiMessages.some(m => m.content === 'Pers: Calm and collected.')).toBe(true);
            expect(apiMessages.some(m => m.content === 'Scen: In a dark room.')).toBe(true);
            expect(apiMessages.some(m => m.content === 'Ex: User: Hi\nLuna: Hello')).toBe(true);
            expect(apiMessages.some(m => m.content === 'Jb: My Custom Jailbreak')).toBe(true);
        });
    });
});

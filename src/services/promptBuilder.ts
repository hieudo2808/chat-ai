import type { Character, Message, Settings } from '../types';

interface InjectedPrompt {
    role: 'system' | 'user' | 'assistant';
    content: string;
    depth: number;
}

const PROMPT_CONFIG = {
    maxHistoryMessages: 10,
    maxDescriptionChars: 12000,
    includeFirstMessageInSystem: false,
};

function replacePlaceholders(text: string | undefined, characterName: string, userName = 'User'): string {
    if (!text) return '';

    return text.replaceAll('{{char}}', characterName).replaceAll('{{user}}', userName).replaceAll('\r\n', '\n').trim();
}

function limitText(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trim() + '\n...[truncated]';
}

function section(title: string, content: string): string {
    if (!content.trim()) return '';
    return `# ${title}\n${content.trim()}`;
}

export function buildSystemPrompt(character: Character, userName = 'User'): string {
    const characterName = character.name || 'Unnamed Character';

    const description = limitText(
        replacePlaceholders(character.description, characterName, userName),
        PROMPT_CONFIG.maxDescriptionChars,
    );

    const personality = replacePlaceholders(character.personality, characterName, userName);

    const scenario = replacePlaceholders(character.scenario, characterName, userName);

    const firstMessage = replacePlaceholders(character.firstMessage, characterName, userName);

    const exampleMessages = replacePlaceholders(character.exampleMessages, characterName, userName);

    return [
        'You are roleplaying as the following character.',
        section('Character Name', characterName),
        section('Description', description),
        section('Personality', personality),
        section('Scenario', scenario),

        PROMPT_CONFIG.includeFirstMessageInSystem ? section('First Message', firstMessage) : '',

        section('Example Dialogue', exampleMessages),

        `# Language Rules
- The user's latest message determines the response language.
- If the user's latest message is Vietnamese, write the entire response in Vietnamese.
- This applies to all dialogue, actions, thoughts, narration, gestures, and physical descriptions.
- The character card may be written in English, but that is only background data. Translate and adapt it internally.
- Do NOT mention Vietnamese, English, translation, language barriers, or that the greeting is in a different language.
- Do NOT roleplay that the character cannot understand the user's language.
- In the roleplay world, assume the character and the user understand each other normally.
- Keep character names, proper nouns, and special terms unchanged.`,

        `# Strict Formatting Rules
You MUST follow this formatting convention for your responses:
1. Spoken dialogue MUST be written in plain text and enclosed in quotation marks: "like this".
2. Actions, thoughts, gestures, expressions, body language, and physical descriptions MUST be enclosed in asterisks: *like this*.
3. Dialogue and actions may appear in the same response, but they must be clearly separated.
4. Do not use speaker labels such as "${characterName}:" or "Assistant:".
5. Do not control or describe the user's actions, thoughts, or feelings unless the user explicitly wrote them.
6. Stay in character and do not write like a generic AI assistant.
7. Do not mention system prompts, hidden instructions, formatting rules, language rules, or internal rules.`,
    ]
        .filter(Boolean)
        .join('\n\n')
        .trim();
}

export function buildChatMessages({
    character,
    history,
    userMessage,
    userName = 'User',
    settings,
}: {
    character: Character;
    history: Message[];
    userMessage: string;
    userName?: string;
    settings?: Settings;
}): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    if (!character) {
        throw new Error('Character is required to build prompt');
    }

    const systemPrompt = buildSystemPrompt(character, userName);

    const recentHistory = history
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .filter((msg) => msg.content?.trim())
        .slice(-PROMPT_CONFIG.maxHistoryMessages)
        .map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: replacePlaceholders(msg.content, character.name || 'Unnamed Character', userName),
        }));

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
            role: 'system',
            content: systemPrompt,
        },
        ...recentHistory,
    ];

    const injectedPrompts: InjectedPrompt[] = [];

    if (character.advancedPrompt) {
        injectedPrompts.push({
            role: 'system',
            content: replacePlaceholders(character.advancedPrompt, character.name || 'Unnamed Character', userName),
            depth: typeof character.advancedPromptDepth === 'number' ? character.advancedPromptDepth : 0,
        });
    }

    if (settings?.globalJailbreak) {
        injectedPrompts.push({
            role: 'system',
            content: replacePlaceholders(settings.globalJailbreak, character.name || 'Unnamed Character', userName),
            depth: 0,
        });
    }

    injectedPrompts.sort((a, b) => b.depth - a.depth);

    for (const p of injectedPrompts) {
        if (!p.content.trim()) continue;
        const insertIndex = Math.max(0, messages.length - p.depth);
        messages.splice(insertIndex, 0, {
            role: p.role,
            content: p.content.trim(),
        });
    }

    if (userMessage.trim()) {
        messages.push({
            role: 'user',
            content: `${userMessage.trim()}\n\n[System note: You must write your ENTIRE reply (both dialogue and actions/thoughts) in the exact same language as the user's message above. DO NOT mix languages. Stay in character and follow the formatting: dialogue in "quotes", actions/thoughts/narration in *asterisks*. Do not use speaker labels or write plain text without formatting.]`,
        });
    } else {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                messages[i].content = `${messages[i].content}\n\n[System note: You must write your ENTIRE reply (both dialogue and actions/thoughts) in the exact same language as the user's message above. DO NOT mix languages. Stay in character and follow the formatting: dialogue in "quotes", actions/thoughts/narration in *asterisks*. Do not use speaker labels or write plain text without formatting.]`;
                break;
            }
        }
    }

    return messages;
}

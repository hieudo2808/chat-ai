import type { Character, Message, Settings, PromptConfig } from '../types';
import { DEFAULT_PROMPTS } from './settingsService';

const PROMPT_CONFIG = {
    maxHistoryMessages: 10,
    maxDescriptionChars: 12000,
    includeFirstMessageInSystem: false,
};

function replacePlaceholders(
    text: string | undefined,
    characterName: string,
    userName = 'User',
    character?: Character,
    settings?: Settings
): string {
    if (!text) return '';

    return text
        .replaceAll('{{char}}', characterName)
        .replaceAll('{{user}}', userName)
        .replaceAll('{{description}}', character?.description || '')
        .replaceAll('{{personality}}', character?.personality || '')
        .replaceAll('{{scenario}}', character?.scenario || '')
        .replaceAll('{{examples}}', character?.exampleMessages || '')
        .replaceAll('{{jailbreak}}', settings?.globalJailbreak || '')
        .replaceAll('\r\n', '\n')
        .trim();
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
        replacePlaceholders(character.description, characterName, userName, character),
        PROMPT_CONFIG.maxDescriptionChars,
    );

    const personality = replacePlaceholders(character.personality, characterName, userName, character);

    const scenario = replacePlaceholders(character.scenario, characterName, userName, character);

    const firstMessage = replacePlaceholders(character.firstMessage, characterName, userName, character);

    const exampleMessages = replacePlaceholders(character.exampleMessages, characterName, userName, character);

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

    const characterName = character.name || 'Unnamed Character';

    // 1. Gather all active prompts
    const activePrompts: PromptConfig[] = [];
    const promptsSource = settings?.prompts || DEFAULT_PROMPTS;

    // Deep copy to prevent mutating database defaults
    for (const p of promptsSource) {
        if (p.enabled) {
            activePrompts.push({ ...p });
        }
    }

    // Add character advanced prompt if present (backward compatibility)
    if (character.advancedPrompt) {
        activePrompts.push({
            id: 'character_advanced',
            name: 'Chỉ dẫn nâng cao (Nhân vật)',
            role: 'system',
            content: character.advancedPrompt,
            enabled: true,
            injectionDepth: typeof character.advancedPromptDepth === 'number' ? character.advancedPromptDepth : 0,
            injectionOrder: 100,
            systemPrompt: false,
        });
    }

    // Add global jailbreak if settings has it (backward compatibility for tests that don't pass prompts array)
    if (settings?.globalJailbreak && !promptsSource.some((p) => p.id === 'jailbreak')) {
        activePrompts.push({
            id: 'jailbreak',
            name: 'Bộ lọc an toàn',
            role: 'system',
            content: settings.globalJailbreak,
            enabled: true,
            injectionDepth: 0,
            injectionOrder: 100,
            systemPrompt: true,
        });
    }

    // 2. Extract and resolve system_note if enabled
    let systemNoteContent = '';
    const systemNoteIdx = activePrompts.findIndex((p) => p.id === 'system_note');
    if (systemNoteIdx > -1) {
        const p = activePrompts[systemNoteIdx];
        systemNoteContent = replacePlaceholders(p.content, characterName, userName, character, settings);
        activePrompts.splice(systemNoteIdx, 1);
    }

    // 3. Setup history messages (recent history, max 10 messages)
    const recentHistory = history
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .filter((msg) => msg.content?.trim())
        .slice(-PROMPT_CONFIG.maxHistoryMessages)
        .map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: replacePlaceholders(msg.content, characterName, userName, character, settings),
        }));

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [...recentHistory];

    // If there is a new user message, add it to history
    if (userMessage.trim()) {
        messages.push({
            role: 'user',
            content: replacePlaceholders(userMessage.trim(), characterName, userName, character, settings),
        });
    }

    // 4. Inject prompts at depth & order
    // To preserve relative order when multiple prompts map to the same insertion index:
    // We sort prompts by depth ASC (so lower depth processed first)
    // and by order DESC (so higher order/priority processed first)
    // and we calculate the insertion index based on the ORIGINAL messages length.
    const originalLength = messages.length;
    activePrompts.sort((a, b) => {
        if (a.injectionDepth !== b.injectionDepth) {
            return a.injectionDepth - b.injectionDepth;
        }
        return b.injectionOrder - a.injectionOrder;
    });

    for (const prompt of activePrompts) {
        const resolvedContent = replacePlaceholders(prompt.content, characterName, userName, character, settings);
        if (!resolvedContent.trim()) continue;

        // Calculate insert index relative to original length
        const insertIndex = Math.max(0, originalLength - prompt.injectionDepth);
        messages.splice(insertIndex, 0, {
            role: prompt.role,
            content: resolvedContent,
        });
    }

    // 5. Append system note to the last user message if system note is active
    if (systemNoteContent.trim()) {
        let appended = false;
        // Search from end to start for the last user message
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                messages[i].content = `${messages[i].content}\n\n${systemNoteContent}`;
                appended = true;
                break;
            }
        }
        // Fallback: if no user message found in history, inject as a system message at depth 0
        if (!appended) {
            messages.push({
                role: 'system',
                content: systemNoteContent,
            });
        }
    }

    return messages;
}

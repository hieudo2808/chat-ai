import type { Character } from '../types';
import { createId } from './id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeCharacter(raw: any): Character {
    const data = raw.data ?? raw;
    const now = Date.now();

    return {
        id: createId(),

        name: data.name || 'Unnamed Character',

        avatar: data.avatar || data.image || '👤',

        description: data.description || data.desc || '',

        personality: data.personality || '',

        scenario: data.scenario || '',

        firstMessage: data.first_mes || data.firstMessage || data.greeting || '',

        exampleMessages: data.mes_example || data.exampleMessages || '',

        advancedPrompt: data.system_prompt || data.advancedPrompt || data.extensions?.depth_prompt?.prompt || '',

        createdAt: now,
        updatedAt: now,
    };
}

import type { Character } from '../types';
import { createId } from './id';


export function normalizeCharacter(raw: unknown): Character {
    const r = raw as Record<string, unknown>;
    const data = r.data ? (r.data as Record<string, unknown>) : r;
    const now = Date.now();
    const ex = data.extensions as Record<string, Record<string, unknown>> | undefined;

    return {
        id: createId(),

        name: (data.name as string) || 'Unnamed Character',

        avatar: (data.avatar as string) || (data.image as string) || '👤',

        description: (data.description as string) || (data.desc as string) || '',

        personality: (data.personality as string) || '',

        scenario: (data.scenario as string) || '',

        firstMessage: (data.first_mes as string) || (data.firstMessage as string) || (data.greeting as string) || '',

        exampleMessages: (data.mes_example as string) || (data.exampleMessages as string) || '',

        advancedPrompt: (data.system_prompt as string) || (data.advancedPrompt as string) || (ex?.depth_prompt?.prompt as string) || '',

        advancedPromptDepth: typeof ex?.depth_prompt?.depth === 'number'
            ? ex.depth_prompt.depth
            : 0,

        createdAt: now,
        updatedAt: now,
    };
}

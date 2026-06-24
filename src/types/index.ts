export interface Character {
    id: string;
    name: string;
    avatar: string;
    description: string;
    personality: string;
    scenario: string;
    firstMessage: string;
    exampleMessages?: string;
    advancedPrompt?: string;
    advancedPromptDepth?: number;
    createdAt?: number;
    updatedAt?: number;
}

export interface Message {
    id: string;
    characterId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt?: number;
}

export interface PromptConfig {
    id: string;
    name: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    enabled: boolean;
    injectionDepth: number;
    injectionOrder: number;
    systemPrompt: boolean;
}

export interface Settings {
    id: string;
    apiKey: string;
    baseUrl: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
    globalJailbreak?: string;
    topP?: number;
    repetitionPenalty?: number;
    prompts?: PromptConfig[];
    updatedAt: number;
}

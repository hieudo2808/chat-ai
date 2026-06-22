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

export interface Settings {
    id: string;
    apiKey: string;
    baseUrl: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
    updatedAt: number;
}

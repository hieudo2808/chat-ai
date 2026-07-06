export type SyncStatus = 'synced' | 'pending_create' | 'pending_update' | 'pending_delete' | 'sync_error' | 'conflict';

export type SyncMeta = {
    localId: string;
    serverId?: string;
    localUpdatedAt: string;
    serverUpdatedAt?: string;
    syncStatus: SyncStatus;
    syncError?: string;
    version: number;
};

export interface Character extends Partial<SyncMeta> {
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
    appearance?: string;
    speakingStyle?: string;
    tags?: string[];
    createdAt?: number;
    updatedAt?: number;
}

export interface Message extends Partial<SyncMeta> {
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
    userName?: string;
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

export type AiModelProfile = {
    id: string;
    name: string;
    provider: 'openai' | 'openrouter' | 'ollama' | 'lmstudio' | 'custom';
    baseUrl: string;
    apiKey?: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
    topP?: number;
    repetitionPenalty?: number;
    supportsStreaming: boolean;
    supportsJsonMode: boolean;
    isDefault: boolean;
    createdAt: number;
    updatedAt: number;
} & Partial<SyncMeta>;

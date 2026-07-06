import { readNdjsonStream } from '../../../services/streaming/ndjsonStreamReader';
import type { CharacterStreamEvent } from '../state/characterGenerationReducer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export type GenerateCharacterOptions = {
    idea: string;
    language?: 'vi' | 'en';
    settings: {
        apiKey: string;
        baseUrl: string;
        modelName: string;
        temperature?: number;
    };
    onEvent: (event: CharacterStreamEvent) => void;
    signal?: AbortSignal;
};

export async function generateCharacterStream({
    idea,
    language = 'vi',
    settings,
    onEvent,
    signal,
}: GenerateCharacterOptions): Promise<void> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/generate-character/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            idea,
            language,
            settings
        }),
        signal
    });

    if (!response.ok) {
        let errorMsg = `Server error: ${response.status}`;
        try {
            const errBody = await response.json();
            if (errBody.error?.message) {
                errorMsg = errBody.error.message;
            }
        } catch {
            // ignore
        }
        throw new Error(errorMsg);
    }

    await readNdjsonStream<CharacterStreamEvent>({
        response,
        signal,
        onEvent
    });
}

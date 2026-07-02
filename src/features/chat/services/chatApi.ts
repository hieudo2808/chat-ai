import { useAuthStore } from '~/stores/authStore';
import type { Settings } from '~/types';

export type StreamChatParams = {
    characterId: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    settings: Settings;
    onToken: (token: string) => void;
    signal?: AbortSignal;
};

export async function streamChat({
    characterId,
    messages,
    settings,
    onToken,
    signal,
}: StreamChatParams): Promise<void> {
    const { token } = useAuthStore.getState();

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';

    const response = await fetch(`${baseUrl}/chat/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ characterId, messages, settings }),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errJson = JSON.parse(errorText);
            if (errJson.error?.message) {
                errorMessage = errJson.error.message;
            }
        } catch {
            if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
    }

    if (!response.body) {
        throw new Error('Streaming is not supported by the backend.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    if (signal) {
        signal.addEventListener('abort', () => {
            reader.cancel().catch(() => {});
        });
    }

    try {
        while (true) {
            if (signal?.aborted) {
                break;
            }

            const { done, value } = await reader.read();
            if (done) break;

            const textChunk = decoder.decode(value, { stream: true });
            if (textChunk) {
                onToken(textChunk);
            }
        }
    } finally {
        if (typeof reader.releaseLock === 'function') {
            reader.releaseLock();
        }
    }
}

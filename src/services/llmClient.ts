import type { Settings } from '../types';

export async function createChatCompletion({
    settings,
    messages,
}: {
    settings: Settings;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}): Promise<string> {
    validateSettings(settings);

    // Remove any trailing slash from baseUrl
    const baseUrl = settings.baseUrl.replace(/\/$/, '');

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
            model: settings.modelName,
            messages,
            temperature: settings.temperature ?? 0.8,
            max_tokens: settings.maxTokens ?? 1024,
            stream: false,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(parseApiError(errorText, response.status));
    }

    const data = await response.json();

    return data.choices?.[0]?.message?.content || '';
}

function validateSettings(settings: Settings) {
    if (!settings) {
        throw new Error('AI settings is missing');
    }

    if (!settings.apiKey) {
        throw new Error('API key is missing');
    }

    if (!settings.baseUrl) {
        throw new Error('Base URL is missing');
    }

    if (!settings.modelName) {
        throw new Error('Model name is missing');
    }
}

function parseApiError(errorText: string, status: number): string {
    if (!errorText) {
        return `API request failed with status ${status}`;
    }

    try {
        const json = JSON.parse(errorText);
        return json.error?.message || errorText;
    } catch {
        return errorText;
    }
}

export async function streamChatCompletion({
    settings,
    messages,
    onToken,
    signal,
}: {
    settings: Settings;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    onToken: (token: string) => void;
    signal?: AbortSignal;
}): Promise<void> {
    validateSettings(settings);

    const baseUrl = settings.baseUrl.replace(/\/$/, '');

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
            model: settings.modelName,
            messages,
            temperature: settings.temperature ?? 0.8,
            max_tokens: settings.maxTokens ?? 1024,
            stream: true,
        }),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(parseApiError(errorText, response.status));
    }

    if (!response.body) {
        throw new Error('Streaming is not supported by this provider.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.startsWith('data: '));

        for (const line of lines) {
            const data = line.replace('data: ', '');

            if (data === '[DONE]') {
                return;
            }

            try {
                const json = JSON.parse(data);
                const token = json.choices?.[0]?.delta?.content ?? '';

                if (token) {
                    onToken(token);
                }
            } catch {
                // Ignore parse errors for incomplete chunks or invalid json
            }
        }
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

export type Settings = {
    apiKey: string;
    baseUrl: string;
    modelName: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    repetitionPenalty?: number;
};

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
}): Promise<string> {
    validateSettings(settings);

    const isGemini = settings.baseUrl.includes('generativelanguage.googleapis.com');

    if (isGemini) {
        return streamGemini(messages, settings.modelName, settings.apiKey, onToken, settings, signal);
    } else {
        return streamOpenAI(messages, settings.modelName, settings.apiKey, settings.baseUrl, onToken, settings, signal);
    }
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

async function streamGemini(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    model: string,
    apiKey: string,
    onToken: (token: string) => void,
    settings: Settings,
    signal?: AbortSignal
): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const firstHistoryIndex = messages.findIndex((m) => m.role === 'user' || m.role === 'assistant');

    let globalSystemPrompts: string[] = [];
    const historyMsg: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (firstHistoryIndex === -1) {
        globalSystemPrompts = messages.filter((m) => m.role === 'system').map((m) => m.content);
    } else {
        for (let i = 0; i < firstHistoryIndex; i++) {
            if (messages[i].role === 'system') {
                globalSystemPrompts.push(messages[i].content);
            }
        }

        for (let i = firstHistoryIndex; i < messages.length; i++) {
            const m = messages[i];
            if (m.role === 'system') {
                historyMsg.push({
                    role: 'user',
                    parts: [{ text: `[System note: ${m.content}]` }],
                });
            } else {
                historyMsg.push({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }],
                });
            }
        }
    }

    const systemMsgText = globalSystemPrompts.join('\n\n');

    const body: any = {
        contents: historyMsg,
    };

    if (systemMsgText) {
        body.systemInstruction = {
            parts: [{ text: systemMsgText }],
        };
    }

    body.generationConfig = {
        temperature: settings.temperature ?? 0.8,
        maxOutputTokens: settings.maxTokens ?? 1024,
        ...(settings.topP !== undefined ? { topP: settings.topP } : {}),
    };

    body.safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ];

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(parseApiError(errorText, response.status));
    }

    return processSSE(response, onToken, (data) => {
        try {
            const parsed = JSON.parse(data);
            return parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch {
            return '';
        }
    }, signal);
}

async function streamOpenAI(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    model: string,
    apiKey: string,
    customBaseUrl: string,
    onToken: (token: string) => void,
    settings: Settings,
    signal?: AbortSignal
): Promise<string> {
    const baseUrl = customBaseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/chat/completions`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            stream: true,
            temperature: settings.temperature ?? 0.8,
            max_tokens: settings.maxTokens ?? 1024,
            ...(settings.topP !== undefined ? { top_p: settings.topP } : {}),
            ...(settings.repetitionPenalty !== undefined && settings.repetitionPenalty !== 1
                ? { frequency_penalty: settings.repetitionPenalty }
                : {}),
        }),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(parseApiError(errorText, response.status));
    }

    return processSSE(response, onToken, (data) => {
        try {
            const parsed = JSON.parse(data);
            return parsed?.choices?.[0]?.delta?.content || '';
        } catch {
            return '';
        }
    }, signal);
}

async function processSSE(
    response: Response,
    onToken: (token: string) => void,
    extractText: (data: string) => string,
    signal?: AbortSignal
): Promise<string> {
    if (!response.body) throw new Error('Streaming is not supported by this provider.');
    
    // Convert ReadableStream<Uint8Array> to an AsyncIterable or reader
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

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

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;

                const data = trimmed.slice(5).trim();
                if (data === '[DONE]') continue;

                const textChunk = extractText(data);
                if (textChunk) {
                    fullText += textChunk;
                    onToken(textChunk);
                }
            }
        }
    } finally {
        if (typeof reader.releaseLock === 'function') {
            reader.releaseLock();
        }
    }
    return fullText;
}

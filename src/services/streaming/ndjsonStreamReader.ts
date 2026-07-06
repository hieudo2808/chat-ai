export type ReadNdjsonStreamOptions<TEvent> = {
    response: Response;
    signal?: AbortSignal;
    onEvent: (event: TEvent) => void;
};

export async function readNdjsonStream<TEvent>({
    response,
    signal,
    onEvent,
}: ReadNdjsonStreamOptions<TEvent>): Promise<void> {
    if (!response.body) {
        throw new Error('Response body is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            if (signal?.aborted) {
                throw new DOMException('Stream aborted', 'AbortError');
            }

            const { done, value } = await reader.read();

            if (signal?.aborted) {
                throw new DOMException('Stream aborted', 'AbortError');
            }

            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            // The last element in the array is either an empty string (if the chunk ended with a newline)
            // or an incomplete line. We keep it in the buffer for the next chunk.
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed) {
                    try {
                        const event = JSON.parse(trimmed) as TEvent;
                        onEvent(event);
                    } catch (e) {
                        console.error('Failed to parse NDJSON line:', trimmed, e);
                        // Depending on requirements, we can throw or just ignore.
                        // We will ignore and continue streaming for resilience.
                    }
                }
            }
        }

        // Process any remaining buffer at the end of the stream
        const finalTrimmed = buffer.trim();
        if (finalTrimmed) {
            try {
                const event = JSON.parse(finalTrimmed) as TEvent;
                onEvent(event);
            } catch (e) {
                console.error('Failed to parse final NDJSON line:', finalTrimmed, e);
            }
        }
    } finally {
        reader.releaseLock();
    }
}

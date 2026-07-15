export function fixPartialJson(text: string): string {
    let inString = false;
    let escape = false;
    const stack: string[] = [];
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (char === '\\') {
            escape = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (!inString) {
            if (char === '{') stack.push('}');
            else if (char === '[') stack.push(']');
            else if (char === '}' || char === ']') stack.pop();
        }
    }
    
    let fixed = text;
    if (inString) fixed += '"';
    
    // Close remaining brackets
    while (stack.length > 0) {
        fixed += stack.pop();
    }
    
    return fixed;
}

export class JsonStreamToNdjsonTransformer {
    private streamId: string;
    private buffer = '';
    private seq = 1;
    private lastParsedObject: Record<string, any> = {};
    private isFirstChunk = true;

    constructor(streamId: string) {
        this.streamId = streamId;
    }

    processChunk(chunk: string): unknown[] {
        const events: unknown[] = [];
        
        if (this.isFirstChunk) {
            events.push({
                seq: this.seq++,
                type: 'stream_started',
                streamId: this.streamId
            });
            this.isFirstChunk = false;
        }

        this.buffer += chunk;
        
        let parsed: unknown;
        try {
            const fixedJson = fixPartialJson(this.buffer);
            parsed = JSON.parse(fixedJson);
        } catch {
            // Cannot parse yet or invalid chunk, just return
            return events;
        }

        if (parsed && typeof parsed === 'object') {
            const newEvents = this.diffObjects(this.lastParsedObject, parsed as Record<string, any>);
            if (newEvents.length > 0) {
                events.push(...newEvents);
                // deeply copy parsed for next comparison
                this.lastParsedObject = structuredClone(parsed);
            }
        }
        
        return events;
    }

    private diffObjects(oldObj: Record<string, any>, newObj: Record<string, any>): unknown[] {
        const events: unknown[] = [];
        
        for (const key of Object.keys(newObj)) {
            const newVal = newObj[key];
            const oldVal = oldObj[key] || (Array.isArray(newVal) ? [] : '');

            if (typeof newVal === 'string') {
                if (newVal !== oldVal) {
                    if (newVal.startsWith(oldVal)) {
                        const delta = newVal.slice(oldVal.length);
                        events.push({
                            seq: this.seq++,
                            type: 'field_delta',
                            path: key,
                            delta: delta
                        });
                    } else {
                        // Entirely different string (fallback)
                        events.push({
                            seq: this.seq++,
                            type: 'field_delta',
                            path: key,
                            delta: newVal
                        });
                    }
                }
            } else if (Array.isArray(newVal)) {
                const oldArr = oldVal as unknown[];
                for (let i = 0; i < newVal.length; i++) {
                    if (newVal[i] !== oldArr[i]) {
                        events.push({
                            seq: this.seq++,
                            type: 'array_item',
                            path: key,
                            index: i,
                            value: newVal[i]
                        });
                    }
                }
            }
        }
        
        return events;
    }

    finish(): unknown[] {
        const events: unknown[] = [];
        if (this.isFirstChunk) {
            events.push({
                seq: this.seq++,
                type: 'stream_started',
                streamId: this.streamId
            });
            this.isFirstChunk = false;
        }

        // Emit field_done for all string fields in lastParsedObject
        if (this.lastParsedObject) {
            for (const key of Object.keys(this.lastParsedObject)) {
                const val = this.lastParsedObject[key];
                if (typeof val === 'string') {
                    events.push({
                        seq: this.seq++,
                        type: 'field_done',
                        path: key,
                        value: val
                    });
                }
            }
        }

        events.push({
            seq: this.seq++,
            type: 'done'
        });

        return events;
    }
}

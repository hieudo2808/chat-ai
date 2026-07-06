export type StreamFieldState<T> = {
    value: T;
    status: 'pending' | 'streaming' | 'done' | 'error';
    error?: string;
};

export type CharacterGenerationState = {
    streamId?: string;
    seq: number;
    streamStatus: 'idle' | 'starting' | 'streaming' | 'done' | 'partial_error' | 'cancelled';
    fields: {
        name: StreamFieldState<string>;
        description: StreamFieldState<string>;
        personality: StreamFieldState<string>;
        scenario: StreamFieldState<string>;
        firstMessage: StreamFieldState<string>;
        appearance: StreamFieldState<string>;
        speakingStyle: StreamFieldState<string>;
        tags: StreamFieldState<string[]>;
        exampleDialogues: StreamFieldState<string[]>;
    };
};

export type CharacterStreamEvent =
    | { seq: number; type: 'stream_started'; streamId: string }
    | { seq: number; type: 'field_delta'; path: keyof CharacterGenerationState['fields']; delta: string }
    | { seq: number; type: 'field_done'; path: keyof CharacterGenerationState['fields']; value: unknown }
    | { seq: number; type: 'array_item'; path: 'tags' | 'exampleDialogues'; index: number; value: string }
    | { type: 'done'; seq: number }
    | { type: 'error'; seq: number; code: string; message: string; partial?: Partial<Record<string, unknown>> }
    | { type: 'user_update_field'; path: string; value: unknown }
    | { type: 'reset' };

export function getInitialState(): CharacterGenerationState {
    return {
        seq: 0,
        streamStatus: 'idle',
        fields: {
            name: { value: '', status: 'pending' },
            description: { value: '', status: 'pending' },
            personality: { value: '', status: 'pending' },
            scenario: { value: '', status: 'pending' },
            firstMessage: { value: '', status: 'pending' },
            appearance: { value: '', status: 'pending' },
            speakingStyle: { value: '', status: 'pending' },
            tags: { value: [], status: 'pending' },
            exampleDialogues: { value: [], status: 'pending' },
        }
    };
}

export function characterGenerationReducer(
    state: CharacterGenerationState,
    event: CharacterStreamEvent
): CharacterGenerationState {
    const newState = { ...state, seq: 'seq' in event ? event.seq : state.seq };

    switch (event.type) {
        case 'stream_started':
            newState.streamId = event.streamId;
            newState.streamStatus = 'streaming';
            break;

        case 'field_delta': {
            const field = state.fields[event.path];
            if (field && typeof field.value === 'string') {
                newState.fields = {
                    ...state.fields,
                    [event.path]: {
                        ...field,
                        value: field.value + event.delta,
                        status: 'streaming'
                    }
                };
            }
            break;
        }

        case 'field_done': {
            const field = state.fields[event.path];
            if (field) {
                newState.fields = {
                    ...state.fields,
                    [event.path]: {
                        ...field,
                        value: event.value,
                        status: 'done'
                    }
                };
            }
            break;
        }

        case 'array_item': {
            const field = state.fields[event.path];
            if (field && Array.isArray(field.value)) {
                const newArray = [...field.value];
                newArray[event.index] = event.value;
                newState.fields = {
                    ...state.fields,
                    [event.path]: {
                        ...field,
                        value: newArray,
                        status: 'streaming' // stays streaming until done event
                    }
                };
            }
            break;
        }

        case 'done':
            newState.streamStatus = 'done';
            // Mark any streaming fields as done
            newState.fields = { ...state.fields };
            for (const key of Object.keys(newState.fields) as Array<keyof CharacterGenerationState['fields']>) {
                const field = newState.fields[key];
                if (field.status === 'streaming') {
                    newState.fields[key] = { ...field, status: 'done' } as never;
                }
            }
            break;

        case 'error':
            if (event.code === 'CANCELLED') {
                newState.streamStatus = 'cancelled';
            } else {
                newState.streamStatus = 'partial_error';
            }
            // Errors don't erase existing fields data
            break;
            
        case 'user_update_field': {
            const fieldKey = event.path as keyof typeof state.fields;
            if (newState.fields[fieldKey]) {
                newState.fields = {
                    ...newState.fields,
                    [fieldKey]: {
                        ...newState.fields[fieldKey],
                        value: (event as unknown as { value: string | string[] }).value
                    }
                };
            }
            break;
        }
        
        case 'reset':
            return getInitialState();
    }

    return newState;
}

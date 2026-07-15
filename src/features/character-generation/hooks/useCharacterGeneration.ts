import { useReducer, useState, useRef } from 'react';
import { characterGenerationReducer, getInitialState } from '../state/characterGenerationReducer';
import { generateCharacterStream } from '../api/characterGenerationApi';
import type { GenerateCharacterOptions } from '../api/characterGenerationApi';
import type { Character } from '~/types';

export const useCharacterGeneration = () => {
    const [idea, setIdea] = useState('');
    const [state, dispatch] = useReducer(characterGenerationReducer, getInitialState());
    const abortControllerRef = useRef<AbortController | null>(null);

    const canGenerate = state.streamStatus !== 'streaming' && idea.trim().length > 0;
    const canCancel = state.streamStatus === 'streaming';
    const canEdit = state.streamStatus === 'done' || state.streamStatus === 'partial_error' || state.streamStatus === 'cancelled';
    const canSave = canEdit && state.fields.name.value.length > 0;

    const startGeneration = async (settings: GenerateCharacterOptions['settings'], language: 'vi' | 'en' = 'vi') => {
        if (!canGenerate) return;

        // Reset state before starting
        dispatch({ type: 'stream_started', seq: 0, streamId: 'new-stream' });

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            await generateCharacterStream({
                idea,
                language,
                settings,
                onEvent: (event) => {
                    dispatch(event);
                },
                signal: abortController.signal
            });
            abortControllerRef.current = null;
        } catch (error: unknown) {
            if ((error as Error).name === 'AbortError') {
                // Handled implicitly or by user action
            } else {
                dispatch({ 
                    type: 'error', 
                    seq: Date.now(), 
                    code: 'STREAM_ERROR', 
                    message: (error as Error).message || 'Stream error',
                    partial: {} // the reducer keeps current state
                });
            }
            abortControllerRef.current = null;
        }
    };

    const cancelGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        dispatch({ type: 'error', seq: Date.now(), code: 'CANCELLED', message: 'Cancelled by user', partial: {} });
    };

    const updateField = (path: string, value: unknown) => {
        if (!canEdit) return;
        // Tái sử dụng reducer logic bằng cách dispatch custom action,
        // Nhưng tạm thời reducer chưa có USER_UPDATE_FIELD. 
        // Thay vào đó ta dispatch 1 delta dỏm để lấp liếm hoặc update qua state wrapper?
        // Đã sửa reducer ở Sprint 3: reducer không support USER_UPDATE_FIELD. 
        // Phải bắn event giả hoặc xử lý qua wrapper.
        // Hướng chuẩn nhất là gọi dispatch một event mới (nhưng giả).
        dispatch({
            type: 'user_update_field',
            path,
            value
        });
    };

    const discardDraft = () => {
        setIdea('');
        // Gửi một action giả để reset.
        dispatch({ type: 'stream_started', seq: 0, streamId: '' });
        dispatch({ type: 'error', seq: 1, code: 'RESET', message: 'Reset', partial: {} }); 
        // Hacky, tốt nhất là gọi 1 action reset thật.
        dispatch({ type: 'reset' });
    };

    const getDraftAsCharacter = (): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> => {
        return {
            name: state.fields.name.value as string,
            avatar: '🤖', // default
            description: state.fields.description.value as string,
            personality: state.fields.personality.value as string,
            scenario: state.fields.scenario.value as string,
            firstMessage: state.fields.firstMessage.value as string,
            appearance: state.fields.appearance.value as string,
            speakingStyle: state.fields.speakingStyle.value as string,
            tags: state.fields.tags.value as string[],
            exampleMessages: (state.fields.exampleDialogues.value as string[]).join('\n\n'),
        };
    };

    return {
        idea,
        setIdea,
        state,
        canGenerate,
        canCancel,
        canEdit,
        canSave,
        startGeneration,
        cancelGeneration,
        updateField,
        discardDraft,
        getDraftAsCharacter
    };
};

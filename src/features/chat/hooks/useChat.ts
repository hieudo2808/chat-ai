import { useState, useRef, useEffect } from 'react';
import type { Character, Message } from '~/types';
import { createId } from '~/utils/id';
import { getMessagesByCharacterId, saveMessage } from '~/services/messageService';
import { buildChatMessages, replacePlaceholders } from '~/services/promptBuilder';
import { ChatWsApi } from '~/features/chat/services/chatWsApi';

import type { Settings } from '~/types';

export function useChat(selectedCharacter: Character | undefined, settings: Settings) {
    const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Load messages from DB when character changes
    useEffect(() => {
        if (!selectedCharacter) {
            // Do not call setCurrentMessages([]) directly in effect, wait for a natural state reset or handle elsewhere if needed
            return;
        }

        let isMounted = true;

        async function loadMessages() {
            const msgs = await getMessagesByCharacterId(selectedCharacter!.id);
            if (!isMounted) return;

            if (msgs.length === 0) {
                // Initialize first message
                const firstMsg: Message = {
                    id: createId(),
                    characterId: selectedCharacter!.id,
                    role: 'assistant',
                    content: replacePlaceholders(
                        selectedCharacter!.firstMessage || 'Xin chào.',
                        selectedCharacter!.name,
                        settings.userName || 'User',
                        selectedCharacter!
                    ),
                };
                await saveMessage(firstMsg);
                setCurrentMessages([firstMsg]);
            } else {
                setCurrentMessages(msgs);
            }
        }

        loadMessages();

        return () => {
            isMounted = false;
        };
    }, [selectedCharacter, settings.userName]);

    const handleSend = async (selectedCharacter: Character) => {
        const text = input.trim();
        if (!text || isStreaming || !selectedCharacter) return;

        if (!settings || !settings.apiKey) {
            alert('Vui lòng cấu hình API Key trong Settings trước khi chat.');
            return;
        }

        setInput('');
        setIsStreaming(true);

        const userMessage: Message = {
            id: createId(),
            characterId: selectedCharacter.id,
            role: 'user',
            content: text,
        };

        // Update local state immediately with just user message
        setCurrentMessages((prev) => [...prev, userMessage]);

        let fullReply = '';
        let assistantMessage: Message | null = null;

        try {
            // Save user message to DB
            await saveMessage(userMessage);

            const history = await getMessagesByCharacterId(selectedCharacter.id);

            const apiMessages = buildChatMessages({
                character: selectedCharacter,
                history,
                userMessage: '', // userMessage is already in history, no need to append again
                userName: settings.userName,
                settings,
            });

            assistantMessage = {
                id: createId(),
                characterId: selectedCharacter.id,
                role: 'assistant',
                content: '',
            };

            // Save empty assistant message and update UI
            await saveMessage(assistantMessage);
            setCurrentMessages((prev) => [...prev, assistantMessage as Message]);

            const controller = new AbortController();
            abortControllerRef.current = controller;

            const wsApi = new ChatWsApi(selectedCharacter.id, 'mock-token');

            const abortHandler = () => {
                wsApi.close();
                setCurrentMessages((prev) =>
                    prev.map((msg) =>
                        msg.role === 'assistant' && msg.content === ''
                            ? { ...msg, content: '[Đã dừng phản hồi]' }
                            : msg,
                    ),
                );
            };
            // eslint-disable-next-line react-doctor/effect-needs-cleanup
            controller.signal.addEventListener('abort', abortHandler);

            wsApi.onMessage((data) => {
                const msgData = data as { type: string, content: string, error: string };
                if (msgData.type === 'token') {
                    fullReply += msgData.content;
                    setCurrentMessages((prev) =>
                        prev.map((msg) => (msg.id === assistantMessage!.id ? { ...msg, content: fullReply } : msg)),
                    );
                } else if (msgData.type === 'done') {
                    controller.signal.removeEventListener('abort', abortHandler);
                    saveMessage({ ...assistantMessage!, content: fullReply });
                    setIsStreaming(false);
                    abortControllerRef.current = null;
                    wsApi.close();
                } else if (msgData.type === 'error') {
                    controller.signal.removeEventListener('abort', abortHandler);
                    setIsStreaming(false);
                    throw new Error(msgData.error);
                }
            });

            // Start chat
            wsApi.sendMessage(text, selectedCharacter.id, settings, apiMessages);

            // Wait until done or error, handled in events.
            // But we need to handle AbortController logic if user stops:

            // Note: We're not throwing here, the stream is async and handled by events.
            // Catch below is only for immediate sync errors.
        } catch (error: unknown) {
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null) {
                try {
                    errorMessage = JSON.stringify(error);
                } catch {
                    errorMessage = String(error);
                }
            } else if (error) {
                errorMessage = String(error);
            }

            // If Gemini returns 503, translate it to a friendly message in Vietnamese
            if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('service unavailable')) {
                errorMessage =
                    'Dịch vụ của Google Gemini tạm thời bị quá tải (Lỗi 503). Vui lòng gửi lại tin nhắn hoặc thử lại sau vài giây.';
            }

            const hasPartialContent = fullReply.trim().length > 0;
            const errorDisplay = hasPartialContent
                ? `${fullReply}\n\n[⚠️ Lỗi kết nối giữa chừng: ${errorMessage}]`
                : `Lỗi khi gọi AI: ${errorMessage}`;

            if (assistantMessage) {
                setCurrentMessages((prev) =>
                    prev.map((msg) => (msg.id === assistantMessage!.id ? { ...msg, content: errorDisplay } : msg)),
                );
                await saveMessage({ ...assistantMessage, content: errorDisplay });
            } else {
                const errorMsg: Message = {
                    id: createId(),
                    characterId: selectedCharacter.id,
                    role: 'assistant',
                    content: errorDisplay,
                };
                setCurrentMessages((prev) => [...prev, errorMsg]);
                await saveMessage(errorMsg);
            }
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    const handleStopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    return {
        currentMessages,
        input,
        setInput,
        isStreaming,
        handleSend,
        handleStopStreaming,
    };
}

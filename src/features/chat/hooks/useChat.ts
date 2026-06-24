import { useState, useRef, useEffect } from 'react';
import type { Character, Message } from '~/types';
import { createId } from '~/utils/id';
import { getMessagesByCharacterId, saveMessage } from '~/services/messageService';
import { buildChatMessages } from '~/services/promptBuilder';
import { streamChatCompletion } from '~/services/llmClient';
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
                    content: selectedCharacter!.firstMessage || 'Xin chào.',
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
    }, [selectedCharacter]);

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

            await streamChatCompletion({
                settings,
                messages: apiMessages,
                signal: controller.signal,
                onToken: (token) => {
                    fullReply += token;
                    setCurrentMessages((prev) =>
                        prev.map((msg) => (msg.id === assistantMessage!.id ? { ...msg, content: fullReply } : msg))
                    );
                },
            });

            await saveMessage({ ...assistantMessage, content: fullReply });
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                // User stopped the generation
                setCurrentMessages((prev) =>
                    prev.map((msg) =>
                        msg.role === 'assistant' && msg.content === ''
                            ? { ...msg, content: '[Đã dừng phản hồi]' }
                            : msg
                    )
                );
            } else {
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
                    errorMessage = 'Dịch vụ của Google Gemini tạm thời bị quá tải (Lỗi 503). Vui lòng gửi lại tin nhắn hoặc thử lại sau vài giây.';
                }

                const hasPartialContent = fullReply.trim().length > 0;
                const errorDisplay = hasPartialContent
                    ? `${fullReply}\n\n[⚠️ Lỗi kết nối giữa chừng: ${errorMessage}]`
                    : `Lỗi khi gọi AI: ${errorMessage}`;

                if (assistantMessage) {
                    setCurrentMessages((prev) =>
                        prev.map((msg) => (msg.id === assistantMessage!.id ? { ...msg, content: errorDisplay } : msg))
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
            }
        } finally {
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

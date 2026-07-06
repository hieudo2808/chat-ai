import { useEffect, useRef } from 'react';
import type { Character, Message } from '~/types';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { ChatInput } from '../ChatInput/ChatInput';
import { Avatar } from '~/components/ui/Avatar/Avatar';
import { useNetworkStatus } from '~/features/sync/hooks/useNetworkStatus';
import './ChatPanel.css';

interface ChatPanelProps {
    selectedCharacter: Character;
    messages: Message[];
    input: string;
    isStreaming: boolean;
    onInputChange: (val: string) => void;
    onSend: () => void;
    onStopStreaming: () => void;
    onEditCharacter: () => void;
    onDeleteCharacter: () => void;
    onMenuClick?: () => void;
}

export function ChatPanel({
    selectedCharacter,
    messages,
    input,
    isStreaming,
    onInputChange,
    onSend,
    onStopStreaming,
    onEditCharacter,
    onDeleteCharacter,
    onMenuClick,
}: ChatPanelProps) {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { isOnline } = useNetworkStatus();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <main className="chat-panel">
            <header className="chat-header">
                <div className="chat-character-info">
                    {onMenuClick && (
                        <button className="menu-button" onClick={onMenuClick} aria-label="Mở danh mục">
                            ☰
                        </button>
                    )}
                    <Avatar className="large" urlOrEmoji={selectedCharacter?.avatar} />
                    <div>
                        <h2>{selectedCharacter?.name}</h2>
                    </div>
                </div>

                <div className="chat-header-actions gap-2 flex items-center">
                    <button onClick={onEditCharacter}>Chỉnh sửa</button>
                    <button className="danger" onClick={onDeleteCharacter}>
                        Xóa
                    </button>
                </div>
            </header>

            <section className="chat-body">
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} character={selectedCharacter} />
                ))}

                {isStreaming && (
                    <div className="typing-indicator">
                        Đang gõ<span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </div>
                )}

                <div ref={chatEndRef} />
            </section>

            <ChatInput
                input={input}
                isStreaming={isStreaming}
                onChange={onInputChange}
                onSend={onSend}
                onStop={onStopStreaming}
                disabled={!isOnline}
            />
        </main>
    );
}

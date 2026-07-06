import { useRef, useEffect } from 'react';
import './ChatInput.css';

interface ChatInputProps {
    input: string;
    isStreaming: boolean;
    onChange: (val: string) => void;
    onSend: () => void;
    onStop: () => void;
    disabled?: boolean;
}

export function ChatInput({ input, isStreaming, onChange, onSend, onStop, disabled }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const scrollHeight = el.scrollHeight;
        el.style.height = Math.min(scrollHeight, 160) + 'px';
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() && !disabled) onSend();
        }
    };

    return (
        <footer className="chat-input-area">
            <textarea
                ref={textareaRef}
                placeholder={disabled ? "Offline: Chat is disabled" : "Nhập tin nhắn..."}
                value={input}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={disabled}
            />

            {isStreaming ? (
                <button className="stop-button" onClick={onStop} disabled={disabled && !isStreaming}>
                    ⏹
                </button>
            ) : (
                <button onClick={() => { if (input.trim() && !disabled) onSend() }} disabled={disabled || !input.trim()}>
                    ➤
                </button>
            )}
        </footer>
    );
}

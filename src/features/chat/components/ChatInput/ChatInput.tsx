import { useRef, useEffect } from 'react';
import './ChatInput.css';

interface ChatInputProps {
    input: string;
    isStreaming: boolean;
    onChange: (val: string) => void;
    onSend: () => void;
    onStop: () => void;
}

export function ChatInput({ input, isStreaming, onChange, onSend, onStop }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = '44px';
        const scrollHeight = el.scrollHeight;
        el.style.height = Math.min(scrollHeight, 160) + 'px';
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) onSend();
        }
    };

    return (
        <footer className="chat-input-area">
            <textarea
                ref={textareaRef}
                placeholder="Type your message..."
                value={input}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
            />

            {isStreaming ? (
                <button className="stop-button" onClick={onStop}>
                    ⏹
                </button>
            ) : (
                <button onClick={() => { if (input.trim()) onSend() }}>
                    ➤
                </button>
            )}
        </footer>
    );
}

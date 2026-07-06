import React, { useEffect, useRef } from 'react';

type GeneratedFieldProps = {
    label: string;
    value: string;
    status: 'pending' | 'streaming' | 'done' | 'error';
    disabled: boolean;
    multiline?: boolean;
    placeholder?: string;
    onChange: (value: string) => void;
};

export const GeneratedField: React.FC<GeneratedFieldProps> = ({
    label, value, status, disabled, multiline, placeholder, onChange
}) => {
    const isStreaming = status === 'streaming';
    const isPending = status === 'pending';
    
    // Auto scroll to bottom while streaming if multiline
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (isStreaming && textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [value, isStreaming]);

    return (
        <div className={`char-gen-field ${isPending ? 'pending' : ''}`}>
            <label>
                <span>{label}</span>
                {isStreaming && <span className="char-gen-streaming-indicator">Đang tạo... ⏳</span>}
            </label>
            
            {multiline ? (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder || `Đang chờ tạo ${label}...`}
                    className={`char-gen-textarea ${isStreaming ? 'streaming' : ''}`}
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder || `Đang chờ tạo ${label}...`}
                    className={`char-gen-input ${isStreaming ? 'streaming' : ''}`}
                />
            )}
        </div>
    );
};

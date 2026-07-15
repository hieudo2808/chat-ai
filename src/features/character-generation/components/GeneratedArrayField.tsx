import React, { useState } from 'react';

type GeneratedArrayFieldProps = {
    label: string;
    values: string[];
    status: 'pending' | 'streaming' | 'done' | 'error';
    disabled: boolean;
    onChange: (values: string[]) => void;
    renderAs: 'tags' | 'list';
};

export const GeneratedArrayField: React.FC<GeneratedArrayFieldProps> = ({
    label, values, status, disabled, onChange, renderAs
}) => {
    const isStreaming = status === 'streaming';
    const isPending = status === 'pending';
    const [newItemText, setNewItemText] = useState('');

    const handleRemove = (index: number) => {
        if (disabled) return;
        const newValues = [...values];
        newValues.splice(index, 1);
        onChange(newValues);
    };

    const handleAdd = () => {
        if (disabled || !newItemText.trim()) return;
        onChange([...values, newItemText.trim()]);
        setNewItemText('');
    };

    return (
        <div className={`char-gen-field ${isPending ? 'pending' : ''}`}>
            <label>
                <span>{label}</span>
                {isStreaming && <span className="char-gen-streaming-indicator">Đang tạo... ⏳</span>}
            </label>

            {renderAs === 'tags' && (
                <div className={`char-gen-tags-container ${isStreaming ? 'streaming' : ''}`}>
                    {values.map((tag, idx) => (
                        <span key={idx} className="char-gen-tag">
                            {tag}
                            {!disabled && (
                                <button type="button"
                                    onClick={() => handleRemove(idx)}
                                    className="char-gen-tag-remove-btn"
                                >
                                    &times;
                                </button>
                            )}
                        </span>
                    ))}
                    {!disabled && status !== 'streaming' && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="text"
                                value={newItemText}
                                onChange={(e) => setNewItemText(e.target.value)}
                                placeholder="Thêm tag..."
                                className="char-gen-tag-input"
                                onKeyDown={(e) => {
                                     if (e.key === 'Enter') {
                                         e.preventDefault();
                                         handleAdd();
                                     }
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {renderAs === 'list' && (
                <div className="char-gen-list-container">
                    {values.map((item, idx) => (
                        <div key={idx} className="char-gen-list-item">
                            <textarea
                                value={item}
                                onChange={(e) => {
                                    if (disabled) return;
                                    const newValues = [...values];
                                    newValues[idx] = e.target.value;
                                    onChange(newValues);
                                }}
                                disabled={disabled}
                                className={`char-gen-textarea char-gen-list-item-textarea ${isStreaming ? 'streaming' : ''}`}
                            />
                            {!disabled && (
                                <button type="button" onClick={() => handleRemove(idx)} className="char-gen-list-remove-btn">
                                    Xóa
                                </button>
                            )}
                        </div>
                    ))}
                    {!disabled && status !== 'streaming' && (
                        <button type="button" onClick={() => onChange([...values, ''])} className="char-gen-list-add-btn">
                            + Thêm item
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

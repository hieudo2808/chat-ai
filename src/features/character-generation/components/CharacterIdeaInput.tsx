import React from 'react';

type CharacterIdeaInputProps = {
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
    onGenerate: () => void;
};

export const CharacterIdeaInput: React.FC<CharacterIdeaInputProps> = ({ value, disabled, onChange, onGenerate }) => {
    return (
        <div className="char-gen-idea-container">
            <label>
                Ý tưởng nhân vật
            </label>
            <textarea
                placeholder="Ví dụ: Một nữ kiếm sĩ cổ trang là android, lạnh lùng nhưng dịu dàng..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="char-gen-textarea-idea"
            />
            <button type="button"
                onClick={onGenerate}
                disabled={disabled || value.trim().length === 0}
                className="char-gen-btn-generate"
            >
                Generate Character
            </button>
        </div>
    );
};

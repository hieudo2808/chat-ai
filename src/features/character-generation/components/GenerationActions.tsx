import React from 'react';
import type { CharacterGenerationState } from '../state/characterGenerationReducer';

type GenerationActionsProps = {
    status: CharacterGenerationState['streamStatus'];
    canCancel: boolean;
    canSave: boolean;
    onCancel: () => void;
    onSave: () => void;
    onDiscard: () => void;
};

export const GenerationActions: React.FC<GenerationActionsProps> = ({
    status, canCancel, canSave, onCancel, onSave, onDiscard
}) => {
    if (status === 'idle' || status === 'starting') {
        return null;
    }

    return (
        <div className="char-gen-actions">
            {canCancel && (
                <button
                    onClick={onCancel}
                    className="char-gen-btn-cancel"
                >
                    Dừng tạo (Cancel)
                </button>
            )}

            {(status === 'done' || status === 'partial_error' || status === 'cancelled') && (
                <>
                    <button
                        onClick={onDiscard}
                        className="char-gen-btn-discard"
                    >
                        Hủy bỏ (Discard)
                    </button>
                    <button
                        onClick={onSave}
                        disabled={!canSave}
                        className="char-gen-btn-save"
                    >
                        Lưu nhân vật (Save)
                    </button>
                </>
            )}
        </div>
    );
};

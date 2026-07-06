import React from 'react';
import { useCharacterGeneration } from '../hooks/useCharacterGeneration';
import { useSettings } from '~/features/settings/hooks/useSettings';
import { CharacterIdeaInput } from './CharacterIdeaInput';
import { GeneratedCharacterForm } from './GeneratedCharacterForm';
import { GenerationActions } from './GenerationActions';
import { Modal } from '~/components/ui/Modal/Modal';
import type { Character } from '~/types';
import './CharacterGeneration.css';

type CharacterGenerationPageProps = {
    onClose: () => void;
    onSave: (character: Character) => void;
};

export const CharacterGenerationPage: React.FC<CharacterGenerationPageProps> = ({ onClose, onSave }) => {
    const { settings } = useSettings();
    const {
        idea,
        setIdea,
        state,
        canCancel,
        canEdit,
        canSave,
        startGeneration,
        cancelGeneration,
        updateField,
        discardDraft,
        getDraftAsCharacter,
    } = useCharacterGeneration();

    const handleGenerate = () => {
        startGeneration(settings);
    };

    const handleSave = () => {
        if (!canSave) return;
        const draft = getDraftAsCharacter();
        onSave(draft as Character);
    };

    return (
        <Modal title="✨ Tạo Nhân Vật Bằng AI" onClose={onClose}>
            <div className="char-gen-container">
                <CharacterIdeaInput
                    value={idea}
                    disabled={state.streamStatus === 'streaming'}
                    onChange={setIdea}
                    onGenerate={handleGenerate}
                />

                {state.streamStatus !== 'idle' && state.streamStatus !== 'starting' && (
                    <div className="char-gen-container" style={{ marginTop: '16px' }}>
                        <GeneratedCharacterForm fields={state.fields} editable={canEdit} onFieldChange={updateField} />

                        <GenerationActions
                            status={state.streamStatus}
                            canCancel={canCancel}
                            canSave={canSave}
                            onCancel={cancelGeneration}
                            onSave={handleSave}
                            onDiscard={discardDraft}
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
};

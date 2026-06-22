import { useState } from 'react';
import { Modal } from '~/components/ui/Modal/Modal';
import type { Character } from '~/types';
import './CharacterEditorModal.css';

interface CharacterEditorModalProps {
    character: Character | null;
    onClose: () => void;
    onSave: (character: Character) => void;
}

export function CharacterEditorModal({ character, onClose, onSave }: CharacterEditorModalProps) {
    const [form, setForm] = useState<Partial<Character>>(
        character || {
            name: '',
            avatar: '👤',
            description: '',
            personality: '',
            scenario: '',
            firstMessage: '',
            exampleMessages: '',
            advancedPrompt: '',
        },
    );

    const updateField = (field: keyof Character, value: string) => {
        setForm({
            ...form,
            [field]: value,
        });
    };

    return (
        <Modal title={character ? 'Edit Character' : 'New Character'} onClose={onClose}>
            <div className="form-row">
                <div className="form-group avatar-field">
                    <label>Avatar</label>
                    <input type="text" value={form.avatar || ''} onChange={(e) => updateField('avatar', e.target.value)} />
                </div>

                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        placeholder="Character name"
                        value={form.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Description</label>
                <input
                    type="text"
                    placeholder="Short description"
                    value={form.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Personality</label>
                <textarea
                    placeholder="Personality, speaking style, behavior..."
                    value={form.personality || ''}
                    onChange={(e) => updateField('personality', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Scenario</label>
                <textarea
                    placeholder="World, situation, relationship with user..."
                    value={form.scenario || ''}
                    onChange={(e) => updateField('scenario', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>First Message</label>
                <textarea
                    placeholder="The first message from this character..."
                    value={form.firstMessage || ''}
                    onChange={(e) => updateField('firstMessage', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Example Messages</label>
                <textarea
                    placeholder="Example conversations... (e.g., User: Hi\nChar: Hello)"
                    value={form.exampleMessages || ''}
                    onChange={(e) => updateField('exampleMessages', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Advanced Prompt</label>
                <textarea
                    placeholder="System prompts or internal monologue rules..."
                    value={form.advancedPrompt || ''}
                    onChange={(e) => updateField('advancedPrompt', e.target.value)}
                />
            </div>

            <div className="modal-actions">
                <button className="secondary" onClick={onClose}>
                    Cancel
                </button>
                <button
                    onClick={() => {
                        if (!form.name?.trim()) {
                            alert('Vui lòng nhập tên nhân vật.');
                            return;
                        }

                        onSave({
                            ...form,
                            name: form.name.trim(),
                        } as Character);
                    }}
                >
                    Save Character
                </button>
            </div>
        </Modal>
    );
}

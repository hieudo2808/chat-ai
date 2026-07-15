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
        <Modal title={character ? 'Chỉnh sửa nhân vật' : 'Tạo nhân vật mới'} onClose={onClose}>
            <div className="form-row">
                <div className="form-group avatar-field">
                    <label htmlFor="char-avatar">Emoji/Ảnh đại diện (Avatar)</label>
                    <input id="char-avatar" type="text" value={form.avatar || ''} onChange={(e) => updateField('avatar', e.target.value)} />
                </div>

                <div className="form-group">
                    <label htmlFor="char-name">Tên nhân vật</label>
                    <input
                        id="char-name"
                        type="text"
                        placeholder="Nhập tên nhân vật..."
                        value={form.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                    />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="char-description">Mô tả ngắn</label>
                <input
                    id="char-description"
                    type="text"
                    placeholder="Nhập mô tả ngắn về nhân vật..."
                    value={form.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="char-personality">Tính cách (Personality)</label>
                <textarea
                    id="char-personality"
                    placeholder="Ví dụ: Rụt rè, dễ bối rối, thích vẽ tranh mèo..."
                    value={form.personality || ''}
                    onChange={(e) => updateField('personality', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="char-scenario">Bối cảnh (Scenario)</label>
                <textarea
                    id="char-scenario"
                    placeholder="Ví dụ: Gặp gỡ trong phòng học mỹ thuật vắng người..."
                    value={form.scenario || ''}
                    onChange={(e) => updateField('scenario', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="char-first-message">Lời chào đầu tiên (First Message)</label>
                <textarea
                    id="char-first-message"
                    placeholder="Lời thoại đầu tiên của nhân vật khi bắt đầu cuộc trò chuyện..."
                    value={form.firstMessage || ''}
                    onChange={(e) => updateField('firstMessage', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="char-example-messages">Đoạn chat mẫu (Example Messages)</label>
                <textarea
                    id="char-example-messages"
                    placeholder="Các mẫu hội thoại mẫu để model bắt chước. Ví dụ:&#10;User: Chào cậu&#10;Char: *ngước nhìn lên, bối rối* X-Xin chào..."
                    value={form.exampleMessages || ''}
                    onChange={(e) => updateField('exampleMessages', e.target.value)}
                />
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '4fr 1fr', alignItems: 'end' }}>
                <div className="form-group">
                    <label htmlFor="char-advanced-prompt">System Prompt nâng cao (Advanced Prompt)</label>
                    <textarea
                        id="char-advanced-prompt"
                        placeholder="Các chỉ thị hệ thống riêng cho nhân vật này..."
                        value={form.advancedPrompt || ''}
                        onChange={(e) => updateField('advancedPrompt', e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="char-depth">Độ sâu (Depth)</label>
                    <input
                        id="char-depth"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.advancedPromptDepth ?? 0}
                        onChange={(e) => setForm({ ...form, advancedPromptDepth: parseInt(e.target.value) || 0 })}
                        style={{ height: '92px', textAlign: 'center' }}
                    />
                </div>
            </div>

            <div className="modal-actions">
                <button type="button" className="secondary" onClick={onClose}>
                    Hủy
                </button>
                <button type="button"
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
                    Lưu nhân vật
                </button>
            </div>
        </Modal>
    );
}

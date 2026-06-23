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
                    <label>Emoji/Ảnh đại diện (Avatar)</label>
                    <input type="text" value={form.avatar || ''} onChange={(e) => updateField('avatar', e.target.value)} />
                </div>

                <div className="form-group">
                    <label>Tên nhân vật</label>
                    <input
                        type="text"
                        placeholder="Nhập tên nhân vật..."
                        value={form.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Mô tả ngắn</label>
                <input
                    type="text"
                    placeholder="Nhập mô tả ngắn về nhân vật..."
                    value={form.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Tính cách (Personality)</label>
                <textarea
                    placeholder="Ví dụ: Rụt rè, dễ bối rối, thích vẽ tranh mèo..."
                    value={form.personality || ''}
                    onChange={(e) => updateField('personality', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Bối cảnh (Scenario)</label>
                <textarea
                    placeholder="Ví dụ: Gặp gỡ trong phòng học mỹ thuật vắng người..."
                    value={form.scenario || ''}
                    onChange={(e) => updateField('scenario', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Lời chào đầu tiên (First Message)</label>
                <textarea
                    placeholder="Lời thoại đầu tiên của nhân vật khi bắt đầu cuộc trò chuyện..."
                    value={form.firstMessage || ''}
                    onChange={(e) => updateField('firstMessage', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Đoạn chat mẫu (Example Messages)</label>
                <textarea
                    placeholder="Các mẫu hội thoại mẫu để model bắt chước. Ví dụ:&#10;User: Chào cậu&#10;Char: *ngước nhìn lên, bối rối* X-Xin chào..."
                    value={form.exampleMessages || ''}
                    onChange={(e) => updateField('exampleMessages', e.target.value)}
                />
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '4fr 1fr', alignItems: 'end' }}>
                <div className="form-group">
                    <label>System Prompt nâng cao (Advanced Prompt)</label>
                    <textarea
                        placeholder="Các chỉ thị hệ thống riêng cho nhân vật này..."
                        value={form.advancedPrompt || ''}
                        onChange={(e) => updateField('advancedPrompt', e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Độ sâu (Depth)</label>
                    <input
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
                <button className="secondary" onClick={onClose}>
                    Hủy
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
                    Lưu nhân vật
                </button>
            </div>
        </Modal>
    );
}

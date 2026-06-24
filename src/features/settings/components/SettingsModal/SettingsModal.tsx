import { useState } from 'react';
import { Modal } from '~/components/ui/Modal/Modal';
import type { Settings, PromptConfig } from '~/types';
import { DEFAULT_PROMPTS } from '~/services/settingsService';
import './SettingsModal.css';

interface SettingsModalProps {
    settings: Settings;
    onClose: () => void;
    onSave: (settings: Settings) => void;
}

const providerPresets = [
    {
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        modelPlaceholder: 'openrouter-model-id',
    },
    {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        modelPlaceholder: 'gpt-4o-mini',
    },
    {
        name: 'Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        modelPlaceholder: 'gemini-1.5-flash',
    },
    {
        name: 'LM Studio',
        baseUrl: 'http://localhost:1234/v1',
        modelPlaceholder: 'local-model-name',
    },
    {
        name: 'Ollama',
        baseUrl: 'http://localhost:11434/v1',
        modelPlaceholder: 'local-model-name',
    },
];

export function SettingsModal({ settings, onClose, onSave }: SettingsModalProps) {
    const [localSettings, setLocalSettings] = useState<Settings>({
        ...settings,
        prompts: settings.prompts || [...DEFAULT_PROMPTS],
    });
    const [activeTab, setActiveTab] = useState<'general' | 'prompts'>('general');
    const [editingPrompt, setEditingPrompt] = useState<PromptConfig | null>(null);

    const updateField = (field: keyof Settings, value: any) => {
        setLocalSettings({
            ...localSettings,
            [field]: value,
        });
    };

    const handleTogglePrompt = (id: string, enabled: boolean) => {
        const updatedPrompts = (localSettings.prompts || []).map((p) =>
            p.id === id ? { ...p, enabled } : p
        );
        updateField('prompts', updatedPrompts);
    };

    const handleResetPrompt = (id: string) => {
        const defaultPrompt = DEFAULT_PROMPTS.find((p) => p.id === id);
        if (defaultPrompt) {
            const updatedPrompts = (localSettings.prompts || []).map((p) =>
                p.id === id ? { ...defaultPrompt } : p
            );
            updateField('prompts', updatedPrompts);
        }
    };

    const handleDeletePrompt = (id: string) => {
        const updatedPrompts = (localSettings.prompts || []).filter((p) => p.id !== id);
        updateField('prompts', updatedPrompts);
    };

    const handleAddCustomPrompt = () => {
        const newPrompt: PromptConfig = {
            id: 'custom_' + Date.now(),
            name: 'Prompt tùy chỉnh',
            role: 'system',
            content: '',
            enabled: true,
            injectionDepth: 0,
            injectionOrder: 100,
            systemPrompt: false,
        };
        updateField('prompts', [...(localSettings.prompts || []), newPrompt]);
        setEditingPrompt(newPrompt);
    };

    const handleSavePromptEdit = () => {
        if (!editingPrompt) return;
        const updatedPrompts = (localSettings.prompts || []).map((p) =>
            p.id === editingPrompt.id ? { ...editingPrompt } : p
        );
        updateField('prompts', updatedPrompts);
        setEditingPrompt(null);
    };

    const handleCancelPromptEdit = () => {
        setEditingPrompt(null);
    };

    const prompts = localSettings.prompts || [];

    return (
        <Modal title="Cài đặt hệ thống" onClose={onClose}>
            <div className="settings-tabs">
                <button
                    className={`settings-tab-button ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    Cài đặt chung
                </button>
                <button
                    className={`settings-tab-button ${activeTab === 'prompts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('prompts')}
                >
                    Quản lý Prompt
                </button>
            </div>

            {activeTab === 'general' ? (
                <>
                    <div className="form-group presets-group">
                        <label>Cấu hình nhanh (Quick Presets)</label>
                        <div className="preset-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {providerPresets.map(preset => (
                                <button
                                    key={preset.name}
                                    className="secondary"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                    onClick={() => {
                                        setLocalSettings({
                                            ...localSettings,
                                            baseUrl: preset.baseUrl,
                                            modelName: preset.modelPlaceholder
                                        });
                                    }}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>API Key</label>
                        <input
                            type="password"
                            placeholder="sk-..."
                            value={localSettings.apiKey}
                            onChange={(e) => updateField('apiKey', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Base URL</label>
                        <input 
                            type="text" 
                            placeholder="https://..."
                            value={localSettings.baseUrl} 
                            onChange={(e) => updateField('baseUrl', e.target.value)} 
                        />
                    </div>

                    <div className="form-group">
                        <label>Tên Model (Model Name)</label>
                        <input
                            type="text"
                            placeholder="gpt-4o-mini, gemini-1.5-flash..."
                            value={localSettings.modelName}
                            onChange={(e) => updateField('modelName', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Prompt Jailbreak toàn cục (Global Jailbreak)</label>
                        <textarea
                            placeholder="Các chỉ thị ép định dạng chat hoặc lọc nội dung áp dụng cho mọi cuộc trò chuyện..."
                            value={localSettings.globalJailbreak || ''}
                            onChange={(e) => updateField('globalJailbreak', e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Độ sáng tạo (Temperature)</label>
                            <input
                                type="number"
                                min="0"
                                max="2"
                                step="0.1"
                                value={localSettings.temperature}
                                onChange={(e) => updateField('temperature', Number(e.target.value))}
                            />
                        </div>

                        <div className="form-group">
                            <label>Token tối đa (Max Tokens)</label>
                            <input
                                type="number"
                                min="1"
                                value={localSettings.maxTokens}
                                onChange={(e) => updateField('maxTokens', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Độ tập trung (Top P)</label>
                            <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.05"
                                value={localSettings.topP !== undefined ? localSettings.topP : 1.0}
                                onChange={(e) => updateField('topP', Number(e.target.value))}
                            />
                        </div>

                        <div className="form-group">
                            <label>Tần suất lặp (Repetition Penalty)</label>
                            <input
                                type="number"
                                min="0"
                                max="2"
                                step="0.05"
                                value={localSettings.repetitionPenalty !== undefined ? localSettings.repetitionPenalty : 1.0}
                                onChange={(e) => updateField('repetitionPenalty', Number(e.target.value))}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="prompts-tab-content">
                    {editingPrompt ? (
                        <div className="prompt-editor-pane">
                            <div className="prompt-editor-header">
                                <h4>Chỉnh sửa Prompt: {editingPrompt.name}</h4>
                                <div className="editor-actions">
                                    <button className="btn-editor-cancel" onClick={handleCancelPromptEdit}>
                                        Quay lại
                                    </button>
                                    <button className="btn-editor-save" onClick={handleSavePromptEdit}>
                                        Xác nhận
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Tên Prompt</label>
                                <input
                                    type="text"
                                    value={editingPrompt.name}
                                    onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Vai trò (Role)</label>
                                    <select
                                        value={editingPrompt.role}
                                        onChange={(e) => setEditingPrompt({ ...editingPrompt, role: e.target.value as any })}
                                    >
                                        <option value="system">System</option>
                                        <option value="user">User</option>
                                        <option value="assistant">Assistant</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Độ sâu chèn (Depth)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editingPrompt.injectionDepth}
                                        onChange={(e) => setEditingPrompt({ ...editingPrompt, injectionDepth: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Thứ tự chèn (Order - Càng nhỏ càng chèn trước)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editingPrompt.injectionOrder}
                                    onChange={(e) => setEditingPrompt({ ...editingPrompt, injectionOrder: Number(e.target.value) })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Nội dung Prompt</label>
                                <textarea
                                    style={{ minHeight: '160px' }}
                                    value={editingPrompt.content}
                                    onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                                />
                                <div className="placeholder-helper">
                                    <strong>Nhấp để thêm Placeholder:</strong>
                                    <div>
                                        {['{{char}}', '{{user}}', '{{description}}', '{{personality}}', '{{scenario}}', '{{examples}}', '{{jailbreak}}'].map((tag) => (
                                            <span
                                                key={tag}
                                                className="placeholder-tag"
                                                onClick={() => {
                                                    setEditingPrompt({
                                                        ...editingPrompt,
                                                        content: editingPrompt.content + tag
                                                    });
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="prompt-list-header">
                                <h3>Quản lý các khối Prompt hệ thống</h3>
                                <button className="btn-add-prompt" onClick={handleAddCustomPrompt}>
                                    + Thêm Prompt tùy chỉnh
                                </button>
                            </div>

                            <div className="prompts-container">
                                {prompts.map((prompt) => (
                                    <div key={prompt.id} className="prompt-item-row">
                                        <div className="prompt-item-left">
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={prompt.enabled}
                                                    onChange={(e) => handleTogglePrompt(prompt.id, e.target.checked)}
                                                />
                                                <span className="slider"></span>
                                            </label>

                                            <div className="prompt-info">
                                                <div className="prompt-name">{prompt.name}</div>
                                                <div className="prompt-meta">
                                                    <span className={`role-badge role-${prompt.role}`}>{prompt.role}</span>
                                                    <span>Độ sâu: <strong className="prompt-depth-order">{prompt.injectionDepth}</strong></span>
                                                    <span>Thứ tự: <strong className="prompt-depth-order">{prompt.injectionOrder}</strong></span>
                                                    {prompt.systemPrompt && (
                                                        <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 'bold' }}>Mặc định</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="prompt-actions">
                                            <button
                                                className="btn-action"
                                                title="Chỉnh sửa nội dung"
                                                onClick={() => setEditingPrompt({ ...prompt })}
                                            >
                                                ✏️
                                            </button>
                                            {prompt.systemPrompt ? (
                                                <button
                                                    className="btn-action btn-reset"
                                                    title="Khôi phục mặc định"
                                                    onClick={() => handleResetPrompt(prompt.id)}
                                                >
                                                    🔄
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn-action btn-delete"
                                                    title="Xóa prompt tùy chỉnh"
                                                    onClick={() => handleDeletePrompt(prompt.id)}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="modal-actions">
                <button className="secondary" onClick={onClose} disabled={!!editingPrompt}>
                    Hủy
                </button>
                <button onClick={() => onSave(localSettings)} disabled={!!editingPrompt}>Lưu cài đặt</button>
            </div>
        </Modal>
    );
}

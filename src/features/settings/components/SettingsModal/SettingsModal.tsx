import { useState } from 'react';
import { Modal } from '~/components/ui/Modal/Modal';
import type { Settings, PromptConfig } from '~/types';
import { DEFAULT_PROMPTS } from '~/services/settingsService';
import { ModelManagementTab } from '~/features/models/components/ModelManagementTab';
import './SettingsModal.css';

interface SettingsModalProps {
    settings: Settings;
    onClose: () => void;
    onSave: (settings: Settings) => void;
}

const providerPresets = [
    { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', modelPlaceholder: 'openrouter-model-id' },
    { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', modelPlaceholder: 'gpt-4o-mini' },
    { name: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', modelPlaceholder: 'gemini-1.5-flash' },
    { name: 'LM Studio', baseUrl: 'http://localhost:1234/v1', modelPlaceholder: 'local-model-name' },
    { name: 'Ollama', baseUrl: 'http://localhost:11434/v1', modelPlaceholder: 'local-model-name' },
];

export function SettingsModal({ settings, onClose, onSave }: SettingsModalProps) {
    const [localSettings, setLocalSettings] = useState<Settings>({
        ...settings,
        prompts: settings.prompts || [...DEFAULT_PROMPTS],
    });
    const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'prompts' | 'models'>('profile');
    const [editingPrompt, setEditingPrompt] = useState<PromptConfig | null>(null);

    const updateField = (field: keyof Settings, value: unknown) => {
        setLocalSettings({ ...localSettings, [field]: value });
    };

    const handleTogglePrompt = (id: string, enabled: boolean) => {
        const updatedPrompts = (localSettings.prompts || []).map((p) => p.id === id ? { ...p, enabled } : p);
        updateField('prompts', updatedPrompts);
    };

    const handleResetPrompt = (id: string) => {
        const defaultPrompt = DEFAULT_PROMPTS.find((p) => p.id === id);
        if (defaultPrompt) {
            const updatedPrompts = (localSettings.prompts || []).map((p) => p.id === id ? { ...defaultPrompt } : p);
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
        const updatedPrompts = (localSettings.prompts || []).map((p) => p.id === editingPrompt.id ? { ...editingPrompt } : p);
        updateField('prompts', updatedPrompts);
        setEditingPrompt(null);
    };

    const handleCancelPromptEdit = () => {
        setEditingPrompt(null);
    };

    const prompts = localSettings.prompts || [];

    const renderTabButton = (tabName: typeof activeTab, label: string) => (
        <button
            className={`settings-tab-button ${activeTab === tabName ? 'active' : ''}`}
            onClick={() => setActiveTab(tabName)}
        >
            {label}
        </button>
    );

    const renderInput = (label: string, field: keyof Settings, type = 'text', placeholder = '', min?: string, max?: string, step?: string) => (
        <div className="form-group">
            <label>{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={(localSettings[field] ?? '') as string | number}
                onChange={(e) => updateField(field, type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)}
                min={min} max={max} step={step}
            />
        </div>
    );

    return (
        <Modal title="Cài đặt hệ thống" onClose={onClose}>
            <div className="settings-tabs">
                {renderTabButton('profile', 'Hồ sơ')}
                {renderTabButton('general', 'LLM Defaults')}
                {renderTabButton('prompts', 'System Prompts')}
                {renderTabButton('models', 'Quản lý LLM')}
            </div>

            <div style={{ minHeight: '400px', paddingBottom: '20px' }}>
                {activeTab === 'profile' && (
                    <div className="form-group">
                        <label>Tên hiển thị (User Name)</label>
                        <input
                            type="text"
                            placeholder="Nhập tên của bạn (dùng cho {{user}})"
                            value={localSettings.userName || ''}
                            onChange={(e) => updateField('userName', e.target.value)}
                        />
                        <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>Tên này sẽ thay thế biến {'{{user}}'} khi gửi prompt cho AI.</p>
                    </div>
                )}

                {activeTab === 'general' && (
                    <div>
                        <div className="form-group">
                            <label>Cấu hình nhanh (Quick Presets)</label>
                            <div className="preset-buttons">
                                {providerPresets.map(preset => (
                                    <button
                                        key={preset.name}
                                        onClick={() => {
                                            setLocalSettings({ ...localSettings, baseUrl: preset.baseUrl, modelName: preset.modelPlaceholder });
                                        }}
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {renderInput('API Key', 'apiKey', 'password', 'sk-...')}
                        {renderInput('Base URL', 'baseUrl', 'text', 'https://...')}
                        {renderInput('Tên Model mặc định', 'modelName', 'text', 'gpt-4o-mini, gemini-1.5-flash...')}
                        
                        <div className="form-group">
                            <label>Prompt Jailbreak toàn cục</label>
                            <textarea
                                placeholder="Các chỉ thị ép định dạng chat hoặc lọc nội dung áp dụng cho mọi cuộc trò chuyện..."
                                value={localSettings.globalJailbreak || ''}
                                onChange={(e) => updateField('globalJailbreak', e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            {renderInput('Temperature', 'temperature', 'number', '', '0', '2', '0.1')}
                            {renderInput('Max Tokens', 'maxTokens', 'number', '', '1')}
                        </div>
                        <div className="form-row">
                            {renderInput('Top P', 'topP', 'number', '', '0', '1', '0.05')}
                            {renderInput('Repetition Penalty', 'repetitionPenalty', 'number', '', '0', '2', '0.05')}
                        </div>
                    </div>
                )}

                {activeTab === 'prompts' && (
                    <div>
                        {editingPrompt ? (
                            <div className="prompt-editor-pane">
                                <div className="prompt-editor-header">
                                    <h4>Chỉnh sửa Prompt: {editingPrompt.name}</h4>
                                    <div className="editor-actions">
                                        <button className="btn-editor-cancel" onClick={handleCancelPromptEdit}>Quay lại</button>
                                        <button className="btn-editor-save" onClick={handleSavePromptEdit}>Xác nhận</button>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Tên Prompt</label>
                                    <input type="text" value={editingPrompt.name} onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })} />
                                </div>

                                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                    <div className="form-group">
                                        <label>Vai trò (Role)</label>
                                        <select value={editingPrompt.role} onChange={(e) => setEditingPrompt({ ...editingPrompt, role: e.target.value as "system" | "user" | "assistant" })}>
                                            <option value="system">System</option>
                                            <option value="user">User</option>
                                            <option value="assistant">Assistant</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Độ sâu chèn</label>
                                        <input type="number" min="0" value={editingPrompt.injectionDepth} onChange={(e) => setEditingPrompt({ ...editingPrompt, injectionDepth: Number(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Thứ tự chèn</label>
                                        <input type="number" min="0" value={editingPrompt.injectionOrder} onChange={(e) => setEditingPrompt({ ...editingPrompt, injectionOrder: Number(e.target.value) })} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Nội dung Prompt</label>
                                    <textarea value={editingPrompt.content} onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })} />
                                    
                                    <div className="placeholder-helper">
                                        <strong>Chèn thẻ:</strong>
                                        <div>
                                            {['{{char}}', '{{user}}', '{{description}}', '{{personality}}', '{{scenario}}', '{{examples}}', '{{jailbreak}}'].map((tag) => (
                                                <span key={tag} className="placeholder-tag" onClick={() => setEditingPrompt({ ...editingPrompt, content: editingPrompt.content + tag })}>
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
                                    <h3>Quản lý khối Prompt</h3>
                                    <button className="btn-add-prompt" onClick={handleAddCustomPrompt}>
                                        + Thêm Prompt
                                    </button>
                                </div>
                                <div className="prompts-container">
                                    {prompts.map((prompt) => (
                                        <div key={prompt.id} className="prompt-item-row">
                                            <div className="prompt-item-left">
                                                <label className="switch">
                                                    <input type="checkbox" checked={prompt.enabled} onChange={(e) => handleTogglePrompt(prompt.id, e.target.checked)} />
                                                    <span className="slider"></span>
                                                </label>
                                                <div className="prompt-info">
                                                    <span className="prompt-name">{prompt.name}</span>
                                                    <div className="prompt-meta">
                                                        <span className={`role-badge role-${prompt.role}`}>{prompt.role}</span>
                                                        <span>Độ sâu: <strong>{prompt.injectionDepth}</strong></span>
                                                        <span>Thứ tự: <strong>{prompt.injectionOrder}</strong></span>
                                                        {prompt.systemPrompt && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Mặc định</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="prompt-actions">
                                                <button className="btn-action" onClick={() => setEditingPrompt({ ...prompt })}>✏️</button>
                                                {prompt.systemPrompt ? (
                                                    <button className="btn-action" onClick={() => handleResetPrompt(prompt.id)}>🔄</button>
                                                ) : (
                                                    <button className="btn-action" onClick={() => handleDeletePrompt(prompt.id)}>🗑️</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'models' && (
                    <ModelManagementTab />
                )}
            </div>

            <div className="modal-actions">
                <button className="secondary" onClick={onClose} disabled={!!editingPrompt}>
                    Hủy
                </button>
                <button onClick={() => onSave(localSettings)} disabled={!!editingPrompt}>
                    Lưu cài đặt
                </button>
            </div>
        </Modal>
    );
}

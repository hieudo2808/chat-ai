import { useState } from 'react';
import { Modal } from '~/components/ui/Modal/Modal';
import type { Settings } from '~/types';
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
    const [localSettings, setLocalSettings] = useState<Settings>(settings);

    const updateField = (field: keyof Settings, value: string | number) => {
        setLocalSettings({
            ...localSettings,
            [field]: value,
        });
    };

    return (
        <Modal title="Cài đặt hệ thống" onClose={onClose}>
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

            <div className="modal-actions">
                <button className="secondary" onClick={onClose}>
                    Hủy
                </button>
                <button onClick={() => onSave(localSettings)}>Lưu cài đặt</button>
            </div>
        </Modal>
    );
}

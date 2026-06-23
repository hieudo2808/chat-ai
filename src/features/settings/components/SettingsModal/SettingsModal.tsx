import { Modal } from '~/components/ui/Modal/Modal';
import type { Settings } from '~/types';
import './SettingsModal.css';

interface SettingsModalProps {
    settings: Settings;
    onChange: (settings: Settings) => void;
    onClose: () => void;
    onSave: () => void;
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

export function SettingsModal({ settings, onChange, onClose, onSave }: SettingsModalProps) {
    const updateField = (field: keyof Settings, value: string | number) => {
        onChange({
            ...settings,
            [field]: value,
        });
    };

    return (
        <Modal title="Settings" onClose={onClose}>
            <div className="form-group presets-group">
                <label>Quick Presets</label>
                <div className="preset-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {providerPresets.map(preset => (
                        <button
                            key={preset.name}
                            className="secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={() => {
                                onChange({
                                    ...settings,
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
                    value={settings.apiKey}
                    onChange={(e) => updateField('apiKey', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Base URL</label>
                <input type="text" value={settings.baseUrl} onChange={(e) => updateField('baseUrl', e.target.value)} />
            </div>

            <div className="form-group">
                <label>Model Name</label>
                <input
                    type="text"
                    value={settings.modelName}
                    onChange={(e) => updateField('modelName', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Global Jailbreak Prompt (Post-History Instructions)</label>
                <textarea
                    placeholder="E.g. Always speak in Vietnamese, stay in character..."
                    value={settings.globalJailbreak || ''}
                    onChange={(e) => updateField('globalJailbreak', e.target.value)}
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Temperature</label>
                    <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => updateField('temperature', Number(e.target.value))}
                    />
                </div>

                <div className="form-group">
                    <label>Max Tokens</label>
                    <input
                        type="number"
                        min="1"
                        value={settings.maxTokens}
                        onChange={(e) => updateField('maxTokens', Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="modal-actions">
                <button className="secondary" onClick={onClose}>
                    Cancel
                </button>
                <button onClick={onSave}>Save</button>
            </div>
        </Modal>
    );
}

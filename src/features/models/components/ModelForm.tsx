import React, { useState } from 'react';
import type { AiModelProfile } from '~/types';

type AiModelProfileInput = Omit<AiModelProfile, 'id' | 'createdAt' | 'updatedAt'>;

type ModelFormProps = {
    initialValue?: AiModelProfile;
    mode: 'create' | 'edit';
    onSubmit: (value: AiModelProfileInput) => void;
    onCancel: () => void;
};

const PROVIDER_PRESETS: Record<string, { baseUrl: string; modelName: string }> = {
    openai: { baseUrl: 'https://api.openai.com/v1', modelName: 'gpt-4o-mini' },
    openrouter: { baseUrl: 'https://openrouter.ai/api/v1', modelName: 'google/gemini-flash' },
    ollama: { baseUrl: 'http://localhost:11434/v1', modelName: 'llama3' },
    lmstudio: { baseUrl: 'http://localhost:1234/v1', modelName: 'local-model' },
    custom: { baseUrl: '', modelName: '' },
};

export const ModelForm: React.FC<ModelFormProps> = ({ initialValue, mode, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<AiModelProfileInput>(() => {
        if (initialValue) return { ...initialValue };
        return {
            name: '',
            provider: 'openrouter',
            baseUrl: PROVIDER_PRESETS.openrouter.baseUrl,
            apiKey: '',
            modelName: PROVIDER_PRESETS.openrouter.modelName,
            temperature: 0.8,
            maxTokens: 1024,
            topP: 1.0,
            repetitionPenalty: 1.0,
            supportsStreaming: true,
            supportsJsonMode: false,
            isDefault: false,
        };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? undefined : Number(value)) : value,
        }));
    };

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provider = e.target.value as AiModelProfileInput['provider'];
        const preset = PROVIDER_PRESETS[provider];
        
        setFormData(prev => ({
            ...prev,
            provider,
            baseUrl: preset.baseUrl,
            modelName: preset.modelName || prev.modelName,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="model-form-pane">
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
                {mode === 'create' ? 'Add New Model' : 'Edit Model'}
            </h3>
            
            <div className="form-row">
                <label className="form-group">
                    Name
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="VD: GPT-4o-Mini hoặc Ollama Llama3" />
                </label>

                <label className="form-group">
                    Provider
                    <select name="provider" value={formData.provider} onChange={handleProviderChange}>
                        <option value="openrouter">OpenRouter</option>
                        <option value="openai">OpenAI</option>
                        <option value="ollama">Ollama (Local)</option>
                        <option value="lmstudio">LM Studio (Local)</option>
                        <option value="custom">Custom</option>
                    </select>
                </label>
            </div>

            <label className="form-group">
                Base URL
                <input required type="url" name="baseUrl" value={formData.baseUrl} onChange={handleChange} placeholder="https://api.openai.com/v1" />
            </label>

            <label className="form-group">
                API Key (Optional for local)
                <input type="password" name="apiKey" value={formData.apiKey || ''} onChange={handleChange} placeholder="sk-..." />
            </label>

            <label className="form-group">
                Model Name
                <input required type="text" name="modelName" value={formData.modelName} onChange={handleChange} placeholder="VD: gpt-4o-mini hoặc google/gemini-flash" />
            </label>

            <div className="form-row">
                <label className="form-group">
                    Temperature ({formData.temperature})
                    <input type="range" name="temperature" min="0" max="2" step="0.1" value={formData.temperature} onChange={handleChange} />
                </label>
                <label className="form-group">
                    Max Tokens
                    <input type="number" name="maxTokens" min="1" value={formData.maxTokens || ''} onChange={handleChange} />
                </label>
            </div>

            <div className="form-row">
                <label className="form-group">
                    Top P
                    <input type="number" name="topP" min="0" max="1" step="0.05" value={formData.topP ?? ''} onChange={handleChange} placeholder="1.0" />
                </label>
                <label className="form-group">
                    Repetition Penalty
                    <input type="number" name="repetitionPenalty" min="0" max="2" step="0.05" value={formData.repetitionPenalty ?? ''} onChange={handleChange} placeholder="1.0" />
                </label>
            </div>

            <div className="form-group" style={{ gap: '16px', flexDirection: 'row', flexWrap: 'wrap', margin: '20px 0' }}>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="checkbox" name="supportsStreaming" checked={formData.supportsStreaming} onChange={handleChange} />
                    Supports Streaming
                </label>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="checkbox" name="supportsJsonMode" checked={formData.supportsJsonMode} onChange={handleChange} />
                    Supports JSON Mode
                </label>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} />
                    Set as Default
                </label>
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={onCancel} className="secondary">Cancel</button>
                <button type="submit">Save</button>
            </div>
        </form>
    );
};

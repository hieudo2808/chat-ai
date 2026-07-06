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

        setFormData((prev) => ({
            ...prev,
            [name]:
                type === 'checkbox' ? checked : type === 'number' ? (value === '' ? undefined : Number(value)) : value,
        }));
    };

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provider = e.target.value as AiModelProfileInput['provider'];
        const preset = PROVIDER_PRESETS[provider];

        setFormData((prev) => ({
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
                {mode === 'create' ? 'Thêm Model mới' : 'Chỉnh sửa Model'}
            </h3>

            {/* Tên profile & Provider */}
            <div className="form-group">
                <label htmlFor="model-name-input">Tên hiển thị</label>
                <input
                    id="model-name-input"
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="VD: GPT-4o-Mini hoặc Ollama Llama3"
                />
            </div>

            <div className="form-group">
                <label htmlFor="model-provider">Provider</label>
                <select id="model-provider" name="provider" value={formData.provider} onChange={handleProviderChange}>
                    <option value="openrouter">OpenRouter</option>
                    <option value="openai">OpenAI</option>
                    <option value="ollama">Ollama (Local)</option>
                    <option value="lmstudio">LM Studio (Local)</option>
                    <option value="custom">Custom</option>
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="model-base-url">Base URL</label>
                <input
                    id="model-base-url"
                    required
                    type="url"
                    name="baseUrl"
                    value={formData.baseUrl}
                    onChange={handleChange}
                    placeholder="https://api.openai.com/v1"
                />
            </div>

            <div className="form-group">
                <label htmlFor="model-api-key">
                    API Key <span style={{ color: '#71717a', fontWeight: 400 }}>(để trống nếu dùng local)</span>
                </label>
                <input
                    id="model-api-key"
                    type="password"
                    name="apiKey"
                    value={formData.apiKey || ''}
                    onChange={handleChange}
                    placeholder="sk-..."
                />
            </div>

            <div className="form-group">
                <label htmlFor="model-model-name">Tên Model</label>
                <input
                    id="model-model-name"
                    required
                    type="text"
                    name="modelName"
                    value={formData.modelName}
                    onChange={handleChange}
                    placeholder="VD: gpt-4o-mini, google/gemini-flash-1.5..."
                />
            </div>

            {/* Hyperparameters – 2 cột giống LLM Defaults */}
            <div className="form-row">
                <div className="form-group">
                    <label>Temperature</label>
                    <input
                        type="number"
                        name="temperature"
                        min="0"
                        max="2"
                        step="0.1"
                        value={formData.temperature}
                        onChange={handleChange}
                        placeholder="0.8"
                    />
                </div>
                <div className="form-group">
                    <label>Max Tokens</label>
                    <input
                        type="number"
                        name="maxTokens"
                        min="1"
                        value={formData.maxTokens || ''}
                        onChange={handleChange}
                        placeholder="1024"
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="model-top-p">Top P</label>
                    <input
                        id="model-top-p"
                        type="number"
                        name="topP"
                        min="0"
                        max="1"
                        step="0.05"
                        value={formData.topP ?? ''}
                        onChange={handleChange}
                        placeholder="1.0"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="model-rep-penalty">Repetition Penalty</label>
                    <input
                        id="model-rep-penalty"
                        type="number"
                        name="repetitionPenalty"
                        min="0"
                        max="2"
                        step="0.05"
                        value={formData.repetitionPenalty ?? ''}
                        onChange={handleChange}
                        placeholder="1.0"
                    />
                </div>
            </div>

            {/* Checkboxes với giải thích rõ ràng */}
            <div className="model-form-checkboxes">
                <label
                    className="model-form-checkbox-item"
                    title="Model hỗ trợ phản hồi từng từ theo thời gian thực (streaming). Nên bật với hầu hết các API hiện đại."
                >
                    <input
                        type="checkbox"
                        name="supportsStreaming"
                        checked={formData.supportsStreaming}
                        onChange={handleChange}
                    />
                    <span className="checkbox-text">
                        <strong>Hỗ trợ Streaming</strong>
                        <span className="checkbox-hint">Hiển thị phản hồi từng từ theo thời gian thực</span>
                    </span>
                </label>
                <label
                    className="model-form-checkbox-item"
                    title="Model hỗ trợ trả về JSON có cấu trúc. Dùng cho tính năng AI Generate nhân vật."
                >
                    <input
                        type="checkbox"
                        name="supportsJsonMode"
                        checked={formData.supportsJsonMode}
                        onChange={handleChange}
                    />
                    <span className="checkbox-text">
                        <strong>Hỗ trợ JSON Mode</strong>
                        <span className="checkbox-hint">Cần thiết cho AI Generate nhân vật</span>
                    </span>
                </label>
                <label
                    className="model-form-checkbox-item"
                    title="Đặt model này làm mặc định cho mọi cuộc trò chuyện. Sẽ ghi đè cấu hình LLM Defaults."
                >
                    <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} />
                    <span className="checkbox-text">
                        <strong>Đặt làm Model mặc định</strong>
                        <span className="checkbox-hint">Dùng cho tất cả cuộc trò chuyện, ghi đè LLM Defaults</span>
                    </span>
                </label>
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" onClick={onCancel} className="secondary">
                    Hủy
                </button>
                <button type="submit">{mode === 'create' ? 'Thêm Model' : 'Lưu thay đổi'}</button>
            </div>
        </form>
    );
};

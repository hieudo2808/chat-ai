import React from 'react';
import type { AiModelProfile } from '~/types';

type ModelSelectorProps = {
    models: AiModelProfile[];
    selectedId?: string;
    onChange: (modelId: string) => void;
    disabled?: boolean;
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedId, onChange, disabled }) => {
    // If there are no models, just show a disabled placeholder
    if (models.length === 0) {
        return (
            <select disabled className="px-2 py-1 border rounded bg-gray-50 text-sm">
                <option>No models available</option>
            </select>
        );
    }

    const defaultModel = models.find(m => m.isDefault);
    const valueToUse = selectedId || defaultModel?.id || models[0].id;

    return (
        <select 
            value={valueToUse} 
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className="px-2 py-1 border rounded bg-white text-sm focus:outline-none focus:border-blue-500"
        >
            {models.map(model => (
                <option key={model.id} value={model.id}>
                    {model.name} {model.isDefault ? '(Default)' : ''}
                </option>
            ))}
        </select>
    );
};

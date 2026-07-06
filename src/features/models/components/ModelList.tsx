import React from 'react';
import type { AiModelProfile } from '~/types';
import { ModelTestButton } from './ModelTestButton';

type ModelListProps = {
    models: AiModelProfile[];
    selectedModelId?: string;
    onEdit: (model: AiModelProfile) => void;
    onDelete: (id: string) => void;
    onSetDefault: (id: string) => void;
};

export const ModelList: React.FC<ModelListProps> = ({ models, selectedModelId, onEdit, onDelete, onSetDefault }) => {
    if (models.length === 0) {
        return <div className="models-empty-state">Không tìm thấy model nào. Vui lòng thêm model mới để bắt đầu.</div>;
    }

    return (
        <div className="model-profiles-list">
            {models.map(model => {
                const isSelected = model.id === selectedModelId;
                return (
                    <div key={model.id} className={`model-profile-item ${model.isDefault ? 'is-default' : ''} ${isSelected ? 'active' : ''}`}>
                        <div className="model-profile-info">
                            <div className="model-profile-name-row">
                                <span className="model-profile-title">{model.name}</span>
                                {model.isDefault && (
                                    <span className="model-badge-default">Mặc định</span>
                                )}
                            </div>
                            <span className="model-profile-subtext">
                                {model.provider.toUpperCase()} &bull; {model.modelName}
                            </span>
                        </div>
                        
                        <div className="model-profile-actions">
                            {!model.isDefault && (
                                <button onClick={() => onSetDefault(model.id)} className="btn-set-default">
                                    Set Default
                                </button>
                            )}
                            <ModelTestButton model={model} />
                            <button onClick={() => onEdit(model)} className="btn-edit-model">
                                Edit
                                </button>
                            <button onClick={() => onDelete(model.id)} disabled={model.isDefault && models.length > 1} className="btn-delete-model">
                                Delete
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

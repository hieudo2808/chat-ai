import React, { useState } from 'react';
import { useModelProfiles } from '../hooks/useModelProfiles';
import { ModelList } from './ModelList';
import { ModelForm } from './ModelForm';
import type { AiModelProfile } from '~/types';

export const ModelManagementTab: React.FC = () => {
    const { models, addModel, updateModel, deleteModel, setAsDefault } = useModelProfiles();
    
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [editingModel, setEditingModel] = useState<AiModelProfile | undefined>();

    const handleAddClick = () => {
        setEditingModel(undefined);
        setView('create');
    };

    const handleEditClick = (model: AiModelProfile) => {
        setEditingModel(model);
        setView('edit');
    };

    const handleFormSubmit = async (profileData: Omit<AiModelProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (view === 'create') {
            await addModel(profileData);
        } else if (view === 'edit' && editingModel) {
            await updateModel({ ...editingModel, ...profileData });
        }
        setView('list');
    };

    const handleFormCancel = () => {
        setView('list');
    };

    return (
        <div className="model-management-tab">
            {view === 'list' && (
                <>
                    <div className="prompt-list-header">
                        <h3>Quản lý kết nối LLM</h3>
                        <button type="button" className="btn-add-prompt" onClick={handleAddClick}>
                            + Thêm Model
                        </button>
                    </div>
                    
                    <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                        Cấu hình các API key, Base URL và các tham số mặc định của các nhà cung cấp mô hình ngôn ngữ (OpenRouter, OpenAI, Ollama, LM Studio, v.v.). Chọn cấu hình "Mặc định" để ứng dụng tự động dùng cấu hình đó khi chat.
                    </p>
                    
                    <div className="model-list-scroll-pane" style={{ overflowY: 'auto', maxHeight: '55vh', paddingRight: '4px' }}>
                        <ModelList 
                            models={models}
                            onEdit={handleEditClick}
                            onDelete={deleteModel}
                            onSetDefault={setAsDefault}
                        />
                    </div>
                </>
            )}

            {(view === 'create' || view === 'edit') && (
                <ModelForm 
                    mode={view}
                    initialValue={editingModel}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            )}
        </div>
    );
};

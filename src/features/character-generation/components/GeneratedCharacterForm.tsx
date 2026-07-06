import React from 'react';
import type { CharacterGenerationState } from '../state/characterGenerationReducer';
import { GeneratedField } from './GeneratedField';
import { GeneratedArrayField } from './GeneratedArrayField';

type GeneratedCharacterFormProps = {
    fields: CharacterGenerationState['fields'];
    editable: boolean;
    onFieldChange: (path: string, value: unknown) => void;
};

export const GeneratedCharacterForm: React.FC<GeneratedCharacterFormProps> = ({ fields, editable, onFieldChange }) => {
    return (
        <div className="char-gen-form">
            <h3>Dữ liệu nhân vật</h3>

            <div className="form-row">
                <GeneratedField
                    label="Tên nhân vật (Name)"
                    value={fields.name.value}
                    status={fields.name.status}
                    disabled={!editable}
                    onChange={(val) => onFieldChange('name', val)}
                />
                
                <GeneratedField
                    label="Ngoại hình (Appearance)"
                    value={fields.appearance.value}
                    status={fields.appearance.status}
                    disabled={!editable}
                    onChange={(val) => onFieldChange('appearance', val)}
                />
            </div>

            <GeneratedField
                label="Mô tả (Description)"
                value={fields.description.value}
                status={fields.description.status}
                disabled={!editable}
                multiline
                onChange={(val) => onFieldChange('description', val)}
            />

            <GeneratedField
                label="Tính cách (Personality)"
                value={fields.personality.value}
                status={fields.personality.status}
                disabled={!editable}
                multiline
                onChange={(val) => onFieldChange('personality', val)}
            />

            <GeneratedField
                label="Bối cảnh (Scenario)"
                value={fields.scenario.value}
                status={fields.scenario.status}
                disabled={!editable}
                multiline
                onChange={(val) => onFieldChange('scenario', val)}
            />

            <GeneratedField
                label="Văn phong (Speaking Style)"
                value={fields.speakingStyle.value}
                status={fields.speakingStyle.status}
                disabled={!editable}
                multiline
                onChange={(val) => onFieldChange('speakingStyle', val)}
            />

            <GeneratedField
                label="Lời chào đầu tiên (First Message)"
                value={fields.firstMessage.value}
                status={fields.firstMessage.status}
                disabled={!editable}
                multiline
                onChange={(val) => onFieldChange('firstMessage', val)}
            />

            <GeneratedArrayField
                label="Tags"
                values={fields.tags.value}
                status={fields.tags.status}
                disabled={!editable}
                onChange={(vals) => onFieldChange('tags', vals)}
                renderAs="tags"
            />

            <GeneratedArrayField
                label="Mẫu hội thoại (Example Dialogues)"
                values={fields.exampleDialogues.value}
                status={fields.exampleDialogues.status}
                disabled={!editable}
                onChange={(vals) => onFieldChange('exampleDialogues', vals)}
                renderAs="list"
            />
        </div>
    );
};

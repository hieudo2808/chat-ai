import React, { useState } from 'react';
import type { AiModelProfile } from '~/types';
import { testModelProfile } from '../api/modelsApi';

type ModelTestButtonProps = {
    model: AiModelProfile;
};

export const ModelTestButton: React.FC<ModelTestButtonProps> = ({ model }) => {
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    const handleTest = async () => {
        setStatus('testing');
        try {
            await testModelProfile(model);
            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
            }, 3000);
        } catch {
            setStatus('error');
            setTimeout(() => {
                setStatus('idle');
            }, 3000);
        }
    };

    return (
        <button type="button" 
            onClick={handleTest}
            disabled={status === 'testing'}
            className={`btn-test-connection ${
                status === 'testing' ? 'testing' :
                status === 'success' ? 'success' :
                status === 'error' ? 'error' :
                'idle'
            }`}
        >
            {status === 'testing' ? 'Testing...' :
             status === 'success' ? 'Success' :
             status === 'error' ? 'Failed' :
             'Test Connection'}
        </button>
    );
};

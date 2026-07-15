import React, { useReducer, useState } from 'react';
import { characterGenerationReducer, getInitialState } from '../state/characterGenerationReducer';
import type { CharacterStreamEvent } from '../state/characterGenerationReducer';
import { generateCharacterStream } from '../api/characterGenerationApi';

export const CharacterGenerationDebugPanel: React.FC = () => {
    const [state, dispatch] = useReducer(characterGenerationReducer, getInitialState());
    const [idea, setIdea] = useState('Một kiếm khách mù lang thang trong thế giới cyberpunk');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gemini-2.5-flash');

    const handleGenerate = async () => {
        dispatch({ type: 'stream_started', seq: 1, streamId: 'temp_stream' });
        try {
            await generateCharacterStream({
                idea,
                settings: {
                    apiKey,
                    baseUrl: 'https://generativelanguage.googleapis.com',
                    modelName: model,
                },
                onEvent: (event: CharacterStreamEvent) => {
                    dispatch(event);
                }
            });
        } catch (error: unknown) {
            console.error(error);
            dispatch({ type: 'error', seq: 99999, code: 'ERR', message: (error as Error).message });
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', gap: '20px', fontFamily: 'sans-serif' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h2>Character Generation Debug</h2>
                
                <label>
                    API Key (Gemini):
                    <input 
                        type="password" 
                        value={apiKey} 
                        onChange={e => setApiKey(e.target.value)}
                        style={{ display: 'block', width: '100%', padding: '5px' }}
                    />
                </label>

                <label>
                    Model:
                    <input 
                        type="text" 
                        value={model} 
                        onChange={e => setModel(e.target.value)}
                        style={{ display: 'block', width: '100%', padding: '5px' }}
                    />
                </label>

                <label>
                    Your Idea:
                    <textarea 
                        value={idea} 
                        onChange={e => setIdea(e.target.value)}
                        style={{ display: 'block', width: '100%', height: '100px', padding: '5px' }}
                    />
                </label>

                <button type="button" 
                    onClick={handleGenerate}
                    disabled={state.streamStatus === 'streaming' || !apiKey}
                    style={{ padding: '10px', background: '#0066cc', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                    {state.streamStatus === 'streaming' ? 'Generating...' : 'Generate Character'}
                </button>

                <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                    <strong>Status:</strong> {state.streamStatus}
                </div>
            </div>

            <div style={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {Object.entries(state.fields).map(([key, field]) => {
                    const isArray = Array.isArray(field.value);
                    const isStreaming = field.status === 'streaming';
                    
                    return (
                        <div key={key} style={{ 
                            border: `1px solid ${isStreaming ? '#0066cc' : '#ddd'}`, 
                            padding: '10px',
                            borderRadius: '4px',
                            background: isStreaming ? '#f0f8ff' : 'white',
                            transition: 'all 0.3s ease'
                        }}>
                            <h4 style={{ margin: '0 0 10px 0', textTransform: 'capitalize' }}>
                                {key} {isStreaming && '⏳'}
                            </h4>
                            
                            {isArray ? (
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    {(field.value as string[]).map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{field.value}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

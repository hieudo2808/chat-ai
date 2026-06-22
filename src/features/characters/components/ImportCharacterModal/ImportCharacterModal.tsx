import { useState, useRef } from 'react';
import { Modal } from '~/components/ui/Modal/Modal';
import { importCharacterCard } from '~/services/characterImportService';
import type { Character } from '~/types';
import { Avatar } from '~/components/ui/Avatar/Avatar';
import './ImportCharacterModal.css';

interface ImportCharacterModalProps {
    onClose: () => void;
    onImport: (character: Character) => void;
}

export function ImportCharacterModal({ onClose, onImport }: ImportCharacterModalProps) {
    const [preview, setPreview] = useState<Character | null>(null);
    const [error, setError] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file?: File) => {
        setError('');
        setPreview(null);

        if (!file) return;

        try {
            const character = await importCharacterCard(file);
            setPreview(character);
        } catch (err) {
            const error = err as Error;
            setError(error.message || 'Import thất bại. Vui lòng kiểm tra lại file.');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <Modal title="Import Character Card" onClose={onClose}>
            <div 
                className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    accept=".json,.png" 
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                />
                <div className="drop-zone-content">
                    <span className="drop-icon">📥</span>
                    <strong>Drag & drop Character Card here</strong>
                    <span className="supported-formats">Supported formats: .json, .png</span>
                    <span className="click-to-browse">or click to browse</span>
                </div>
            </div>

            {error && <div className="import-error">{error}</div>}

            {preview && (
                <div className="import-preview">
                    <div className="preview-header">
                        <Avatar className="large" urlOrEmoji={preview.avatar} />
                        <h3>{preview.name}</h3>
                    </div>
                    
                    <div className="preview-details">
                        <p><strong>Description:</strong> {preview.description || <span className="empty-text">N/A</span>}</p>
                        <p><strong>Personality:</strong> {preview.personality || <span className="empty-text">N/A</span>}</p>
                        <p><strong>Scenario:</strong> {preview.scenario || <span className="empty-text">N/A</span>}</p>
                        <p><strong>First Message:</strong> {preview.firstMessage || <span className="empty-text">N/A</span>}</p>
                    </div>
                </div>
            )}

            <div className="modal-actions">
                <button className="secondary" onClick={onClose}>Cancel</button>
                <button 
                    disabled={!preview} 
                    onClick={() => preview && onImport(preview)}
                >
                    Import Character
                </button>
            </div>
        </Modal>
    );
}

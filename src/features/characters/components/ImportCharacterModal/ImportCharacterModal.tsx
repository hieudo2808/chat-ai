import { useState, useRef } from 'react';
import { Modal } from '~/components/ui/Modal/Modal';
import { importCharacterCard } from '~/services/characterImportService';
import type { Character } from '~/types';
import { Avatar } from '~/components/ui/Avatar/Avatar';
import { useSettings } from '~/features/settings/hooks/useSettings';
import { replacePlaceholders } from '~/services/promptBuilder';
import './ImportCharacterModal.css';

interface ImportCharacterModalProps {
    onClose: () => void;
    onImport: (character: Character) => void;
}

export function ImportCharacterModal({ onClose, onImport }: ImportCharacterModalProps) {
    const { settings } = useSettings();
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
        <Modal title="Nhập thẻ nhân vật (Import Card)" onClose={onClose}>
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
                    <strong>Kéo & thả file Character Card (.json hoặc .png) vào đây</strong>
                    <span className="supported-formats">Định dạng hỗ trợ: .json, .png</span>
                    <span className="click-to-browse">hoặc click để chọn file từ máy tính</span>
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
                        <p><strong>Mô tả ngắn:</strong> {replacePlaceholders(preview.description, preview.name, settings.userName || 'User', preview) || <span className="empty-text">Không có</span>}</p>
                        <p><strong>Tính cách:</strong> {replacePlaceholders(preview.personality, preview.name, settings.userName || 'User', preview) || <span className="empty-text">Không có</span>}</p>
                        <p><strong>Bối cảnh:</strong> {replacePlaceholders(preview.scenario, preview.name, settings.userName || 'User', preview) || <span className="empty-text">Không có</span>}</p>
                        <p><strong>Lời chào đầu:</strong> {replacePlaceholders(preview.firstMessage, preview.name, settings.userName || 'User', preview) || <span className="empty-text">Không có</span>}</p>
                    </div>
                </div>
            )}

            <div className="modal-actions">
                <button type="button" className="secondary" onClick={onClose}>Hủy</button>
                <button type="button" 
                    disabled={!preview} 
                    onClick={() => preview && onImport(preview)}
                >
                    Nhập nhân vật
                </button>
            </div>
        </Modal>
    );
}

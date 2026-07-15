import React from 'react';
import './Modal.css';

interface ModalProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}

export function Modal({ title, children, onClose }: ModalProps) {
    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
                        ×
                    </button>
                </div>

                <div className="modal-content">
                    {children}
                </div>
            </div>
        </div>
    );
}

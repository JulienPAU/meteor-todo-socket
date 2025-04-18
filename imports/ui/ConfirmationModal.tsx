import React from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-content">
                    <p>{message}</p>
                    <div className="modal-buttons">
                        <button className="modal-button modal-button-cancel" onClick={onCancel}>
                            Annuler
                        </button>
                        <button className="modal-button modal-button-confirm" onClick={onConfirm}>
                            Confirmer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

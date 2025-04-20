import type { FC } from "react";
import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmer",
  cancelText = "Annuler"
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content">
          <p>{message}</p>
          <div className="modal-buttons">
            <button
              type="button"
              className="modal-button modal-button-cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className="modal-button modal-button-confirm"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

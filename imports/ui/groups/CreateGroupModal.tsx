import React, { useState } from "react";
import { Meteor } from "meteor/meteor";

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateGroupModal = ({ isOpen, onClose }: CreateGroupModalProps) => {
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!groupName.trim()) {
            setError("Le nom du groupe est obligatoire");
            return;
        }

        setIsSubmitting(true);

        Meteor.callAsync("groups.create", {
            name: groupName.trim(),
            description: groupDescription.trim(),
        })
            .then(() => {
                setGroupName("");
                setGroupDescription("");
                onClose();
            })
            .catch((error) => {
                setError(`Erreur lors de la création du groupe: ${error.message}`);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const handleCancel = () => {
        setGroupName("");
        setGroupDescription("");
        setError(null);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Créer un nouveau groupe</h2>
                    <button className="modal-close-btn" onClick={handleCancel}>
                        ×
                    </button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    {error && <div className="modal-error">{error}</div>}

                    <div className="modal-field">
                        <label htmlFor="group-name">Nom du groupe *</label>
                        <input id="group-name" type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nom du groupe" maxLength={50} autoFocus />
                    </div>

                    <div className="modal-field">
                        <label htmlFor="group-description">Description (optionnelle)</label>
                        <textarea id="group-description" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} placeholder="Description du groupe" rows={3} maxLength={200} />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={handleCancel} disabled={isSubmitting}>
                            Annuler
                        </button>
                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? "Création..." : "Créer le groupe"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

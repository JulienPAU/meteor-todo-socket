import React, { useState } from "react";
import { checkNotificationPermission } from "/imports/utils/pwaManager";

export const NotificationPermissionRequest = () => {
    const [showRequest, setShowRequest] = useState(true);

    const requestPermission = async () => {
        await checkNotificationPermission();
        setShowRequest(false);
    };

    const dismiss = () => {
        setShowRequest(false);
    };

    if (!showRequest || !("Notification" in window) || Notification.permission !== "default") {
        return null;
    }

    return (
        <div className="notification-permission">
            <p>Recevoir des notifications pour les nouveaux messages?</p>
            <div className="notification-buttons">
                <button onClick={requestPermission}>Autoriser</button>
                <button onClick={dismiss}>Plus tard</button>
            </div>
        </div>
    );
};

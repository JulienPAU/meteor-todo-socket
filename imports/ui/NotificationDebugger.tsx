import React, { useState, useEffect } from "react";
import { getCurrentBadgeCount } from "/imports/utils/pwaManager";

export const NotificationDebugger = () => {
    const [showDebug, setShowDebug] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [badgeCount, setBadgeCount] = useState(getCurrentBadgeCount());
    const [apiSupport, setApiSupport] = useState({
        standard: false,
        experimental: false,
        serviceWorker: false,
    });

    // Vérifier le support des API
    useEffect(() => {
        const checkApiSupport = () => {
            const standardBadgingAvailable = "setAppBadge" in navigator && typeof navigator.setAppBadge === "function";
            const experimentalBadgingAvailable = "setExperimentalAppBadge" in navigator && typeof navigator.setExperimentalAppBadge === "function";
            const serviceWorkerAvailable = "serviceWorker" in navigator;

            setApiSupport({
                standard: standardBadgingAvailable,
                experimental: experimentalBadgingAvailable,
                serviceWorker: serviceWorkerAvailable,
            });

            addLog(`Support badge standard: ${standardBadgingAvailable ? "Oui" : "Non"}`);
            addLog(`Support badge expérimental: ${experimentalBadgingAvailable ? "Oui" : "Non"}`);
            addLog(`Support Service Worker: ${serviceWorkerAvailable ? "Oui" : "Non"}`);
        };

        checkApiSupport();

        // Écouter les messages du service worker
        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener("message", (event) => {
                if (event.data && event.data.type === "BADGE_UPDATED") {
                    addLog(`Badge mis à jour: ${event.data.count}`);
                    setBadgeCount(event.data.count);
                }
            });
            addLog("Écouteur de Service Worker configuré");
        }

        const interval = setInterval(() => {
            setBadgeCount(getCurrentBadgeCount());
        }, 5000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prevLogs) => {
            const newLogs = [`[${timestamp}] ${message}`, ...prevLogs];
            // Limiter à 10 logs maximum
            return newLogs.slice(0, 10);
        });
    };

    const toggleDebug = () => {
        setShowDebug(!showDebug);
    };

    const testBadge = async () => {
        const newCount = badgeCount > 0 ? 0 : 1;

        addLog(`Test de mise à jour du badge: ${newCount}`);

        try {
            if (newCount > 0 && "setAppBadge" in navigator) {
                await navigator.setAppBadge(newCount);
                addLog("Badge défini avec API standard");
            } else if ("clearAppBadge" in navigator) {
                await navigator.clearAppBadge();
                addLog("Badge effacé avec API standard");
            }
        } catch (error) {
            addLog(`Erreur: ${error instanceof Error ? error.message : "Inconnue"}`);
        }
    };

    if (!showDebug) {
        return (
            <button
                className="debug-button"
                onClick={toggleDebug}
                style={{
                    position: "fixed",
                    bottom: "10px",
                    right: "10px",
                    background: "#6c63ff",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                    zIndex: 1000,
                }}
            >
                🔍
            </button>
        );
    }

    return (
        <div
            className="notification-debugger"
            style={{
                position: "fixed",
                bottom: "10px",
                right: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                padding: "10px",
                borderRadius: "8px",
                maxWidth: "90%",
                width: "300px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
                zIndex: 1000,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <h3 style={{ margin: "0" }}>Débogage Notifications</h3>
                <button
                    onClick={toggleDebug}
                    style={{
                        background: "none",
                        border: "none",
                        fontSize: "16px",
                        cursor: "pointer",
                    }}
                >
                    ✖
                </button>
            </div>

            <div style={{ marginBottom: "10px" }}>
                <div>
                    Badge actuel: <strong>{badgeCount}</strong>
                </div>
                <div>
                    API standard: <strong>{apiSupport.standard ? "✅" : "❌"}</strong>
                </div>
                <div>
                    API expérimentale: <strong>{apiSupport.experimental ? "✅" : "❌"}</strong>
                </div>
                <div>
                    Service Worker: <strong>{apiSupport.serviceWorker ? "✅" : "❌"}</strong>
                </div>
            </div>

            <button
                onClick={testBadge}
                style={{
                    background: "#6c63ff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    width: "100%",
                    marginBottom: "10px",
                }}
            >
                {badgeCount > 0 ? "Effacer le badge" : "Tester le badge (1)"}
            </button>

            <div
                style={{
                    borderTop: "1px solid #ccc",
                    paddingTop: "10px",
                    maxHeight: "150px",
                    overflowY: "auto",
                    fontSize: "12px",
                }}
            >
                {logs.map((log, i) => (
                    <div key={i} style={{ marginBottom: "5px" }}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};

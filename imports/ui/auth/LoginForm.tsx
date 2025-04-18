import React, { useState } from "react";
import { Meteor } from "meteor/meteor";
import { validateUsername, validatePassword } from "../../utils/validators";

interface User {
    _id: string;
    username?: string;
}

interface LoginFormProps {
    setUser: (user: User) => void;
}

export const LoginForm = ({ setUser }: LoginFormProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) {
            setError(usernameValidation.error || "Nom d'utilisateur invalide");
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            setError(passwordValidation.error || "Mot de passe invalide");
            return;
        }

        try {
            setIsLoading(true);
            const result = await Meteor.callAsync("auth.login", { username, password });

            localStorage.setItem("Meteor.userId", result.userId);
            localStorage.setItem("Meteor.loginToken", result.token);

            setUser({ _id: result.userId, username });
        } catch (err: any) {
            setError(err.reason || "Erreur de connexion");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="login-form" onSubmit={handleLogin}>
            <h2>Connexion</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <input type="text" placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} minLength={3} maxLength={20} />
            </div>

            <div className="form-group">
                <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} minLength={6} maxLength={50} />
            </div>

            <button type="submit" disabled={isLoading}>
                {isLoading ? "Connexion en cours..." : "Se connecter"}
            </button>
        </form>
    );
};

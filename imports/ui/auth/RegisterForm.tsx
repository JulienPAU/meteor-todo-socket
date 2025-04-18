import React, { useState } from "react";
import { Meteor } from "meteor/meteor";
import { validateUsername, validatePassword } from "../../utils/validators";

interface User {
    _id: string;
    username?: string;
}

interface RegisterFormProps {
    setUser: (user: User) => void;
}

export const RegisterForm = ({ setUser }: RegisterFormProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
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

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        try {
            setIsLoading(true);
            await Meteor.callAsync("auth.register", { username, password });

            const result = await Meteor.callAsync("auth.login", { username, password });

            localStorage.setItem("Meteor.userId", result.userId);
            localStorage.setItem("Meteor.loginToken", result.token);

            setUser({ _id: result.userId, username });
        } catch (err: any) {
            setError(err.reason || "Erreur d'inscription");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="register-form" onSubmit={handleRegister}>
            <h2>Inscription</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <input type="text" placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} minLength={3} maxLength={20} />
            </div>

            <div className="form-group">
                <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} minLength={6} maxLength={50} />
            </div>

            <div className="form-group">
                <input type="password" placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} minLength={6} maxLength={50} />
            </div>

            <button type="submit" disabled={isLoading}>
                {isLoading ? "Inscription en cours..." : "S'inscrire"}
            </button>
        </form>
    );
};

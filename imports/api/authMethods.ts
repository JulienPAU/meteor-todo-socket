import { Meteor } from "meteor/meteor";
import { UsersCredentialsCollection } from "./UsersCollection";
import { Accounts } from "meteor/accounts-base";
import { TasksCollection } from "./TasksCollection";
import { validateUsername, validatePassword } from "../utils/validators";

const hashPassword = (password: string): string => {
    return Array.from(password).reduce(
        (hash, char) => (((hash << 5) - hash) + char.charCodeAt(0)) | 0,
        0
    ).toString();
};


const createDefaultTasks = async (userId: string) => {

    const user = await Meteor.users.findOneAsync({ _id: userId });
    if (user?.profile && 'defaultTasksCreated' in user.profile && user.profile.defaultTasksCreated) {
        return;
    }

    const tasksCount = await TasksCollection.find({ userId }).countAsync();

    if (tasksCount === 0) {
        console.log('Création des tâches par défaut pour l\'utilisateur:', userId);
        const defaultTasks = [
            "Bienvenue dans l'application Todo",
            "Cliquez sur la case à cocher pour marquer comme terminé",
            "Cliquez sur × pour supprimer une tâche",
            "Entrez du texte et cliquez sur Ajouter pour créer une tâche",
            "Cette application est construite avec Meteor et React"
        ];

        await Promise.all(defaultTasks.map(text =>
            TasksCollection.insertAsync({
                text,
                userId,
                createdAt: new Date(),
                isChecked: false
            })
        ));

        await Meteor.users.updateAsync(userId, {
            $set: { "profile.defaultTasksCreated": true }
        });

        console.log('Tâches par défaut créées.');
    }
};

Meteor.methods({
    async "auth.register"({ username, password }) {
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) {
            throw new Meteor.Error("invalid-username", usernameValidation.error);
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            throw new Meteor.Error("invalid-password", passwordValidation.error);
        }

        const existingUser = await UsersCredentialsCollection.findOneAsync({ username });
        if (existingUser) {
            throw new Meteor.Error("user-exists", "Cet utilisateur existe déjà");
        }

        const userId = await Meteor.users.insertAsync({
            username,
            profile: { name: username },
            createdAt: new Date()
        });

        await UsersCredentialsCollection.insertAsync({
            username,
            hashedPassword: hashPassword(password),
            createdAt: new Date()
        });

        await createDefaultTasks(userId);

        return userId;
    },
    async "auth.login"({ username, password }) {
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) {
            throw new Meteor.Error("invalid-username", usernameValidation.error);
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            throw new Meteor.Error("invalid-password", passwordValidation.error);
        }

        const userCredentials = await UsersCredentialsCollection.findOneAsync({
            username,
            hashedPassword: hashPassword(password)
        });

        if (!userCredentials) {
            throw new Meteor.Error("invalid-credentials", "Nom d'utilisateur ou mot de passe incorrect");
        }

        const meteorUser = await Meteor.users.findOneAsync({ username });

        if (!meteorUser) {
            await UsersCredentialsCollection.removeAsync({ username });
            throw new Meteor.Error("user-deleted", "Ce compte utilisateur a été supprimé");
        }

        await createDefaultTasks(meteorUser._id);

        const stampedToken = Accounts._generateStampedLoginToken();

        await Meteor.users.updateAsync(meteorUser._id, {
            $push: {
                "services.resume.loginTokens": stampedToken
            }
        });

        return {
            userId: meteorUser._id,
            token: stampedToken.token
        };
    },

    async "auth.logout"() {
        if (!this.userId) {
            throw new Meteor.Error("not-authorized", "Vous devez être connecté pour vous déconnecter");
        }

        await Meteor.users.updateAsync(this.userId, {
            $set: {
                "services.resume.loginTokens": []
            }
        });

        return true;
    },

    async "auth.getUserInfo"({ userId }) {
        if (this.userId && this.userId !== userId) {
            throw new Meteor.Error("not-authorized", "Vous n'êtes pas autorisé à accéder à ces informations");
        }

        const user = await Meteor.users.findOneAsync(userId);

        if (!user) {
            throw new Meteor.Error("user-not-found", "Utilisateur non trouvé");
        }

        return {
            _id: user._id,
            username: user.username,
            profile: user.profile
        };
    }
});
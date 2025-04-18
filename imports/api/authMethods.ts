import { Meteor } from "meteor/meteor";
import { UsersCredentialsCollection } from "./UsersCollection";
import { Accounts } from "meteor/accounts-base";

// Fonction simple pour hacher les mots de passe
const hashPassword = (password: string): string => {
    return Array.from(password).reduce(
        (hash, char) => (((hash << 5) - hash) + char.charCodeAt(0)) | 0,
        0
    ).toString();
};

Meteor.methods({
    async "auth.register"({ username, password }) {
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

        return userId;
    },
    async "auth.login"({ username, password }) {
        const user = await UsersCredentialsCollection.findOneAsync({
            username,
            hashedPassword: hashPassword(password)
        });

        if (!user) {
            throw new Meteor.Error("invalid-credentials", "Nom d'utilisateur ou mot de passe incorrect");
        }

        const meteorUser = await Meteor.users.findOneAsync({ username });

        if (!meteorUser) {
            throw new Meteor.Error("user-not-found", "Utilisateur non trouvé");
        }

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
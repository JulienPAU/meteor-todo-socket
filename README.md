# Application Todo avec Meteor et React (TypeScript)

Cette application Todo est construite avec Meteor.js, React et TypeScript. Elle permet aux utilisateurs de gérer leurs tâches quotidiennes avec authentification personnalisée et stockage des données dans MongoDB.

## Fonctionnalités

-   🔐 **Authentification** : Système d'authentification personnalisé avec stockage sécurisé des mots de passe
-   📝 **Gestion des tâches** : Création, marquage comme terminé et suppression de tâches
-   👤 **Tâches par utilisateur** : Chaque utilisateur ne voit que ses propres tâches
-   📱 **Interface responsive** : Design adapté à différentes tailles d'écran
-   🔍 **Filtrage** : Possibilité de filtrer les tâches terminées

## Prérequis

-   [Node.js](https://nodejs.org/) (version 14 ou supérieure)
-   [Meteor](https://www.meteor.com/install)
-   [MongoDB](https://www.mongodb.com/try/download/community) (inclus avec Meteor)

## Installation

1. Clonez ce dépôt :

    ```
    git clone <url-du-depot>
    cd meteor-todo-socket
    ```

2. Installez les dépendances :
    ```
    meteor npm install
    ```

## Démarrage de l'application

Pour lancer l'application en mode développement :

```
meteor run
```

L'application sera accessible à l'adresse : [http://localhost:3000](http://localhost:3000)

## Structure du projet

```
meteor-todo-socket/
├── client/              # Code côté client
│   ├── main.css         # Styles CSS
│   ├── main.html        # Point d'entrée HTML
│   └── main.tsx         # Point d'entrée JavaScript côté client
│
├── imports/             # Modules importés par le client et le serveur
│   ├── api/             # API et collections
│   │   ├── authMethods.ts             # Méthodes d'authentification
│   │   ├── TasksCollection.ts         # Collection de tâches
│   │   ├── tasksMethods.ts            # Méthodes pour manipuler les tâches
│   │   ├── TasksPublication.ts        # Publications de tâches
│   │   └── UsersCollection.ts         # Collection d'utilisateurs
│   │
│   └── ui/              # Composants React
│       ├── App.tsx                    # Composant principal
│       ├── Task.tsx                   # Composant pour une tâche
│       ├── TaskForm.tsx               # Formulaire pour ajouter une tâche
│       └── auth/                      # Composants d'authentification
│           ├── LoginForm.tsx          # Formulaire de connexion
│           └── RegisterForm.tsx       # Formulaire d'inscription
│
├── server/              # Code côté serveur
│   └── main.ts          # Point d'entrée côté serveur
│
├── tests/               # Tests
│
├── package.json         # Dépendances NPM
├── tsconfig.json        # Configuration TypeScript
└── README.md            # Documentation du projet
```

## Comment utiliser l'application

1. **Inscription/Connexion** :

    - Créez un compte en utilisant le formulaire d'inscription
    - Ou connectez-vous avec le compte de démonstration :
        - Utilisateur : `demo`
        - Mot de passe : `password123`

2. **Gestion des tâches** :

    - Ajoutez une tâche en entrant du texte dans la zone de saisie et en cliquant sur "Ajouter"
    - Marquez une tâche comme terminée en cliquant sur la case à cocher
    - Supprimez une tâche en cliquant sur le bouton × à droite

3. **Filtrage** :

    - Utilisez le bouton "Masquer les terminées" pour filtrer les tâches

4. **Déconnexion** :
    - Cliquez sur le bouton "Déconnexion" pour vous déconnecter

## Système d'authentification personnalisé

Cette application utilise un système d'authentification personnalisé basé sur les tokens :

1. Les mots de passe sont hachés avant d'être stockés dans la base de données
2. Les informations d'authentification sont stockées séparément des données utilisateur
3. Un token est généré à la connexion et stocké dans le localStorage
4. Ce token est utilisé pour authentifier les requêtes ultérieures

## Technologies utilisées

-   [Meteor](https://www.meteor.com/) - Framework full-stack JavaScript
-   [React](https://reactjs.org/) - Bibliothèque UI
-   [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript avec typage statique
-   [MongoDB](https://www.mongodb.com/) - Base de données NoSQL

## Licence

MIT

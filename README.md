# Application Todo avec Meteor et React (TypeScript)

Cette application Todo est construite avec Meteor.js, React et TypeScript. Elle permet aux utilisateurs de gérer leurs tâches quotidiennes avec authentification personnalisée, messagerie instantanée et stockage des données dans MongoDB.

## Fonctionnalités

-   🔐 **Authentification** : Système d'authentification personnalisé avec stockage sécurisé des mots de passe
-   📝 **Gestion des tâches** : Création, modification, marquage comme terminé et suppression de tâches
-   👥 **Fonction collaborative** : Création de groupes pour collaborer sur des tâches et discuter en temps réel
-   👤 **Tâches par utilisateur** : Chaque utilisateur ne voit que ses propres tâches
-   💬 **Chat en temps réel** : Messagerie instantanée entre utilisateurs
-   🔔 **Notifications** : Alertes pour les messages non lus et activités de groupe
-   👀 **Indicateurs d'activité** : Voir quand les autres utilisateurs sont en train d'écrire ou de modifier une tâche
-   📱 **Interface responsive** : Design adapté à différentes tailles d'écran
-   🔍 **Filtrage** : Possibilité de filtrer les tâches terminées
-   🛡️ **Validation des données** : Sécurisation des inputs utilisateur côté client et serveur

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
│   ├── main.css         # Point d'entrée des styles CSS (imports)
│   ├── main.html        # Point d'entrée HTML
│   ├── main.tsx         # Point d'entrée JavaScript côté client
│   └── styles/          # Styles CSS séparés par composants
│       ├── variables.css        # Variables CSS et styles de base
│       ├── layout.css           # Mise en page principale
│       ├── tasks.css            # Styles pour les tâches
│       ├── auth.css             # Styles pour l'authentification
│       ├── modal.css            # Styles pour les modales
│       ├── chat.css             # Styles pour le chat
│       ├── navbar.css           # Styles pour la barre de navigation
│       ├── groups.css           # Styles pour les fonctionnalités collaboratives
│       └── responsive.css       # Media queries pour la responsivité
│
├── imports/             # Modules importés par le client et le serveur
│   ├── api/             # API et collections
│   │   ├── authMethods.ts                # Méthodes d'authentification
│   │   ├── GroupsCollection.ts           # Collection pour les groupes collaboratifs
│   │   ├── groupsMethods.ts              # Méthodes pour gérer les groupes
│   │   ├── GroupsPublication.ts          # Publication des groupes
│   │   ├── MessagesCollection.ts         # Collection de messages
│   │   ├── messagesMethods.ts            # Méthodes pour manipuler les messages
│   │   ├── MessagesPublication.ts        # Publication des messages
│   │   ├── TasksCollection.ts            # Collection de tâches
│   │   ├── tasksMethods.ts               # Méthodes pour manipuler les tâches
│   │   ├── TasksPublication.ts           # Publications de tâches
│   │   ├── UsersCollection.ts            # Collection d'utilisateurs
│   │   ├── UsersPublication.ts           # Publication des utilisateurs
│   │   ├── UserActivityCollection.ts     # Collection pour l'activité des utilisateurs
│   │   ├── userActivityMethods.ts        # Méthodes pour l'activité des utilisateurs
│   │   └── UserActivityPublication.ts    # Publication des activités utilisateur
│   │
│   ├── types/           # Types TypeScript
│   │   ├── group.ts             # Types pour les groupes collaboratifs
│   │   ├── message.ts           # Types pour les messages
│   │   ├── task.ts              # Types pour les tâches
│   │   └── user.ts              # Types pour les utilisateurs
│   │
│   ├── utils/           # Utilitaires
│   │   └── validators.ts              # Validation des données utilisateur
│   │
│   └── ui/              # Composants React
│       ├── App.tsx                    # Composant principal
│       ├── ConfirmationModal.tsx      # Modal de confirmation
│       ├── Navbar.tsx                 # Barre de navigation avec notifications
│       ├── Task.tsx                   # Composant pour une tâche
│       ├── TaskForm.tsx               # Formulaire pour ajouter une tâche
│       ├── auth/                      # Composants d'authentification
│       │   ├── LoginForm.tsx          # Formulaire de connexion
│       │   └── RegisterForm.tsx       # Formulaire d'inscription
│       ├── chat/                      # Composants de chat
│       │   ├── ChatContainer.tsx      # Conteneur principal du chat
│       │   ├── ChatWindow.tsx         # Fenêtre de conversation
│       │   ├── MessageInput.tsx       # Saisie de messages
│       │   └── UsersList.tsx          # Liste des utilisateurs
│       └── groups/                    # Composants collaboratifs
│           ├── CreateGroupModal.tsx   # Modal pour créer un groupe
│           ├── GroupChat.tsx          # Chat de groupe
│           ├── GroupMembers.tsx       # Gestion des membres
│           ├── GroupsContainer.tsx    # Conteneur principal des groupes
│           ├── GroupsList.tsx         # Liste des groupes
│           └── GroupTasks.tsx         # Tâches collaboratives
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

### Système de tâches

1. **Inscription/Connexion** :

    - Créez un compte en utilisant le formulaire d'inscription

2. **Gestion des tâches** :

    - Ajoutez une tâche en entrant du texte dans la zone de saisie et en cliquant sur "Ajouter"
    - Modifiez une tâche en cliquant sur son texte
    - Marquez une tâche comme terminée en cliquant sur la case à cocher
    - Supprimez une tâche en cliquant sur le bouton × à droite

3. **Filtrage** :

    - Utilisez le bouton "Masquer les terminées" pour filtrer les tâches

4. **Collaboration en temps réel** :

    - Voyez lorsque d'autres utilisateurs sont en train d'écrire une nouvelle tâche
    - Voyez lorsque d'autres utilisateurs sont en train de modifier une tâche

### Système de chat

1. **Accéder au chat** :

    - Cliquez sur le bouton "Chat" dans la barre d'en-tête

2. **Discuter avec d'autres utilisateurs** :

    - Sélectionnez un utilisateur dans la liste à gauche
    - Envoyez des messages via le champ de texte en bas de l'écran
    - Les messages non lus sont indiqués par un compteur rouge

3. **Retourner aux tâches** :

    - Cliquez sur "Retour aux tâches" pour revenir à la liste des tâches

4. **Déconnexion** :
    - Cliquez sur le bouton "Déconnexion" pour vous déconnecter

### Système collaboratif

1. **Accéder à l'espace collaboratif** :

    - Cliquez sur le bouton "Collaboratif" dans la barre de navigation

2. **Créer un groupe** :

    - Cliquez sur le bouton "Créer un groupe"
    - Remplissez le nom du groupe et une description optionnelle
    - Sélectionnez les membres à ajouter au groupe
    - Cliquez sur "Créer" pour valider

3. **Utiliser un groupe** :

    - Sélectionnez un groupe dans la liste à gauche pour y accéder
    - Naviguez entre les onglets pour accéder aux différentes fonctionnalités :
        - **Tâches** : Gérez des tâches collaboratives au sein du groupe
        - **Discussion** : Chattez avec tous les membres du groupe simultanément
        - **Membres** : Consultez et gérez les membres du groupe

4. **Gestion des tâches collaboratives** :

    - Créez des tâches accessibles à tous les membres du groupe
    - Suivez l'avancement des tâches partagées
    - Voyez qui est en train de modifier une tâche en temps réel

5. **Notifications** :
    - Recevez des alertes dans la barre de navigation lorsqu'il y a de l'activité dans vos groupes
    - Restez informé des nouvelles tâches et messages dans les groupes dont vous êtes membre

## Système d'authentification personnalisé

Cette application utilise un système d'authentification personnalisé basé sur les tokens :

1. Les mots de passe sont hachés avant d'être stockés dans la base de données
2. Les informations d'authentification sont stockées séparément des données utilisateur
3. Un token est généré à la connexion et stocké dans le localStorage
4. Ce token est utilisé pour authentifier les requêtes ultérieures

## Système d'indicateurs d'activité en temps réel

L'application utilise un système d'indicateurs d'activité qui permet aux utilisateurs de voir :

1. Quand quelqu'un est en train d'ajouter une nouvelle tâche
2. Quand quelqu'un est en train de modifier une tâche spécifique
3. Ces indicateurs fonctionnent même si plusieurs utilisateurs sont connectés avec le même compte

## Sécurisation des données utilisateur

L'application implémente une validation complète des données à deux niveaux pour protéger contre les entrées malveillantes :

### Validation côté client

-   Vérification des champs obligatoires
-   Limitation de la longueur des inputs avec les attributs HTML `minlength` et `maxlength`
-   Validation des formats avant toute soumission au serveur
-   Feedback d'erreur immédiat pour l'utilisateur

### Validation côté serveur

-   Validation indépendante des données reçues par le serveur
-   Règles strictes pour les noms d'utilisateur (3-20 caractères, alphanumériques avec tirets/underscores)
-   Règles pour les mots de passe (minimum 6 caractères)
-   Nettoyage du texte des tâches pour éliminer tout code HTML potentiellement dangereux
-   Limitation de la longueur des messages (maximum 500 caractères)

Cette double couche de validation garantit la sécurité des données même si la validation côté client est contournée.

## Structuration du code

-   **Architecture**: Modèle-Vue-Contrôleur (MVC)
-   **Typages**: Utilisation extensive des interfaces TypeScript pour garantir la sécurité des types
-   **CSS**: Styles séparés par composants avec une approche modulaire
-   **Publications/Souscriptions**: Utilisation du modèle de publication/souscription de Meteor pour les données en temps réel
-   **Validation**: Système de validation modulaire et réutilisable dans `imports/utils/validators.ts`

## Technologies utilisées

-   [Meteor](https://www.meteor.com/) - Framework full-stack JavaScript
-   [React](https://reactjs.org/) - Bibliothèque UI
-   [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript avec typage statique
-   [MongoDB](https://www.mongodb.com/) - Base de données NoSQL
-   [DDP](https://github.com/meteor/meteor/tree/devel/packages/ddp) - Protocole de données distribuées pour la communication en temps réel

## Notes de développement

### Erreurs TypeScript connues

Vous pourriez rencontrer cette erreur dans votre éditeur :

```
Le fichier 'f:/meteor/meteor-todo-socket/.meteor/local/types/packages.d.ts' n'est pas un module.ts(2306)
```

Cette erreur est liée à la façon dont Meteor génère les définitions de types pour ses packages. Elle n'affecte pas le fonctionnement de l'application et peut être ignorée.

## Licence

MIT

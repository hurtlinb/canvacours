# Canvacours

Cette application Node.js expose une interface web permettant d'organiser les activités d'un cours. Elle repose désormais sur une API Express connectée à MariaDB pour stocker les données métiers.

## Architecture

- `index.js` : point d'entrée qui démarre le serveur.
- `src/config.js` : centralise la configuration (port, chemins, version de l'application).
- `src/server.js` : crée l'application Express, monte l'API et sert les ressources statiques.
- `src/database.js` : initialisation de la base MariaDB et accès au stockage de l'état.
- `src/routes/api.js` : expose les routes REST utilisées par le front-end.
- `src/default-state.js` : construit l'état initial du tableau de bord.
- `public/index.html` : gabarit HTML de l'application (avec un placeholder pour la version).
- `public/styles/` : feuilles de styles organisées par thématique.
- `public/app.js` : logique front-end (drag and drop, appels API pour la persistance côté serveur, etc.).

Cette organisation facilite les contributions en séparant clairement le serveur, le HTML, le CSS et le JavaScript.

## Installation

L'application dépend d'Express et du connecteur `mariadb`. Installez les dépendances puis configurez l'accès à votre base de données :

```bash
npm install
```

## Démarrage

```bash
npm start
```

Le serveur est accessible par défaut sur [http://localhost:3000](http://localhost:3000).

Variables d'environnement disponibles :

- `PORT` : port d'écoute du serveur (défaut : `3000`).
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_CONNECTION_LIMIT` : paramètres de connexion MariaDB.

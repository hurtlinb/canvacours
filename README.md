# Canvacours

Cette application Node.js expose une interface web permettant d'organiser les activités d'un cours. Elle repose sur un petit serveur HTTP qui sert des fichiers statiques.

## Architecture

- `index.js` : point d'entrée qui démarre le serveur.
- `src/config.js` : centralise la configuration (port, chemins, version de l'application).
- `src/server.js` : crée le serveur HTTP et délègue la gestion des requêtes.
- `src/request-handler.js` : sert la page d'accueil et les ressources statiques du dossier `public/`.
- `public/index.html` : gabarit HTML de l'application (avec un placeholder pour la version).
- `public/styles/` : feuilles de styles organisées par thématique.
- `public/app.js` : logique front-end (drag and drop, gestion du stockage local, etc.).

Cette organisation facilite les contributions en séparant clairement le serveur, le HTML, le CSS et le JavaScript.

## Installation

Aucune dépendance externe n'est nécessaire. Assurez-vous simplement d'avoir Node.js installé.

```bash
npm install
```

## Démarrage

```bash
npm start
```

Le serveur est accessible par défaut sur [http://localhost:3000](http://localhost:3000).

Vous pouvez définir la variable d'environnement `PORT` pour modifier le port d'écoute.

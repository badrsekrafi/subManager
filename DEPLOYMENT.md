# Déploiement Vercel

Le projet se déploie depuis ce dossier racine. `vercel.json` construit React
dans `client/dist` et expose Express via `api/index.js`, sur le même domaine.

## Prérequis

- Accès réseau à `api.vercel.com` et `registry.npmjs.org`.
- Session Vercel ouverte avec `npx vercel login`.
- Base MongoDB Atlas accessible depuis Vercel.

## Configuration

1. Depuis ce dossier, exécuter `npx vercel link` et sélectionner le compte
   et le projet souhaités (ou créer un projet `gestion-abonnements`).
2. Vérifier le compte et le projet avec `npx vercel project inspect`.
3. Dans les paramètres Vercel du projet, ajouter pour Production et Preview :
   - `MONGODB_URI` : connexion MongoDB Atlas existante dans `server/.env`.
   - `JWT_SECRET` : une nouvelle valeur aléatoire et confidentielle.
   - `ADMIN_EMAIL` : adresse de l'administrateur.
   - `ADMIN_INITIAL_PASSWORD` : mot de passe initial confidentiel.
   - `NODE_ENV` : `production`.
   Ne pas copier de secrets dans le code ni les envoyer dans un chat.
4. Conserver la racine du projet sur ce dossier, avec Node.js 24.
5. Exécuter `npx vercel deploy` pour une prévisualisation, vérifier la connexion
   et les pages, puis `npx vercel deploy --prod` pour la mise en production.

`server/.env` reste local et est exclu des fichiers envoyés à Vercel.
La création des données initiales ne remplace pas un administrateur existant.

## Vérification

- `/login` affiche l'application, même après rechargement direct.
- `/api/health` retourne du JSON avec `success: true`.
- La connexion puis une consultation des clients vérifient l'accès MongoDB
  et la persistance du cookie HTTPS.

## État de la préparation

Le build React et le chargement serverless de l'API ont été vérifiés localement.
Le déploiement distant n'a pas pu être effectué : les accès npm et Vercel
échouaient avec des erreurs réseau pendant la préparation.

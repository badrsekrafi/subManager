# Déploiement sur Render

Une seule Web Service héberge React et Express sur le même domaine. MongoDB
Atlas reste la base de données. La configuration se trouve dans `render.yaml`.

## Préparation vérifiée

- Construction du frontend : `npm run build`.
- Démarrage : `npm start` depuis la racine.
- Écoute HTTP sur `0.0.0.0` avec le port fourni par Render.
- Routage React pour les liens directs, et API sous `/api`.
- Le mot de passe MongoDB et les fichiers `.env` sont exclus par `.gitignore`.

## Mise en ligne

1. Pousser le projet, avec `render.yaml`, dans un dépôt GitHub, GitLab ou
   Bitbucket. Garder le dépôt privé s'il contient des informations personnelles.
2. Dans https://dashboard.render.com/select-repo?type=blueprint, connecter ce
   dépôt et choisir le Blueprint `render.yaml` à la racine.
3. Renseigner les trois variables demandées :
   - `MONGODB_URI` : la connexion Atlas configurée dans `server/.env`.
   - `ADMIN_EMAIL` : adresse de l'administrateur initial.
   - `ADMIN_INITIAL_PASSWORD` : mot de passe initial confidentiel.
   Render génère automatiquement `JWT_SECRET`.
4. Vérifier que MongoDB Atlas autorise les connexions depuis les adresses
   sortantes de la Web Service Render, puis appliquer le Blueprint.
5. Une fois le déploiement marqué Live, ouvrir le lien fourni par Render.
   Vérifier `/api/health`, `/login`, la connexion et les données clients.

La configuration choisit une instance gratuite. Le premier accès après une
période d'inactivité peut nécessiter un redémarrage de la service.

## État

La configuration locale est prête. Aucun déploiement distant n'est confirmé.
Le projet local n'avait pas de Git remote lors de la préparation et les outils
Render ne sont pas connectés à cette session.

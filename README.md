# SubManager — Application MERN de Gestion des Abonnements Numériques

Application complète, sécurisée, moderne et professionnelle conçue pour les administrateurs et revendeurs d'abonnements numériques (Netflix, Spotify, Gemini, Claude, ChatGPT, YouTube Premium, Disney+, etc.).

---

## 🚀 Démarrage Rapide (En 1 Seul Clic)

Double-cliquez simplement sur le fichier :
👉 **`start.bat`** (ou **`demarrer.bat`**)

Ce script va automatiquement :
1. Lancer le backend Express (Port 5000)
2. Lancer le frontend Vite + React (Port 5173)
3. Ouvrir votre navigateur sur **http://localhost:5173**

Pour arrêter les serveurs à tout moment : double-cliquez sur **`stop.bat`**.

---

## 🔑 Identifiants Administrateur Initiaux

Configurez `ADMIN_EMAIL` et `ADMIN_INITIAL_PASSWORD` dans `server/.env` pour
créer le premier compte administrateur. Utilisez ces identifiants pour vous connecter.

> ⚠️ **Sécurité** : Lors de votre première connexion, l'application vous demandera obligatoirement de définir un nouveau mot de passe personnalisé.

---

## ⚙️ Configuration Base de Données MongoDB

Le fichier `server/.env` contient la chaîne de connexion :
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gestion-abonnements
JWT_SECRET=generate-a-long-random-private-secret
ADMIN_EMAIL=admin@example.com
ADMIN_INITIAL_PASSWORD=choose-a-private-initial-password
NODE_ENV=development
```

### Options de base de données :
1. **MongoDB en Local** : Assurez-vous que le service MongoDB tourne sur votre machine (`mongodb://localhost:27017`).
2. **MongoDB Atlas (Cloud gratuit - Recommandé si vous n'avez pas MongoDB installé)** :
   - Créez un cluster gratuit sur [mongodb.com](https://www.mongodb.com/atlas)
   - Remplacez `MONGODB_URI` dans `server/.env` par votre URL Atlas :
     `MONGODB_URI=mongodb+srv://monUser:monPassword@cluster0.xxxxx.mongodb.net/gestion-abonnements`

---

## 📊 Données de Démonstration

Pour insérer immédiatement des clients et abonnements exemples (Mohamed Ben Ali, Fatma Trabelsi, etc.) :
👉 Double-cliquez sur **`seed_donnees_demo.bat`** (ou lancez `npm run seed` dans le dossier `server`).

---

## 🌟 Fonctionnalités Incluses

1. **Authentification & Sécurité** :
   - Cookie HttpOnly sécurisé avec JWT
   - Hashage bcrypt
   - Protection contre les attaques bruteforce (Rate Limiting)
   - Changement obligatoire du mot de passe initial
2. **Tableau de Bord & Analytics** :
   - 8 cartes statistiques (Clients, Actifs, Expirations 7j, Expirés, CA mensuel, Total encaissé, Impayés, Reste dû)
   - Graphique interactif du CA mensuel sur 12 mois avec filtre par année
   - Diagramme circulaire de répartition par service (Netflix, Spotify, Gemini...)
   - Raccourci vers les abonnements proches de l'expiration et derniers paiements
3. **Gestion des Clients** :
   - Liste détaillée avec totaux facturés, payés et restants
   - Fiche client complète avec historique des abonnements et paiements
   - Ajout, modification et archivage
4. **Gestion des Abonnements** :
   - Suivi calendaire rigoureux de la validité
   - Statuts dynamiques : *Actif*, *Expire bientôt*, *Expiré*, *Annulé*
   - Statuts de paiement indépendants : *Payé*, *Partiellement payé*, *Impayé*
   - Renouvellement avec préservation de l'historique financier
5. **Gestion Financière & Impayés** :
   - Encaissement multi-versements (Espèces, Virement, D17, Autre)
   - Page dédiée aux impayés avec bouton d'encaissement direct
   - Disparition automatique des clients une fois soldés
6. **Expirations & Alertes** :
   - Codes couleurs par niveau d'urgence (Aujourd'hui, Demain, 3 jours, 7 jours)
   - Renouvellement immédiat en 1 clic
7. **Paramètres Administrateur** :
   - Mise à jour du profil et mot de passe
   - Basculement Mode Sombre / Mode Clair
   - Gestion du catalogue des services
   - Export CSV intégral (Clients, Abonnements, Paiements)

---

## 🛠️ Commandes Manuelles

Si vous préférez lancer manuellement depuis le terminal :

```bash
# Lancer le backend
cd server
npm start

# Lancer le frontend
cd client
npm run dev
```

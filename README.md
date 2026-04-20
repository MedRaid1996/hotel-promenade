# 🏨 Hôtel La Promenade - Plateforme de Gestion des Événements

Version actuelle: `v1.6.0`

Nouvelle priorite operationnelle:
- Concierge Telegram admin-only avec debrief vocal en francais
- Tests obligatoires: `npm run test:master` avant toute presentation client ou validation finale
- En mode developpement, si le port `3000` est deja pris, le serveur bascule automatiquement sur le port suivant disponible au lieu de crasher sous `nodemon`

Une plateforme web interne pour la gestion des événements, services, salles et facturation, repensée avec une direction plus hôtelière, plus éditoriale et plus premium.

## Vision Produit

- Le produit doit se comporter comme un **site web hôtelier haut de gamme**, pas comme une application installable générique.
- La créativité visuelle est un objectif de premier plan: hero forts, composition éditoriale, cartes premium, ambiance locale et éléments immersifs.
- Si **21st Magic MCP** est disponible dans Codex, il doit être utilisé pour pousser les idées de layout et de composants vers quelque chose de plus créatif.
- Toute évolution notable doit être reportée dans cette documentation avec une **version** et un résumé clair.

## Historique des Versions

### v1.6.0 - Master Test and Presentation Readiness Pass
- Ajout d un veritable `test:master` qui enchaine la suite node, un parcours navigateur Playwright pour tous les roles et un stress test end-to-end.
- Ajout d un test navigateur qui verifie les presets email/mot de passe, la connexion de chaque profil, le theme, la barre laterale et l acces a toutes les pages visibles par role.
- Ajout de tests de resilience du concierge IA quand les fournisseurs tombent: pas de langage quota, token ou timeout renvoye a l utilisateur et bascule propre vers le mode secours.
- Durcissement du widget meteo pour retomber proprement sans bruit runtime si le fournisseur externe repond mal ou trop lentement.
- Workflow presentation: si le moindre probleme apparait pendant le master test, il doit etre corrige puis toute la boucle doit repartir depuis zero.

### v1.5.0 - Accessibility, Audit and Role Dashboard Pass
- Ajout d un durcissement accessibilite sur la SPA: meilleurs labels ARIA, navigation clavier plus fiable, focus visible et pieges de focus pour les modales.
- Refonte de la navigation laterale et des tabs en vrais boutons pour fiabiliser le comportement clavier et la lecture d etat actif.
- Ajout d un journal d audit admin avec recherche, filtres par action et entite, et lecture plus claire des traces.
- Ajout d un bloc de dashboard beaucoup plus role-aware pour admin, organisateur, coordonnateur et compta avec signaux, priorites et actions rapides.
- Ajout d un test smoke supplementaire pour verifier que l audit est bien reserve aux administrateurs.

### v1.4.1 - Reliability Pass for Navigation, Login and Concierge IA
- Correction des handlers frontend exposes explicitement pour que la barre laterale, les pages et les actions inline restent fonctionnelles apres connexion.
- Ajout d une attente de readiness cote serveur pour eviter les connexions trop lentes ou les requetes qui arrivent avant la fin du schema et du seed.
- Reorganisation des fournisseurs IA pour essayer Gemini d abord, puis Groq 8B, puis Groq 70B, avec cooldown automatique apres quota ou timeout.
- Reduction de la charge de tokens cote concierge IA avec historique plus court et reponses plus compactes.
- Ajout d un mode automatique direct: si les fournisseurs IA tombent, le concierge peut encore lister salles, evenements, notifications, rapports et executer des actions simples sans LLM.

### v1.4.0 - Telegram Concierge + Full Stress Validation
- Ajout d'un concierge Telegram admin-only pour les debriefs operationnels via `@concierge10_bot`.
- Generation d'un debrief vocal en francais avec synthese audio locale Windows, plus envoi texte + audio sur Telegram.
- Ajout des endpoints admin `GET /api/concierge/status` et `POST /api/concierge/debrief`.
- Ajout d'un test automatise du concierge Telegram avec faux serveur Telegram et generation audio reelle.
- Ajout d'un stress test complet couvrant pages, authentification, roles, reservations, services, facturation, envoi email, rapports, IA et debrief concierge.

### v1.3.0 — Luxury UX + Email Delivery Pass
- Correction du bug de navigation causé par la stratégie globale de sanitation HTML, qui bloquait les actions dynamiques de la barre latérale et des pages.
- Retour des identifiants de démonstration visibles dans l'écran de connexion, avec synchronisation des comptes démo côté serveur pour que les boutons de rôle fonctionnent réellement.
- Amélioration de la sensation de connexion avec timeout réseau, état de chargement plus clair et initialisation plus fluide.
- Ajout de l'envoi de facture par courriel via Gmail/Nodemailer depuis la boîte de facturation configurée.
- Renforcement des instructions projet pour viser une direction **hôtel de luxe** et utiliser 21st Magic MCP de manière plus agressive quand il est disponible.

### v1.2.0 — Creative Hospitality Pass
- Refonte plus créative du login et du tableau de bord avec une direction plus proche d'un hôtel haut de gamme.
- Ajout d'un hero enrichi et d'un **showcase 3D** de collections/espaces sur le dashboard.
- Correction du mode clair pour éviter les cas de texte sombre sur fond sombre.
- Amélioration de la sensation de connexion avec un état de chargement plus propre et une initialisation moins séquentielle.
- Conservation des informations de connexion visibles dans l'interface pour les démonstrations locales.

### v1.1.0 — Website-First Security & Operations
- Durcissement des permissions, de l'accès aux événements, des paiements et des rapports.
- Passage à un comportement **website-first** avec suppression des invites d'installation/PWA.
- Ajout de météo, carte locale, rendu temps réel stabilisé et tests smoke.
- Ajout des instructions de workflow: tests obligatoires après modifications.

## ✨ Caractéristiques

- **Authentification sécurisée** avec JWT
- **Gestion des événements** - créer, modifier, supprimer
- **Gestion des invités** - ajouter et gérer les invités
- **Demandes de services** - catering, décoration, etc.
- **Réservation de salles** - gérer la disponibilité
- **Facturation** - créer et gérer les factures
- **Gestion des utilisateurs** (admin)
- **Journal d audit administrateur** avec recherche et filtres
- **Interface premium** avec design hôtelier éditorial, hero immersifs et cartes plus haut de gamme
- **Accessibilite renforcee** avec navigation clavier, focus visible et labels ARIA plus propres
- **Météo locale + carte du quartier** pour contextualiser la journée et l'expérience sur place
- **Showcase 3D** d'espaces/ambiances pour donner plus de caractère au dashboard
- **Envoi de facture par courriel** depuis la boîte Gmail configurée pour l'hôtel
- **Concierge Telegram administrateur** pour recevoir un debrief vocal en francais sur les evenements, les salles et les revenus du jour
- **Master test de presentation** avec suite backend, parcours navigateur multi-roles et stress test operationnel
- **Responsive** - fonctionne sur desktop et mobile

## Workflow Projet

- Avant une presentation client, une demo importante ou une validation finale: `npm run test:master`
- Si le master test revele le moindre probleme, corriger puis relancer le master test depuis zero

- Après toute modification importante de comportement ou d'interface: `npm test`
- Si auth, permissions, paiements, rapports ou uploads changent: `npm test` puis `npm start`
- Après chaque ajout notable: mettre à jour ce `README.md` avec la version et le résumé du changement
- Les passes UI doivent aussi verifier accessibilite minimale: labels ARIA, navigation clavier, focus visible et contraste lisible en mode sombre comme en mode clair.

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
npx playwright install chromium
```

Si des dépendances échouent, vous pouvez continuer et les installer manuellement plus tard:
```bash
npm install sqlite3 bcryptjs jsonwebtoken
```

### 2. Démarrage du serveur
```bash
npm start
```

Vous verrez: `Server running on http://localhost:3000`

### 3. Accès à l'application
Ouvrez votre navigateur: **http://localhost:3000**

## 🔑 Compte de Test

### Admin par défaut:
- **Email**: admin@lapromenade.com
- **Password**: admin123

Remarque: cette présaisie est conservée pour les démonstrations locales et le confort de test dans l'interface.

### Comptes démo par rôle:
- **Organisateur**: organisateur@lapromenade.com / admin123
- **Coordonnateur**: coordonnateur@lapromenade.com / admin123
- **Comptabilité**: compta@lapromenade.com / admin123

### Créer un nouveau compte:
1. Cliquez sur "Créer un compte" à la page de connexion
2. Remplissez les informations
3. Sélectionnez un rôle (Organisateur, Coordinateur, Comptabilité)
4. Cliquez "Créer un compte"

## 📁 Structure du Projet

```
hotel-promenade/
├── server.js                 # Serveur Express principal
├── package.json             # Dépendances npm
├── .env                     # Variables d'environnement
├── database.db              # Base de données SQLite (créée automatiquement)
├── public/
│   ├── index.html          # Interface principale (votre HTML)
│   └── api-integration.js  # Script d'intégration API
└── routes/
    └── (routes API dans server.js)
```

## 🔌 API Endpoints

### Authentification
```
POST   /api/auth/login       - Se connecter
POST   /api/auth/register    - S'inscrire
```

### Événements
```
GET    /api/events           - Lister les événements
POST   /api/events           - Créer un événement
PUT    /api/events/:id       - Modifier un événement
DELETE /api/events/:id       - Supprimer un événement
```

### Invités
```
GET    /api/guests           - Lister les invités
POST   /api/guests           - Ajouter un invité
PUT    /api/guests/:id       - Modifier un invité
```

### Services
```
GET    /api/services         - Lister les services
POST   /api/services         - Créer une demande
PUT    /api/services/:id     - Modifier une demande
```

### Salles
```
GET    /api/rooms            - Lister les salles
POST   /api/rooms/reserve    - Réserver une salle
```

### Factures
```
GET    /api/invoices         - Lister les factures
POST   /api/invoices         - Créer une facture
PUT    /api/invoices/:id     - Modifier une facture
```

### Utilisateurs (Admin)
```
GET    /api/users            - Lister les utilisateurs
POST   /api/users            - Créer un utilisateur
DELETE /api/users/:id        - Désactiver un utilisateur
```

## 🔐 Authentification

Le serveur utilise JWT (JSON Web Tokens). Les requêtes API doivent inclure:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

Le token est automatiquement stocké dans `sessionStorage` après la connexion.

Ce projet doit se comporter comme un site web interne premium, pas comme une application installable. Les éléments PWA et les invites d'installation ont été retirés de l'interface.

## 📊 Base de Données

SQLite est utilisé pour stocker les données. La BD est créée automatiquement au premier lancement.

### Tables créées:
- `users` - Utilisateurs
- `events` - Événements
- `guests` - Invités
- `services` - Services
- `rooms` - Salles
- `reservations` - Réservations
- `invoices` - Factures
- `payments` - Paiements

## ⚙️ Configuration

Le fichier `.env` contient:

```
PORT=3000                  # Port du serveur
JWT_SECRET=...            # Clé secrète pour JWT
NODE_ENV=development      # Environnement
BOOTSTRAP_ADMIN_PASSWORD=admin123
ENABLE_DEMO_USERS=true
DEMO_USER_PASSWORD=admin123
GMAIL_USER=...            # Boîte Gmail utilisée pour envoyer les factures
GMAIL_APP_PASS=...        # App Password Gmail
```

En production, changez la `JWT_SECRET` par une valeur très sécurisée.

## Courriel de Facturation

Les factures peuvent maintenant être envoyées au client directement depuis l'interface de facturation.

Pré-requis:
- `GMAIL_USER`
- `GMAIL_APP_PASS`
- `HOTEL_BILLING_FROM_NAME` optionnel

Le bouton d'envoi:
- détecte l'adresse du client si elle est déjà présente
- permet de la corriger avant envoi
- expédie un PDF de facture en pièce jointe depuis la boîte configurée

## 🛠️ Intégration API dans le Frontend

L'HTML inclus utilise des données locales (objet `DATA`). Pour le connecter à l'API:

### 1. Incluez le script d'intégration
Ajoutez ceci dans le `<head>` ou avant la fermeture `</body>`:

```html
<script src="/api-integration.js"></script>
```

### 2. Modifiez les formulaires pour utiliser l'API

Exemple pour la création d'événement:

```javascript
// Au lieu de:
// DATA.events.push(newEvent);

// Faites:
await createEvent({
  name: document.getElementById('ev-name').value,
  type: document.getElementById('ev-type').value,
  date: document.getElementById('ev-date').value,
  time: document.getElementById('ev-time').value,
  duration: document.getElementById('ev-duration').value,
  budget: parseInt(document.getElementById('ev-budget').value),
  guests: parseInt(document.getElementById('ev-guests').value),
  room: document.getElementById('ev-room').value,
  organizer: document.getElementById('ev-organizer').value,
  contact: document.getElementById('ev-contact').value,
  description: document.getElementById('ev-desc').value
});
```

### 3. Charger les données de l'API

Au lieu de charger les données locales, appelez:

```javascript
// Lors du login
await loadAllData();
```

## 🧪 Test de l'API

### Avec cURL:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lapromenade.com","password":"admin123"}'

# Lister les événements (remplacez TOKEN par le token reçu)
curl http://localhost:3000/api/events \
  -H "Authorization: Bearer TOKEN"
```

### Avec Postman:
1. Ouvrez Postman
2. Créez une nouvelle requête POST
3. URL: `http://localhost:3000/api/auth/login`
4. Body (JSON):
```json
{
  "email": "admin@lapromenade.com",
  "password": "admin123"
}
```
5. Copiez le token reçu
6. Pour les autres requêtes, ajoutez le header:
```
Authorization: Bearer YOUR_TOKEN
```

## 🐛 Dépannage

### "Port 3000 already in use"
```bash
PORT=3001 npm start
```

### "Cannot find module 'sqlite3'"
```bash
npm install sqlite3
```

### "Database locked"
Fermez les autres instances et supprimez `database.db`:
```bash
rm database.db
npm start
```

### Tokens expirés
Les tokens expirent après 24h. L'utilisateur doit se reconnecter.

## 📝 Développement

### Mode développement avec auto-rechargement
```bash
npm run dev
```

### Réinitialiser la base de données
```bash
rm database.db
npm start
```

## 🔒 Sécurité

- ✅ Les mots de passe sont hachés avec bcryptjs
- ✅ Les tokens JWT expirent après 24h
- ✅ Chaque requête API vérifie le token
- ✅ Les utilisateurs ne voient que leurs données
- ✅ Admin uniquement pour les tâches critiques

## 🚀 Déploiement

Pour déployer en production:

1. **Changez les valeurs de `.env`**:
   - Changez `JWT_SECRET` par une longue clé aléatoire
   - Changez `NODE_ENV` à `production`
   - Configurez le `PORT` si nécessaire

2. **Utilisez une BD robuste** (MySQL, PostgreSQL)

3. **Activez HTTPS** (certificat SSL)

4. **Déployez sur un serveur** (Heroku, AWS, DigitalOcean, etc.)

## 📚 Ressources

- Express.js: https://expressjs.com/
- SQLite: https://www.sqlite.org/
- JWT: https://jwt.io/
- Node.js: https://nodejs.org/

## 📞 Support

Consultez les logs du serveur pour les erreurs:

```bash
npm start
# Consultez la sortie en cas d'erreur
```

## ✅ Checklist de Déploiement

- [ ] `npm install` fonctionne
- [ ] `npm start` démarre sans erreurs
- [ ] http://localhost:3000 s'ouvre
- [ ] Connexion fonctionne
- [ ] Créer un événement fonctionne
- [ ] Les données persistent après redémarrage
- [ ] Les APIs retournent du JSON
- [ ] Les tokens JWT fonctionnent
- [ ] Les erreurs sont gérées gracieusement

## 📄 Licence

Propriété de l'Hôtel La Promenade - 2024

---

**Version**: 1.0.0  
**Dernière mise à jour**: Février 2024  
**Status**: ✅ Prêt pour la production

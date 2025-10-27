# 🎨 Pixelette - Galerie d'Art Générative et Interactive

> Une plateforme révolutionnaire qui fusionne créativité humaine et puissance de l'IA pour transformer vos idées en œuvres d'art époustouflantes. Créez, partagez et explorez dans un musée virtuel immersif où chaque pixel raconte une histoire.

## 🌟 Aperçu

**Pixelette** est une galerie d'art générative et interactive qui révolutionne l'art numérique. Le nom "Pixelette" fusionne "pixel" (symbole de l'art numérique) et "palette" (évoquant la créativité sans limites), invitant chacun à plonger dans un univers onirique où chaque clic crée une œuvre unique. L'application combine des outils intuitifs de création avec des recommandations personnalisées alimentées par l'IA pour démocratiser l'art numérique.

**Développé par** : Une équipe de 5 étudiants passionnés en informatique  
**Type** : Projet open-source hébergé sur GitHub

## ✨ Fonctionnalités

### 👤 Gestion des Utilisateurs
- Système CRUD complet avec profils personnalisables
- Recherche avancée d'utilisateurs par nom et tags
- Système de suivi social (follow/unfollow)
- Notifications par email pour les interactions
- **IA : Recommandations personnalisées** d'œuvres basées sur vos préférences

### 🎨 Gestion des Œuvres d'Art
- CRUD complet avec upload manuel d'images
- Métadonnées enrichies (tags, descriptions, dates)
- Visualisation interactive (zoom, rotation)
- Partage direct sur réseaux sociaux
- **IA : Génération automatique** d'œuvres via prompts textuels

### 🖼️ Gestion des Galeries
- CRUD complet avec permissions (public/privé/sur invitation)
- Recherche par tags, créateur et thème
- Export de collections en PDF
- Visite virtuelle 3D immersive (Three.js)
- **IA : Curation automatique** par clustering thématique
- **IA : Analyse de palette** pour harmonies de couleurs

### 💬 Gestion des Interactions
- Système de likes et commentaires en temps réel
- Signalement d'utilisateurs avec validation admin
- Notifications instantanées (Django Channels)
- Historique complet des interactions
- **IA : Modération automatique** (détection toxicité/spam)
- **IA : Suggestions de commentaires** générées par IA

### 📊 Statistiques et Insights
- Tableaux de bord personnalisés
- Métriques détaillées (vues, likes, engagement)
- Génération de rapports PDF/CSV
- Graphiques de monitoring interactifs
- **IA : Analyse prédictive** de popularité des œuvres

## 🛠️ Technologies

| Catégorie | Technologies |
|-----------|-------------|
| **Backend** | Django 4.2+, Django REST Framework, Python 3.10+ |
| **Frontend** | React 18+, Three.js, Tailwind CSS |
| **Base de Données** | Sqlite (Djongo) |
| **Temps Réel** | Django Channels, WebSockets, Redis |
| **Authentification** | JWT (djangorestframework-simplejwt) |
| **IA** | Google Gemini API, Stable Diffusion, scikit-learn |
| **Tests** | pytest, Jest, React Testing Library |
| **Outils** | npm, pip, Git |

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :


## 🚀 Installation

### 1. Cloner le Repository

```bash
git clone https://github.com/votre-username/pixelette.git
cd pixelette
```

### 2. Installer les Dépendances

```bash
cd backend
python -m venv venv
source venv/bin/activate  
pip install -r requirements.txt

cd ../frontend
npm install
```

### 3. Configuration de l'Environnement

```bash
cd backend
cp .env.example .env

cd ../frontend
cp .env.example .env
```

### 4. Configurer la Base de Données

### 5. Exécuter les Migrations

```bash
cd backend
source venv/bin/activate

python manage.py migrate

python manage.py loaddata fixtures/initial_data.json

python manage.py createsuperuser
```

### 6. Compiler les Assets

```bash
cd frontend

npm run dev

npm run build
```

### 8. Lancer les Serveurs

```bash
cd backend
source venv/bin/activate
python manage.py runserver

cd backend
source venv/bin/activate
daphne -b 0.0.0.0 -p 8001 config.asgi:application

cd frontend
npm run dev
```

🎉 **L'application est maintenant accessible sur** [http://localhost:5173](http://localhost:5173)

## ⚙️ Configuration

### Configuration de l'IA

L'application supporte Google Gemini et Stable Diffusion. Ajoutez vos clés API dans le fichier `backend/.env` :

```env
# Google Gemini (Analyse, Modération, Recommandations)
GEMINI_API_KEY=votre_cle_api_gemini
GEMINI_MODEL=gemini-2.0-flash-exp

# Stable Diffusion (Génération d'images)
STABILITY_API_KEY=votre_cle_stability_ai
# Ou utiliser Replicate, DALL-E, etc.

# OpenAI 
OPENAI_API_KEY=votre_cle_api_openai
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_REQUEST_TIMEOUT=30
```

### Configuration de Django

```env
# Django
SECRET_KEY=votre_cle_secrete_django
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT
JWT_SECRET_KEY=votre_cle_jwt
JWT_ACCESS_TOKEN_LIFETIME=60  # minutes
JWT_REFRESH_TOKEN_LIFETIME=7  # jours

# Redis (Django Channels)
REDIS_URL=redis://localhost:6379/0
```

### Configuration du Frontend

Éditez le fichier `frontend/.env` :

```env
# API Backend
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8001/ws

# Features
VITE_ENABLE_3D_GALLERY=true
VITE_MAX_UPLOAD_SIZE=5242880  # 5MB
```

### Configuration de l'Email (optionnel)

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=votre_email@gmail.com
EMAIL_HOST_PASSWORD=votre_mot_de_passe_app
EMAIL_USE_TLS=True
```

## 💻 Utilisation

### Inscription et Connexion

1. Accédez à [http://localhost:5173/register](http://localhost:5173/register) pour créer un compte
2. Connectez-vous via [http://localhost:5173/login](http://localhost:5173/login)
3. Complétez votre profil avec vos préférences artistiques

### Tableau de Bord

Après connexion, vous accédez à votre dashboard personnalisé :

- **Artistes** : Créer, gérer et analyser vos œuvres
- **Visiteurs** : Explorer, aimer et commenter les galeries
- **Administrateurs** : Panneau de gestion complet (modération, statistiques)

### Exemples de Routes

**Routes Frontend :**
```
/dashboard            # Tableau de bord personnel
/create               # Générer une œuvre avec IA
/gallery/:id          # Voir une galerie
/gallery/:id/3d       # Visite virtuelle 3D
/explore              # Explorer les œuvres
/profile/:username    # Profil utilisateur
```

**Routes API Backend :**
```
POST   /api/auth/register          # Inscription
POST   /api/auth/login             # Connexion
GET    /api/artworks/              # Liste des œuvres
POST   /api/artworks/generate/     # Générer via IA
GET    /api/galleries/             # Liste des galeries
POST   /api/interactions/like/     # Liker une œuvre
GET    /api/analytics/stats/       # Statistiques utilisateur
```

> 📖 Consultez `backend/config/urls.py` et la documentation API pour la liste complète

## 🏗️ Architecture

### Structure de la Base de Données

L'application utilise Sqlite avec Djongo. Voici les principales collections :

**Modules principaux :**
- `users` - Gestion des utilisateurs avec préférences
- `artworks` - Œuvres d'art avec métadonnées et couleurs
- `galleries` - Collections thématiques avec curation IA
- `interactions` - Likes, commentaires et signalements
- `analytics` - Statistiques et métriques de performance
- `ai_generations` - Historique des générations IA

**Schéma détaillé :** Consultez `backend/docs/database_schema.md`

### Structure du Projet

```
pixelette/
├── backend/                    # Django Backend
│   ├── apps/
│   │   ├── users/             # Gestion utilisateurs
│   │   ├── artworks/          # Œuvres d'art
│   │   ├── galleries/         # Galeries
│   │   ├── interactions/      # Likes, commentaires
│   │   ├── analytics/         # Statistiques
│   │   └── ai_services/       # Services IA
│   ├── config/                # Configuration Django
│   ├── requirements.txt
│   └── manage.py
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Composants réutilisables
│   │   ├── pages/             # Pages principales
│   │   ├── services/          # API calls
│   │   └── utils/             # Utilitaires
│   ├── package.json
│   └── vite.config.js
├── docs/                       # Documentation
└── docker-compose.yml         # Configuration Docker
```

## 🔌 API

L'application expose une API RESTful sécurisée avec JWT.

### Authentification

```bash
POST /api/auth/register
Content-Type: application/json
{
  "username": "artiste",
  "email": "artiste@pixelette.com",
  "password": "SecurePass123!"
}

POST /api/auth/login
{
  "email": "artiste@pixelette.com",
  "password": "SecurePass123!"
}
# Retourne: { "access": "jwt_token", "refresh": "refresh_token" }

GET /api/artworks/
Authorization: Bearer {jwt_token}
```


**Merci d'utiliser Pixelette pour créer et partager vos chefs-d'œuvre !** 🎨✨

⭐ Si ce projet vous plaît, n'hésitez pas à lui donner une étoile sur GitHub !


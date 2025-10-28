# 🎨 Pixelette - Backoffice Admin

Interface d'administration moderne pour gérer les œuvres et galeries de Pixelette.

## 📋 Pages CRUD créées

### 🖼️ **Œuvres** (Vue Grille)
**Route** : `/oeuvres-grid`

**Fonctionnalités** :
- ✅ Affichage en grille (cards avec images)
- ✅ Recherche par titre/description
- ✅ Pagination (12 œuvres par page)
- ✅ Actions : Voir / Modifier / Supprimer
- ✅ Intégration API complète avec Django

**Fichiers** :
- `src/app/(admin)/(app)/oeuvres-grid/index.jsx`
- `src/app/(admin)/(app)/oeuvres-grid/components/OeuvreGrid.jsx`

---

### 🎨 **Galeries** (Vue Liste)
**Route** : `/galeries-list`

**Fonctionnalités** :
- ✅ Affichage en tableau
- ✅ Recherche par nom/thème/description
- ✅ Filtrage par visibilité (Publique/Privée)
- ✅ Pagination (10 galeries par page)
- ✅ Affichage du nombre d'œuvres
- ✅ Badges de statut (Publique/Privée)
- ✅ Actions : Voir / Modifier / Gérer Œuvres / Supprimer
- ✅ Intégration API complète avec Django

**Fichiers** :
- `src/app/(admin)/(app)/galeries-list/index.jsx`
- `src/app/(admin)/(app)/galeries-list/components/GalerieListTable.jsx`

---

## 🚀 Démarrage

### Installation

```bash
cd React-JS
npm install
```

### Lancement du serveur de développement

```bash
npm run dev
```

Le backoffice sera accessible sur : **http://localhost:5174** (ou le port indiqué)

---

## 🔗 API Backend

Les pages communiquent avec l'API Django sur `http://localhost:8000/api/`

### Endpoints utilisés :

**Œuvres** :
- `GET /api/oeuvres/` - Liste toutes les œuvres
- `GET /api/oeuvres/{id}/` - Détails d'une œuvre
- `POST /api/oeuvres/` - Créer une œuvre
- `PUT /api/oeuvres/{id}/` - Modifier une œuvre
- `DELETE /api/oeuvres/{id}/` - Supprimer une œuvre

**Galeries** :
- `GET /api/galeries/` - Liste toutes les galeries
- `GET /api/galeries/{id}/` - Détails d'une galerie
- `POST /api/galeries/` - Créer une galerie
- `PUT /api/galeries/{id}/` - Modifier une galerie
- `DELETE /api/galeries/{id}/` - Supprimer une galerie

---

## 📱 Navigation

Dans le menu latéral, vous trouverez :

```
📁 Œuvres
  └─ Vue Grille

📁 Galeries
  └─ Liste
```

---

## 🎨 Design

Le backoffice utilise le template **Tailwick** avec :
- TailwindCSS pour le styling
- React Icons (Lucide) pour les icônes
- Design moderne et responsive
- Dark mode disponible

---

## 🔧 Structure des fichiers

```
React-JS/
├── src/
│   ├── app/
│   │   └── (admin)/
│   │       ├── (app)/
│   │       │   ├── oeuvres-grid/          # CRUD Œuvres (grille)
│   │       │   │   ├── index.jsx
│   │       │   │   └── components/
│   │       │   │       └── OeuvreGrid.jsx
│   │       │   │
│   │       │   └── galeries-list/         # CRUD Galeries (liste)
│   │       │       ├── index.jsx
│   │       │       └── components/
│   │       │           └── GalerieListTable.jsx
│   │       │
│   │       └── layout.jsx                 # Layout principal
│   │
│   ├── components/
│   │   └── layouts/
│   │       └── SideNav/
│   │           └── menu.js                # Menu de navigation
│   │
│   └── routes/
│       └── Routes.jsx                     # Configuration des routes
│
└── package.json
```

---

## 🎯 Fonctionnalités à venir

- [ ] Page de création d'œuvre
- [ ] Page d'édition d'œuvre
- [ ] Page de détails d'œuvre
- [ ] Page de création de galerie
- [ ] Page d'édition de galerie
- [ ] Page de détails de galerie
- [ ] Page de gestion des œuvres d'une galerie
- [ ] Dashboard avec statistiques
- [ ] Gestion des utilisateurs
- [ ] Modération des interactions

---

## 📚 Technologies utilisées

- **React 18** - Framework frontend
- **Vite** - Build tool rapide
- **TailwindCSS** - Framework CSS utility-first
- **React Router** - Navigation
- **Axios** - Requêtes HTTP
- **React Icons** - Icônes Lucide
- **Preline UI** - Composants UI (dropdowns, modals, etc.)

---

## 🐛 Dépannage

### Le backoffice ne se lance pas
```bash
# Supprimez node_modules et réinstallez
rm -rf node_modules package-lock.json
npm install
```

### Erreur CORS
Assurez-vous que Django est configuré pour accepter les requêtes depuis le port du backoffice :

Dans `Pixelette/settings.py` :
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Frontend principal
    "http://localhost:5174",  # Backoffice
    "http://127.0.0.1:5174",
]
```

### Les données ne se chargent pas
- Vérifiez que Django tourne sur `http://localhost:8000`
- Vérifiez les credentials de session (withCredentials: true)
- Vérifiez la console du navigateur pour les erreurs

---

## ✨ Enjoy!

Vous pouvez maintenant gérer vos œuvres et galeries depuis une interface d'administration professionnelle ! 🎉


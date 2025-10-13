# Artvista - Museum & Art Gallery React App

Application React moderne pour un musée et une galerie d'art, convertie depuis le template HTML Artvista.

## 🚀 Fonctionnalités

- ✅ Application React avec Vite
- ✅ React Router pour la navigation
- ✅ Composants réutilisables (Header, Footer, Sidebar, etc.)
- ✅ Pages multiples (Home, About, Contact, Blog, Events, Portfolio, Shop, Team)
- ✅ Design responsive avec Bootstrap
- ✅ Animations avec GSAP, WOW.js
- ✅ Sliders avec Slick
- ✅ Galerie avec Magnific Popup

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Builder pour la production
npm run build

# Prévisualiser la version de production
npm run preview
```

## 🗂️ Structure du projet

```
artvista-react/
├── public/
│   └── assets/          # CSS, JS, images, fonts
├── src/
│   ├── components/      # Composants réutilisables
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── Sidebar.jsx
│   │   ├── MobileMenu.jsx
│   │   ├── Preloader.jsx
│   │   ├── Cursor.jsx
│   │   └── ScrollTop.jsx
│   ├── layouts/         # Layouts
│   │   └── MainLayout.jsx
│   ├── pages/           # Pages de l'application
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── Blog.jsx
│   │   ├── BlogDetails.jsx
│   │   ├── Event.jsx
│   │   ├── EventDetails.jsx
│   │   ├── Project.jsx
│   │   ├── ProjectDetails.jsx
│   │   ├── Shop.jsx
│   │   ├── ShopDetails.jsx
│   │   ├── Team.jsx
│   │   ├── TeamDetails.jsx
│   │   ├── OpeningHour.jsx
│   │   ├── Location.jsx
│   │   └── Error.jsx
│   ├── App.jsx          # Configuration des routes
│   └── main.jsx         # Point d'entrée
├── index.html
└── package.json
```

## 🛣️ Routes disponibles

- `/` - Page d'accueil
- `/about` - À propos
- `/contact` - Contact
- `/blog` - Blog
- `/blog-details` - Détails d'un article
- `/event` - Événements
- `/event-details` - Détails d'un événement
- `/project` - Portfolio
- `/project-details` - Détails d'un projet
- `/shop` - Boutique
- `/shop-details` - Détails d'un produit
- `/team` - Équipe
- `/team-details` - Détails d'un membre
- `/opening-hour` - Horaires d'ouverture
- `/location` - Localisation

## 🎨 Technologies utilisées

- React 18
- Vite
- React Router DOM
- Bootstrap 5
- jQuery (pour les plugins legacy)
- Slick Slider
- GSAP
- WOW.js
- Magnific Popup
- Font Awesome

## 📝 Notes

Les scripts jQuery et les plugins sont chargés dynamiquement dans `App.jsx`. Certaines fonctionnalités nécessitent jQuery pour fonctionner correctement (sliders, animations, popups).

## 🔧 Développement

Pour personnaliser l'application :

1. Modifiez les composants dans `src/components/`
2. Ajoutez ou modifiez les pages dans `src/pages/`
3. Personnalisez les styles dans `public/assets/css/style.css`
4. Ajoutez de nouvelles routes dans `src/App.jsx`

## 📄 Licence

Ce projet est basé sur le template HTML Artvista. Veuillez vérifier la licence du template original avant toute utilisation commerciale.

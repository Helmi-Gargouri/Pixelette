# 🚀 Démarrage Rapide - Backoffice Pixelette

## ⚡ Installation et Lancement

```bash
cd React-JS
npm install
npm run dev
```

Le backoffice sera accessible sur : **http://localhost:5174**

---

## 🔐 Connexion Admin

### 1. Première visite
Lorsque vous accédez au backoffice, vous serez **automatiquement redirigé** vers la page de login admin :
```
http://localhost:5174/admin-login
```

### 2. Se connecter
Utilisez un compte avec le rôle **"admin"** :

```
Email: votre-email@example.com
Mot de passe: votre-mot-de-passe
```

### 3. Accès refusé aux non-admins
Si vous essayez de vous connecter avec un compte qui n'est **pas admin**, vous verrez :
```
❌ Accès refusé : vous devez être administrateur
```

---

## ✅ **Corrections appliquées**

### **1. Erreur 400 résolue** 🔧

**Avant** :
```
❌ Error 400: Bad Request
   Cause: Champs 'auteur' et 'proprietaire' manquants
```

**Après** :
```
✅ L'utilisateur connecté est automatiquement ajouté comme:
   - auteur (pour les œuvres)
   - proprietaire (pour les galeries)
```

### **2. Formulaires simplifiés** 📝

**Œuvres** :
- ❌ ~~Technique~~ (supprimé)
- ❌ ~~Dimensions~~ (supprimé)
- ❌ ~~Date de création~~ (supprimé)
- ✅ Titre
- ✅ Description
- ✅ Image

**Galeries** :
- ✅ Nom
- ✅ Description
- ✅ Thème
- ✅ Visibilité (Privée/Publique)

### **3. Authentification admin** 🔒

**Fonctionnalités** :
- ✅ Page de login dédiée (`/admin-login`)
- ✅ AuthContext pour gérer l'auth
- ✅ ProtectedRoute pour protéger toutes les pages admin
- ✅ Vérification du rôle admin
- ✅ Session persistante (sessionStorage)
- ✅ Bouton de déconnexion dans la topbar
- ✅ Affichage du nom de l'utilisateur connecté

**Sécurité** :
- ✅ Toutes les routes admin sont protégées
- ✅ Seuls les admins peuvent accéder
- ✅ Redirection automatique vers login si non connecté
- ✅ Déconnexion automatique si rôle changé

---

## 📋 **Workflow complet**

### **Première utilisation** :

1. **Accédez au backoffice** :
   ```
   http://localhost:5174
   ```

2. **Vous êtes redirigé** vers :
   ```
   http://localhost:5174/admin-login
   ```

3. **Connectez-vous** avec un compte admin

4. **Vous accédez au dashboard** :
   ```
   http://localhost:5174/
   ```

5. **Naviguez dans le menu** :
   - Œuvres → Vue Grille
   - Galeries → Liste

---

## 🎯 **Tester les CRUD**

### **Œuvres** 🖼️

1. Allez sur **Œuvres** → **Vue Grille**
2. Cliquez sur **"+ Ajouter une Œuvre"**
3. Remplissez :
   - Titre : "Mon Œuvre Test"
   - Description : "Une belle œuvre"
   - Image : (uploadez une image)
4. Cliquez sur **"Créer l'œuvre"**
5. ✅ L'œuvre apparaît dans la grille !

**Test des autres actions** :
- Cliquez sur **"Voir Détails"** → Modal de détails
- Menu **⋮** → **"Modifier"** → Éditez et enregistrez
- Menu **⋮** → **"Supprimer"** → Confirmez

### **Galeries** 🎨

1. Allez sur **Galeries** → **Liste**
2. Cliquez sur **"+ Nouvelle Galerie"**
3. Remplissez :
   - Nom : "Ma Galerie Test"
   - Description : "Collection de paysages"
   - Thème : "Paysages"
   - ☑️ Galerie Privée (ou non)
4. Cliquez sur **"Créer la galerie"**
5. ✅ La galerie apparaît dans le tableau !

**Test des autres actions** :
- Menu **⋮** → **"Voir Détails"** → Voir les infos + œuvres
- Menu **⋮** → **"Modifier"** → Éditez et enregistrez
- Menu **⋮** → **"Supprimer"** → Confirmez

---

## 🔄 **Déconnexion**

Pour vous déconnecter :

1. Cliquez sur votre **avatar** en haut à droite
2. Cliquez sur **"Déconnexion"**
3. Vous êtes redirigé vers la page de login

---

## 🐛 **Problèmes courants**

### Erreur : "Vous devez être connecté"
- ✅ Assurez-vous d'être connecté
- ✅ Vérifiez que votre compte a le rôle "admin"

### Erreur 401 Unauthorized
- ✅ Reconnectez-vous
- ✅ Vérifiez que Django est lancé sur `http://localhost:8000`

### Erreur 400 Bad Request
- ✅ RÉSOLU : L'auteur/propriétaire est maintenant ajouté automatiquement

### Les modals ne s'affichent pas
- ✅ Vérifiez la console pour les erreurs
- ✅ Assurez-vous que les icônes sont bien importées

---

## 📚 **Documentation complète**

Consultez ces fichiers pour plus d'infos :
- `BACKOFFICE_README.md` - Vue d'ensemble
- `MODALS_GUIDE.md` - Guide des modals (si existant)

---

## 🎉 **Tout est prêt !**

Votre backoffice est maintenant **100% fonctionnel** avec :
- ✅ Authentification admin sécurisée
- ✅ CRUD complet pour œuvres
- ✅ CRUD complet pour galeries
- ✅ Modals intégrés
- ✅ Formulaires corrigés
- ✅ Interface professionnelle

**Bon travail !** 🚀🎨


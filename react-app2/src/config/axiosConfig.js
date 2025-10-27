// src/config/axiosConfig.js
// Créer ce fichier dans : frontoffice/src/config/axiosConfig.js

import axios from 'axios';

// Configuration de base
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

// Intercepteur pour ajouter automatiquement le token
axios.interceptors.request.use(
  (config) => {
    // ✅ NE PAS ajouter le token pour les routes publiques
    const publicRoutes = ['/api/utilisateurs/login/', '/api/utilisateurs/register/', '/api/auth/'];
    const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));
    
    if (isPublicRoute) {
      console.log('🌐 Requête publique (sans token):', config.url);
      return config;
    }
    
    const token = localStorage.getItem('token');
    
    if (token) {
      // Ajouter le token dans les headers
      config.headers.Authorization = `Token ${token}`;
      console.log('📤 Requête avec token:', {
        url: config.url,
        method: config.method,
        token: token.substring(0, 10) + '...'
      });
    } else {
      console.warn('⚠️ Pas de token pour:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur request:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs 403
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('🔒 403 Forbidden:', {
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data
      });
      
      // ✅ NE PAS rediriger automatiquement
      // Laisser le composant gérer l'erreur
      console.log('⚠️ Erreur 403 - Laisser le composant gérer');
    }
    
    // ✅ Si erreur 401 (Unauthorized), déconnecter
    if (error.response?.status === 401) {
      const isLoginRoute = error.config?.url?.includes('/login/');
      if (!isLoginRoute) {
        console.log('🚪 401 Unauthorized - Déconnexion');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axios;
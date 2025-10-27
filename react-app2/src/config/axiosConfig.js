// frontoffice/src/config/axiosConfig.js
import axios from 'axios';

// ✅ Utiliser VITE_API_URL au lieu de VITE_BASE_URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

console.log('🌐 Axios Base URL:', BASE_URL);

// Configuration de base
axios.defaults.baseURL = BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Intercepteur pour ajouter automatiquement le token
axios.interceptors.request.use(
  (config) => {
    // ✅ Routes publiques (pas besoin de token)
    const publicRoutes = ['/utilisateurs/login/', '/utilisateurs/register/', '/auth/'];
    const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));
    
    if (isPublicRoute) {
      console.log('🌐 Requête publique (sans token):', config.url);
      return config;
    }
    
    // ✅ Récupérer le token depuis localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Token ${token}`;
      console.log('📤 Requête avec token:', {
        url: config.url,
        method: config.method,
        hasToken: true
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

// Intercepteur pour gérer les erreurs de réponse
axios.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse reçue:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    console.error('❌ Erreur réponse:', {
      status,
      url,
      message: error.response?.data
    });
    
    // ✅ 401 Unauthorized - Token invalide ou expiré
    if (status === 401) {
      const isLoginRoute = url?.includes('/login/');
      if (!isLoginRoute) {
        console.log('🚪 401 Unauthorized - Déconnexion automatique');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    // ✅ 403 Forbidden - Permissions insuffisantes
    if (status === 403) {
      console.error('🔒 403 Forbidden:', {
        url,
        data: error.response?.data
      });
    }
    
    // ✅ 500 Server Error
    if (status >= 500) {
      console.error('🔥 Erreur serveur:', {
        status,
        url,
        message: error.response?.data
      });
    }
    
    return Promise.reject(error);
  }
);

export default axios;
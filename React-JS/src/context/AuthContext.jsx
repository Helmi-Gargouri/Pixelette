import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);  // NEW: Flag pour restore once only
  const [redirecting, setRedirecting] = useState(false);  // Flag pour éviter les boucles de redirection
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const MEDIA_BASE = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8000';  // Pour images
  const FRONTOFFICE_URL = import.meta.env.VITE_FRONTOFFICE_URL || 'http://localhost:5173';  // Pour redirects
  useEffect(() => {
    if (localStorage.getItem('auth_checked')) return;
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (localStorage.getItem('auth_checked') || redirecting) return;
    localStorage.setItem('auth_checked', 'true');

    try {
      let token = localStorage.getItem('token');
      let storedUser = localStorage.getItem('user');

      const urlParams = new URLSearchParams(window.location.search);
      const tempId = urlParams.get('temp_id');

      console.log('🔍 Vérification auth - Token (localStorage):', token);
      console.log('🔍 Vérification auth - Temp ID (URL):', tempId);
      console.log('🔍 Vérification auth - User:', storedUser);

      if (tempId && !token) {
        console.log('✅ Temp ID trouvé dans l\'URL, récupération des données auth...');
        const response = await axios.get(`${API_BASE}auth/get_temp/${tempId}/`, {
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('📌 Réponse API Get Temp:', response.data);

        token = response.data.token;
        storedUser = JSON.stringify(response.data.user);

        localStorage.setItem('token', token);
        localStorage.setItem('user', storedUser);
        window.history.replaceState({}, document.title, window.location.pathname);

        const userDataTemp = JSON.parse(storedUser);
        console.log('🔍 Role parsed after temp:', userDataTemp.role);  // Debug role

        // NEW: Restore ONLY once (no spam every second)
        if (!sessionRestored) {
          try {
            await axios.post(`${API_BASE}utilisateurs/restore_session/`, {
              token: token,
              user_id: userDataTemp.id,
            }, {
              withCredentials: true,
              headers: { 'Content-Type': 'application/json' },
            });
            console.log('✅ Session restaurée via API après temp retrieval (once only)');
            setSessionRestored(true);
          } catch (restoreError) {
            console.error('⚠️ Erreur restauration session:', restoreError.response?.data || restoreError.message);
          }
        }
      }

      if (token && storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('🔍 Rôle utilisateur:', userData.role);

        if (!userData.role) {
          console.log('⚠️ Rôle manquant, fetch profile');
          await fetchProfile(token);
          return;
        }

        // REDIRECT NON-ADMIN vers frontoffice
        if (userData.role !== 'admin') {
          console.log('⚠️ Non admin détecté, redirection vers frontoffice');
          if (!redirecting) {
            setRedirecting(true);
            // Ne pas clear localStorage, juste rediriger pour préserver le token
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            setAuthChecked(true);
            window.location.replace(`${FRONTOFFICE_URL}/`);  // Rediriger vers frontoffice
          }
          return;
        }

        // Admin : vérifier le token avec l'API
        try {
          await fetchProfile(token);
          setIsAuthenticated(true);
          setAuthChecked(true);
          setLoading(false);
        } catch (error) {
          console.error('❌ Token invalide pour admin:', error);
          localStorage.clear();
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          setAuthChecked(true);
          window.location.replace(`${FRONTOFFICE_URL}/`); 
        }
      } else {
        console.log('⚠️ No token/user, redirect to frontoffice');
        localStorage.removeItem('auth_checked');
        setIsAuthenticated(false);
        setLoading(false);
        setAuthChecked(true);
        window.location.replace(`${FRONTOFFICE_URL}/`);  // Rediriger vers frontoffice
      }
    } catch (error) {
      console.error('❌ CheckAuth error:', error);
      console.error('❌ Details:', error.response?.data);
      localStorage.clear();  // Clear on error
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      setAuthChecked(true);
      window.location.replace(`${FRONTOFFICE_URL}/`); 
    }
  };

  const fetchProfile = async (token) => {
    try {
      console.log('📤 Fetch profile with token:', token.substring(0, 10) + '...');
      const response = await axios.get(`${API_BASE}utilisateurs/profile/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true,
      });

      const userData = response.data;
      console.log('📌 Profile OK:', userData.role);

      if (userData.role !== 'admin') {
        console.log('⚠️ Profile non admin, throw redirect');
        throw new Error('Non admin access');
      }

      if (userData.image && !userData.image.startsWith('http')) {
        userData.image = `${MEDIA_BASE}${userData.image}`;
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('❌ Fetch profile error:', error);
      if (error.response?.status === 403) {
        console.error('🔒 403 on profile: Auth fail, logout');
        logout();  // Force logout on 403
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${API_BASE}utilisateurs/logout/`, {}, {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true,
        });
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Clear localStorage BEFORE redirection to prevent frontoffice from loading session
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      setAuthChecked(false);
      setSessionRestored(false);  // Reset flag
      
      console.log('🧹 localStorage vidé, redirection vers frontoffice...');
      
      // Add a small delay to ensure localStorage is cleared before redirect
      setTimeout(() => {
        console.log('🚀 Redirection vers frontoffice');
        // Utiliser href au lieu de replace pour forcer la redirection
        window.location.href = `${FRONTOFFICE_URL}`;
      }, 200); // Augmenté à 200ms pour être sûr
    }
  };

  const updateUser = (updatedData) => {
    if (updatedData.role !== 'admin') {
      console.log('⚠️ Update non admin, ignore');
      return;
    }
    if (updatedData.image && !updatedData.image.startsWith('http')) {
      updatedData.image = `${MEDIA_BASE}${updatedData.image}`;
    }
    setUser(updatedData);
    localStorage.setItem('user', JSON.stringify(updatedData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        logout,
        checkAuth,
        fetchProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
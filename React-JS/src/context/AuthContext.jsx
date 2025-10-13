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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Charge le profil depuis l'API pour avoir les données fraîches
        await fetchProfile(token);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const fetchProfile = async (token) => {
    try {
      const response = await axios.get('http://localhost:8000/api/utilisateurs/profile/', {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });

      const userData = response.data;

      // Formate l'image correctement
      if (userData.image && !userData.image.startsWith('http')) {
        userData.image = `http://localhost:8000${userData.image}`;
      }

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      return userData;
    } catch (error) {
      console.error('Erreur fetch profile:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/utilisateurs/login/', {
        email,
        password
      }, {
        withCredentials: true
      });

      console.log('Réponse login:', response.data);

      const { token, user: userData } = response.data;
      
      if (!userData) {
        throw new Error('Pas de données utilisateur reçues');
      }

      // Stocke le token
      localStorage.setItem('token', token);

      // Formate l'image correctement
      if (userData.image && !userData.image.startsWith('http')) {
        userData.image = `http://localhost:8000${userData.image}`;
      }

      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erreur de connexion'
      };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('http://localhost:8000/api/utilisateurs/logout/', {}, {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true
        });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (updatedData) => {
    // Formate l'image correctement
    if (updatedData.image && !updatedData.image.startsWith('http')) {
      updatedData.image = `http://localhost:8000${updatedData.image}`;
    }
    setUser(updatedData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading, 
      login, 
      logout, 
      checkAuth,
      fetchProfile,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
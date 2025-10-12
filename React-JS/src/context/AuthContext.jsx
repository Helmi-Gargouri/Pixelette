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
      // Récupère les données utilisateur stockées
      const userDataStr = sessionStorage.getItem('admin_user_data');
      
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        
        // Vérifie que l'utilisateur est admin
        if (userData.role === 'admin') {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem('admin_user_data');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      sessionStorage.removeItem('admin_user_data');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
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

      console.log('Réponse login:', response.data); // Debug

      // Les données utilisateur sont dans response.data.user
      const userData = response.data.user;

      if (!userData || userData.role !== 'admin') {
        throw new Error('Accès refusé : vous devez être administrateur');
      }

      // Stocke toutes les données utilisateur dans sessionStorage
      sessionStorage.setItem('admin_user_data', JSON.stringify(userData));
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
      await axios.post('http://localhost:8000/api/utilisateurs/logout/', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      sessionStorage.removeItem('admin_user_data');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};


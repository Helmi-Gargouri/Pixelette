// frontoffice/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  console.log('🔄 AuthContext init - Token:', storedToken ? 'Présent' : 'Absent');
  console.log('🔄 AuthContext init - User:', storedUser ? 'Présent' : 'Absent');
  
  if (storedToken && storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      
      // ✅ Vérifier si c'est un admin
      if (parsedUser.role === 'admin') {
        console.log('⚠️ Admin détecté dans frontoffice, redirection vers backoffice');
        localStorage.clear();
        sessionStorage.clear();
        
        // ✅ Utiliser la variable d'environnement
        const backofficeUrl = import.meta.env.VITE_BACKOFFICE_URL || 'http://localhost:5174';
        window.location.replace(backofficeUrl);
        return;
      }
      
      setToken(storedToken);
      setUser(parsedUser);
      console.log('✅ Utilisateur chargé:', parsedUser.email);
    } catch (error) {
      console.error('❌ Erreur parsing user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  setLoading(false);
}, []);

  const login = (userData, authToken) => {
    console.log('🔐 Login appelé avec:', { userData, authToken });
    
    setUser(userData);
    setToken(authToken);
    
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    console.log('✅ Login terminé - Token stocké pour interceptor'); // ✅ AJOUT
  };

  const logout = () => {
    console.log('🚪 Logout appelé');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
  };

  const updateUser = (updatedUserData) => {
    console.log('🔄 UpdateUser appelé:', updatedUserData);
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
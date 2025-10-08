import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './_pageStyles.css';

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogin = () => navigate('/login');
  const handleRegister = () => navigate('/register');
  const handleProfile = () => navigate('/profile');
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.reload(); // Refresh pour recharger l'index statique
  };

  return (
    <>
      {/* Nav overlay en haut à droite, stylée exactement comme le bouton "TICKET & ADMISSION" du template */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        fontFamily: 'var(--title-font)',
        fontSize: '14px'
      }}>
        {isLoggedIn ? (
          <>
            <a
              href="#"
              onClick={handleProfile}
              className="btn"
              style={{
                backgroundColor: 'var(--theme-color)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '0',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#a55e35'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'var(--theme-color)'}
            >
              Profil
            </a>
            <a
              href="#"
              onClick={handleLogout}
              className="btn"
              style={{
                backgroundColor: '#dc3545',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '0',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
            >
              Déconnexion
            </a>
          </>
        ) : (
          <>
            <a
              href="/login"
              className="btn"
              style={{
                backgroundColor: 'transparent',
                color: '#000',
                border: '1px solid #ddd',
                padding: '12px 24px',
                borderRadius: '0',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'border-color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.borderColor = 'var(--theme-color)'}
              onMouseOut={(e) => e.target.style.borderColor = '#ddd'}
            >
              Se connecter
            </a>
            <a
              href="/register"
              className="btn"
              style={{
                backgroundColor: 'var(--theme-color)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '0',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#a55e35'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'var(--theme-color)'}
            >
              S'inscrire
            </a>
          </>
        )}
      </div>
      
      {/* Contenu statique inchangé */}
      <div dangerouslySetInnerHTML={{ __html: require('../public/pages/index.html?raw') }} />
    </>
  );
}
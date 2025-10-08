import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './_pageStyles.css';

const Register = () => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/utilisateurs/', 
        { nom, prenom, email, telephone, password, password_confirm: passwordConfirm },
        { withCredentials: true }
      );
      setMessage('Inscription réussie ! Redirection...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || error.response?.data?.password || 'Échec'));
    }
  };

  const messageClass = message
    ? (message.toLowerCase().includes('erreur') ? 'message message-error' : 'message message-success')
    : '';

  return (
    <>
      <header className="nav-header header-layout1" style={{ position: 'relative', zIndex: 10 }}>
        <div className="menu-area">
          <div className="container">
            <div className="row align-items-center justify-content-center">
              <div className="col-auto">
                <div className="header-logo">
                  <a href="/">
                    <img src="/assets/img/logo.svg" alt="Artvista" style={{ maxHeight: '50px' }} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="hero-wrapper auth-hero" style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '40px 0',
        marginTop: '-80px',
        paddingTop: '120px'
      }}>
        <div className="hero-thumb1" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          overflow: 'hidden',
          opacity: 0.1,
          zIndex: 1
        }}>
          <img src="/assets/img/hero/hero_1_1.png" alt="Decor" style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }} />
        </div>

        <div className="container" style={{ 
          position: 'relative', 
          zIndex: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="row justify-content-center w-100">
            <div className="col-xl-5 col-lg-6 col-md-8 col-sm-10">
              {/* Carte d'inscription avec plus d'espace */}
              <div className="hero-style1 auth-form-wrapper" style={{ 
                background: 'rgba(255, 255, 255, 0.95)', 
                padding: '50px 45px', 
                borderRadius: '15px', 
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
                width: '100%',
                maxWidth: '500px', // Largeur augmentée
                margin: '0 auto'
              }}>
                <h1 className="auth-title hero-title" style={{ 
                  color: 'var(--title-color, #373E43)', 
                  marginBottom: '40px', 
                  fontSize: '2.2em', 
                  fontWeight: 300,
                  fontFamily: 'var(--title-font, "Jost", sans-serif)',
                  letterSpacing: '0.5px'
                }}>
                  S'inscrire
                </h1>
                
                <form onSubmit={handleSubmit} className="auth-form">
                  {/* Prénom */}
                  <div className="form-group mb-25"> {/* Espacement augmenté */}
                    <label className="form-label" style={{ 
                      display: 'block', 
                      marginBottom: '12px', // Espacement augmenté
                      color: 'var(--body-color, #7B7E86)', 
                      fontWeight: 500,
                      fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                      fontSize: '0.95em',
                      textAlign: 'left'
                    }}>
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      required
                      style={{ 
                        width: '100%',
                        padding: '16px 20px', // Padding horizontal augmenté
                        border: '2px solid var(--border-color, #D9D9D9)', 
                        borderRadius: '10px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        background: '#fff',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        textAlign: 'left'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--theme-color, #C57642)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(197, 118, 66, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-color, #D9D9D9)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                      }}
                    />
                  </div>

                  {/* Nom */}
                  <div className="form-group mb-25"> {/* Espacement augmenté */}
                    <label className="form-label" style={{ 
                      display: 'block', 
                      marginBottom: '12px',
                      color: 'var(--body-color, #7B7E86)', 
                      fontWeight: 500,
                      fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                      fontSize: '0.95em',
                      textAlign: 'left'
                    }}>
                      Nom
                    </label>
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                      style={{ 
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid var(--border-color, #D9D9D9)', 
                        borderRadius: '10px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        background: '#fff',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        textAlign: 'left'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--theme-color, #C57642)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(197, 118, 66, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-color, #D9D9D9)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div className="form-group mb-25"> {/* Espacement augmenté */}
                    <label className="form-label" style={{ 
                      display: 'block', 
                      marginBottom: '12px',
                      color: 'var(--body-color, #7B7E86)', 
                      fontWeight: 500,
                      fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                      fontSize: '0.95em',
                      textAlign: 'left'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ 
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid var(--border-color, #D9D9D9)', 
                        borderRadius: '10px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        background: '#fff',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        textAlign: 'left'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--theme-color, #C57642)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(197, 118, 66, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-color, #D9D9D9)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                      }}
                    />
                  </div>

                  {/* Téléphone */}
                  <div className="form-group mb-25"> {/* Espacement augmenté */}
                    <label className="form-label" style={{ 
                      display: 'block', 
                      marginBottom: '12px',
                      color: 'var(--body-color, #7B7E86)', 
                      fontWeight: 500,
                      fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                      fontSize: '0.95em',
                      textAlign: 'left'
                    }}>
                      Téléphone (optionnel)
                    </label>
                    <input
                      type="tel"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid var(--border-color, #D9D9D9)', 
                        borderRadius: '10px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        background: '#fff',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        textAlign: 'left'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--theme-color, #C57642)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(197, 118, 66, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-color, #D9D9D9)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                      }}
                    />
                  </div>

                  {/* Mot de passe */}
                  <div className="form-group mb-25"> {/* Espacement augmenté */}
                    <label className="form-label" style={{ 
                      display: 'block', 
                      marginBottom: '12px',
                      color: 'var(--body-color, #7B7E86)', 
                      fontWeight: 500,
                      fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                      fontSize: '0.95em',
                      textAlign: 'left'
                    }}>
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ 
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid var(--border-color, #D9D9D9)', 
                        borderRadius: '10px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        background: '#fff',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        textAlign: 'left'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--theme-color, #C57642)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(197, 118, 66, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-color, #D9D9D9)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                      }}
                    />
                  </div>

                  {/* Confirmation mot de passe */}
                  <div className="form-group mb-30"> {/* Espacement avant bouton augmenté */}
                    <label className="form-label" style={{ 
                      display: 'block', 
                      marginBottom: '12px',
                      color: 'var(--body-color, #7B7E86)', 
                      fontWeight: 500,
                      fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                      fontSize: '0.95em',
                      textAlign: 'left'
                    }}>
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      required
                      style={{ 
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid var(--border-color, #D9D9D9)', 
                        borderRadius: '10px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        background: '#fff',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        textAlign: 'left'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--theme-color, #C57642)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(197, 118, 66, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-color, #D9D9D9)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                      }}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-primary btn" 
                    style={{ 
                      width: '100%',
                      padding: '18px', // Padding augmenté
                      background: 'linear-gradient(135deg, var(--theme-color, #C57642) 0%, #a55e35 100%)',
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '10px',
                      fontSize: '16px', 
                      cursor: 'pointer', 
                      transition: 'all 0.3s ease',
                      fontWeight: 500,
                      fontFamily: 'var(--title-font, "Jost", sans-serif)',
                      boxShadow: '0 4px 15px rgba(197, 118, 66, 0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginTop: '10px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #a55e35 0%, #8d4a2a 100%)';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(197, 118, 66, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, var(--theme-color, #C57642) 0%, #a55e35 100%)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(197, 118, 66, 0.3)';
                    }}
                  >
                    S'inscrire
                  </button>
                </form>

                <p style={{ 
                  textAlign: 'center', 
                  marginTop: '30px', // Espacement augmenté
                  color: 'var(--body-color, #7B7E86)', 
                  fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                  fontSize: '0.95em'
                }}>
                  Déjà inscrit ? <a 
                    className="link" 
                    href="/login" 
                    style={{ 
                      color: 'var(--theme-color, #C57642)', 
                      textDecoration: 'none', 
                      fontWeight: 500,
                      transition: 'color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.color = '#a55e35'}
                    onMouseOut={(e) => e.target.style.color = 'var(--theme-color, #C57642)'}
                  >
                    Se connecter
                  </a>
                </p>
                
                {message && <p className={messageClass} role="status" style={{ 
                  textAlign: 'center', 
                  marginTop: '25px', // Espacement augmenté
                  padding: '12px',
                  borderRadius: '8px', 
                  fontWeight: 500,
                  fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                  border: '1px solid',
                  width: '100%',
                  ...(messageClass.includes('success') ? { 
                    color: '#28a745', 
                    background: 'rgba(40, 167, 69, 0.1)',
                    borderColor: '#28a745'
                  } : { 
                    color: '#dc3545', 
                    background: 'rgba(220, 53, 69, 0.1)',
                    borderColor: '#dc3545'
                  })
                }}>{message}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-wrapper footer-layout1" style={{ 
        background: 'var(--smoke-color, #F8F7F4)', 
        padding: '30px 0', 
        textAlign: 'center',
        fontFamily: 'var(--body-font, "Roboto", sans-serif)',
        position: 'relative',
        zIndex: 3
      }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-auto">
              <p style={{ color: 'var(--body-color, #7B7E86)', marginBottom: '10px', fontSize: '0.9em' }}>
                © 2025 Artvista. Tous droits réservés.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <a href="https://facebook.com/" style={{ color: 'var(--theme-color, #C57642)' }}><i className="fab fa-facebook-f"></i></a>
                <a href="https://twitter.com/" style={{ color: 'var(--theme-color, #C57642)' }}><i className="fab fa-twitter"></i></a>
                <a href="https://instagram.com/" style={{ color: 'var(--theme-color, #C57642)' }}><i className="fab fa-instagram"></i></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Register;
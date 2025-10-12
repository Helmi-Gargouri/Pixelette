import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const Verify2FA = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user_id, two_factor_enabled, setup_needed } = location.state || {};

  useEffect(() => {
    if (!user_id) {
      setError('Erreur : Session invalide');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!two_factor_enabled) {
      setError('2FA désactivé, redirection...');
      setTimeout(() => navigate('/profile'), 1500);
      return;
    }

    // Génère QR seulement si setup initial needed (comme generate2FA)
    if (setup_needed) {
      fetchQRCode();
    }
  }, [user_id, two_factor_enabled, setup_needed, navigate]);

  const fetchQRCode = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/utilisateurs/generate_2fa/', { user_id }, { withCredentials: true });
      if (response.data.qr_code) {
        setQrCode(response.data.qr_code);
      } else {
        setError(response.data.message || 'Erreur QR Code');
      }
    } catch (error) {
      console.error('Erreur QR:', error);
      setError(error.response?.data?.error || 'Erreur génération QR Code');
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    try {
      if (!user_id) {
        throw new Error('User ID manquant');
      }

      let response;
      if (setup_needed) {
        // Setup initial : enable_2fa (active + connecte, comme enable2FA)
        response = await axios.post('http://localhost:8000/api/utilisateurs/enable_2fa/', 
          { user_id, two_factor_code: verificationCode }, 
          { withCredentials: true }
        );
      } else {
        // Vérif normale : verify_2fa (connecte, comme verify2FA)
        response = await axios.post('http://localhost:8000/api/utilisateurs/verify_2fa/', 
          { user_id, two_factor_code: verificationCode }, 
          { withCredentials: true }
        );
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      localStorage.setItem('token', response.data.token);
      navigate('/profile');
    } catch (error) {
      console.error('Erreur 2FA:', error);
      setError(error.response?.data?.error || error.message || 'Échec vérification');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!two_factor_enabled) return null;

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
        padding: '20px 0',
        marginTop: '-80px',
        paddingTop: '100px'
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

        <div className="container-fluid" style={{ 
          position: 'relative', 
          zIndex: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 180px)'
        }}>
          <div className="row justify-content-center w-100">
            <div className="col-12">
              <div className="hero-style1 auth-form-wrapper" style={{ 
                background: 'rgba(255, 255, 255, 0.95)', 
                padding: '50px 40px', 
                borderRadius: '15px', 
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
                width: '100%'
              }}>
                <h1 className="auth-title hero-title" style={{ 
                  color: 'var(--title-color, #373E43)', 
                  marginBottom: '35px', 
                  fontSize: '2.2em', 
                  fontWeight: 300,
                  fontFamily: 'var(--title-font, "Jost", sans-serif)',
                  letterSpacing: '0.5px'
                }}>
                  {setup_needed ? 'Configurer 2FA' : 'Vérification 2FA'}
                </h1>
                
                <form onSubmit={handleVerifyCode} className="auth-form">
                  <div className="row">
                    {setup_needed && (
                      <div className="col-12 mb-3">
                        <p style={{ 
                          color: 'var(--body-color, #7B7E86)', 
                          fontSize: '0.95em',
                          marginBottom: '20px'
                        }}>
                          Scannez le QR code avec votre app d'authentification (ex. Google Authenticator).
                        </p>
                        {qrCode ? (
                          <img src={qrCode} alt="QR Code" style={{ 
                            maxWidth: '200px', 
                            margin: '0 auto', 
                            display: 'block',
                            borderRadius: '10px'
                          }} />
                        ) : (
                          <p>Chargement du QR Code...</p>
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="col-12 mb-3">
                        <p className="message message-error" style={{ 
                          textAlign: 'left',
                          color: '#dc3545', 
                          background: 'rgba(220, 53, 69, 0.1)',
                          border: '1px solid #dc3545',
                          padding: '12px',
                          borderRadius: '8px',
                          fontWeight: 500,
                          fontFamily: 'var(--body-font, "Roboto", sans-serif)'
                        }}>{error}</p>
                      </div>
                    )}

                    <div className="col-12 mb-3">
                      <label className="form-label" style={{ 
                        display: 'block', 
                        marginBottom: '10px',
                        color: 'var(--body-color, #7B7E86)', 
                        fontWeight: 500,
                        fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                        fontSize: '0.95em',
                        textAlign: 'left'
                      }}>
                        Code de vérification
                      </label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Entrez le code à 6 chiffres"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        maxLength={6}
                        style={{ 
                          width: '100%',
                          padding: '16px',
                          border: '2px solid var(--border-color, #D9D9D9)', 
                          borderRadius: '10px',
                          fontSize: '16px',
                          transition: 'all 0.3s ease',
                          background: '#fff',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                          textAlign: 'left',
                          letterSpacing: '5px',
                          fontFamily: 'monospace'
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

                    <div className="col-12 mb-3">
                      <button 
                        type="submit" 
                        disabled={isVerifying || !verificationCode || verificationCode.length !== 6}
                        className="btn-primary btn" 
                        style={{ 
                          width: '100%',
                          padding: '16px',
                          background: 'linear-gradient(135deg, var(--theme-color, #C57642) 0%, #a55e35 100%)',
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: '10px',
                          fontSize: '16px', 
                          cursor: (isVerifying || !verificationCode || verificationCode.length !== 6) ? 'not-allowed' : 'pointer', 
                          transition: 'all 0.3s ease',
                          fontWeight: 500,
                          fontFamily: 'var(--title-font, "Jost", sans-serif)',
                          boxShadow: '0 4px 15px rgba(197, 118, 66, 0.3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginTop: '10px'
                        }}
                        onMouseOver={(e) => {
                          if (!isVerifying && verificationCode && verificationCode.length === 6) {
                            e.target.style.background = 'linear-gradient(135deg, #a55e35 0%, #8d4a2a 100%)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(197, 118, 66, 0.4)';
                          }
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, var(--theme-color, #C57642) 0%, #a55e35 100%)';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 15px rgba(197, 118, 66, 0.3)';
                        }}
                      >
                        {isVerifying ? 'Vérification...' : 'Vérifier le code'}
                      </button>
                    </div>
                  </div>
                </form>
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

export default Verify2FA;
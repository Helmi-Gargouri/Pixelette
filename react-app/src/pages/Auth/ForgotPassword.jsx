import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../_pageStyles.css';  

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');  
    try {
      const response = await axios.post('http://localhost:8000/api/utilisateurs/forgot_password/', { email });
      setMessage(response.data.message);
      setTimeout(() => navigate('/code-verification', { state: { email } }), 2000);  // Vers vérif code
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Échec'));
    } finally {
      setIsLoading(false);
    }
  };

  const messageClass = message.toLowerCase().includes('erreur') ? 'message message-error' : 'message message-success';

  return (
    <>
      {/* Header comme tes autres pages */}
      <header className="nav-header header-layout1" style={{ position: 'relative', zIndex: 10 }}>
        <div className="menu-area">
          <div className="container">
            <div className="row align-items-center justify-content-between">
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

      <section style={{ padding: '60px 0', background: 'var(--smoke-color, #F8F7F4)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="section-header text-center mb-5">
                <h2 style={{ color: 'var(--theme-color, #C57642)' }}>Mot de Passe Oublié ?</h2>
                <p>Entrez votre email pour recevoir un code de réinitialisation.</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="form-control" 
                    placeholder="votre@email.com" 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn btn-primary w-100 mt-3"
                  style={{ background: 'var(--theme-color, #C57642)', border: 'none' }}
                >
                  {isLoading ? 'Envoi...' : 'Envoyer le Code'}
                </button>
              </form>
              {message && (
                <div className={`mt-3 ${messageClass}`} style={{ 
                  textAlign: 'center', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid',
                  ...(messageClass.includes('success') ? { color: '#28a745', background: 'rgba(40, 167, 69, 0.1)' } : { color: '#dc3545', background: 'rgba(220, 53, 69, 0.1)' })
                }}>
                  {message}
                </div>
              )}
              <div className="text-center mt-3">
                <button onClick={() => navigate('/login')} style={{ color: 'var(--theme-color, #C57642)', background: 'none', border: 'none' }}>
                  Retour à la Connexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer comme tes autres */}
      <footer className="footer-wrapper footer-layout1" style={{ background: 'var(--smoke-color, #F8F7F4)', padding: '30px 0', textAlign: 'center' }}>
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

export default ForgotPassword;
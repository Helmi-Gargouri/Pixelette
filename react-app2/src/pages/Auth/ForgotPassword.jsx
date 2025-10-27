import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Modal from '../../components/Modal';

const ForgotPassword = () => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const [email, setEmail] = useState('');
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/utilisateurs/forgot_password/`, { email });
      setModal({ show: true, title: 'Succès !', message: response.data.message, type: 'success' });
      setTimeout(() => navigate('/code-verification', { state: { email } }), 2000);
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || 'Échec', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setModal({ ...modal, show: false });
  };

  return (
    <>
      <Modal
        show={modal.show}
        onClose={handleModalClose}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      <div className="space" style={{ paddingTop: '120px' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <div style={{ 
                background: '#fff', 
                padding: '50px 40px', 
                borderRadius: '20px', 
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
              }}>
                <div className="text-center mb-4">
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    background: '#F8F7F4', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <i className="fas fa-key" style={{ fontSize: '2rem', color: 'var(--theme-color)' }}></i>
                  </div>
                  <h2 className="sec-title" style={{ marginBottom: '10px' }}>
                    Mot de passe oublié ?
                  </h2>
                  <p style={{ color: '#7B7E86' }}>
                    Entrez votre email pour recevoir un code de réinitialisation
                  </p>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-3">
                    <label className="form-label">Adresse email</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="form-control" 
                      placeholder="votre@email.com" 
                      style={{ borderRadius: '10px', padding: '12px' }}
                      required 
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn w-100 mt-3"
                    style={{ padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: '500' }}
                  >
                    {isLoading ? 'Envoi...' : 'Envoyer le code'}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <Link 
                    to="/login"
                    className="text-theme"
                    style={{ fontSize: '0.95em', textDecoration: 'none' }}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Retour à la connexion
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;

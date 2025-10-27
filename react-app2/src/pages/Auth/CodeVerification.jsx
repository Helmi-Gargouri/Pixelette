import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Modal from '../../components/Modal';

const CodeVerification = () => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const [code, setCode] = useState('');
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' });
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 5) {
      setCode(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 5) {
      setModal({ show: true, title: 'Erreur', message: 'Le code doit faire 5 chiffres', type: 'error' });
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE}/utilisateurs/verify_code/`, { email, reset_code: code });
      setModal({ show: true, title: 'Succès !', message: 'Code vérifié !', type: 'success' });
      setTimeout(() => navigate('/reset-password', { state: { email, resetCode: code } }), 1500);
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.message || 'Code invalide', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCode('');
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
                    <i className="fas fa-envelope-open-text" style={{ fontSize: '2rem', color: 'var(--theme-color)' }}></i>
                  </div>
                  <h2 className="sec-title" style={{ marginBottom: '10px' }}>
                    Vérification du code
                  </h2>
                  <p style={{ color: '#7B7E86' }}>
                    Entrez le code de 5 chiffres envoyé à<br />
                    <strong>{email}</strong>
                  </p>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-4">
                    <input
                      type="text"
                      className="form-control"
                      value={code}
                      onChange={handleCodeChange}
                      placeholder="12345"
                      maxLength={5}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      autoFocus
                      style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        letterSpacing: '8px',
                        padding: '15px',
                        borderRadius: '10px',
                        border: '2px solid #ddd',
                        fontFamily: 'monospace'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--theme-color)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(197, 118, 66, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#ddd';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="btn w-100 mt-3"
                    style={{ padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: '500' }}
                  >
                    {isLoading ? 'Vérification...' : 'Vérifier'}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <Link 
                    to="/forgot-password"
                    className="text-theme"
                    style={{ fontSize: '0.95em', textDecoration: 'none' }}
                  >
                    <i className="fas fa-redo me-2"></i>
                    Renvoyer le code
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

export default CodeVerification;

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Modal from '../../components/Modal';

const ResetPassword = () => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' });
  const location = useLocation();
  const navigate = useNavigate();
  const { email, resetCode } = location.state || {};

  useEffect(() => {
    if (!resetCode) {
      setModal({ show: true, title: 'Erreur', message: 'Code de reset manquant', type: 'error' });
    }
  }, [resetCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setModal({ show: true, title: 'Erreur', message: 'Les mots de passe ne correspondent pas', type: 'error' });
      return;
    }
    try {
      await axios.post(`${API_BASE}utilisateurs/reset_password_code/`, {
        email,
        reset_code: resetCode,
        new_password: formData.newPassword,
        password_confirm: formData.confirmPassword
      });
      setModal({ show: true, title: 'Succès !', message: 'Mot de passe réinitialisé !', type: 'success' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setModal({ show: true, title: 'Erreur', message: err.response?.data?.message || 'Erreur lors de la réinitialisation', type: 'error' });
    }
  };

  const handleModalClose = () => {
    setModal({ ...modal, show: false });
    if (modal.type === 'success') {
      navigate('/login');
    }
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
                    <i className="fas fa-lock" style={{ fontSize: '2rem', color: 'var(--theme-color)' }}></i>
                  </div>
                  <h2 className="sec-title" style={{ marginBottom: '10px' }}>
                    Nouveau mot de passe
                  </h2>
                  <p style={{ color: '#7B7E86' }}>
                    Entrez votre nouveau mot de passe ci-dessous
                  </p>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-3">
                    <label className="form-label">Nouveau mot de passe</label>
                    <input
                      className="form-control"
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Minimum 8 caractères"
                      style={{ borderRadius: '10px', padding: '12px' }}
                      required
                    />
                  </div>
                  
                  <div className="form-group mb-3">
                    <label className="form-label">Confirmer le mot de passe</label>
                    <input
                      className="form-control"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirmez votre mot de passe"
                      style={{ borderRadius: '10px', padding: '12px' }}
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn w-100 mt-3"
                    style={{ padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: '500' }}
                  >
                    Réinitialiser le mot de passe
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

export default ResetPassword;

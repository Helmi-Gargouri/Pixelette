import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../_pageStyles.css';  

const ResetPassword = () => {
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { email, resetCode } = location.state || {};

  useEffect(() => {
    if (!resetCode) setError('Code de reset manquant.');
  }, [resetCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas !");
      return;
    }
    try {
      const response = await axios.post('http://localhost:8000/api/utilisateurs/reset_password_code/', {
        email,
        reset_code: resetCode,
        new_password: formData.newPassword,
        password_confirm: formData.confirmPassword
      });
      if (response.status === 200) {
        setSuccess(true);
        setError('');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation.');
    }
  };

  return (
    <>
      <header className="nav-header header-layout1" style={{ position: 'relative', zIndex: 10 }}>
        {/* Header comme avant */}
      </header>

      <section style={{ padding: '60px 0', background: 'var(--smoke-color, #F8F7F4)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="text-center mb-5">
                <h2 style={{ color: 'var(--theme-color, #C57642)' }}>Réinitialiser le Mot de Passe</h2>
                <p>Entrez votre nouveau mot de passe ci-dessous.</p>
              </div>
              <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger text-center mb-3" style={{ padding: '10px', borderRadius: '5px' }}>{error}</div>}
                {success && <div className="alert alert-success text-center mb-3" style={{ padding: '10px', borderRadius: '5px' }}>Réinitialisation réussie ! Redirection...</div>}
                <div className="mb-3">
                  <label className="form-label">Nouveau Mot de Passe</label>
                  <input
                    className="form-control"
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Nouveau mot de passe"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirmer le Mot de Passe</label>
                  <input
                    className="form-control"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirmer"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" style={{ background: 'var(--theme-color, #C57642)', border: 'none' }}>
                  Réinitialiser le Mot de Passe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-wrapper footer-layout1" style={{ background: 'var(--smoke-color, #F8F7F4)', padding: '30px 0', textAlign: 'center' }}>
        {/* Footer comme avant */}
      </footer>
    </>
  );
};

export default ResetPassword;
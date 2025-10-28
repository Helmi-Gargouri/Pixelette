import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

const Login = () => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const BACKOFFICE_URL = import.meta.env.VITE_BACKOFFICE_URL || 'http://localhost:5174';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE}/utilisateurs/login/`,
        { email, password },
        { withCredentials: true }
      );

      const userData = response.data.user;

      if (response.data.message === '2FA required') {
        localStorage.setItem('email', email);
        navigate('/two-factor', { state: { email, role: response.data.role } });
        return;
      }

      if (response.data.token && userData) {
        // Stocker le token et les données utilisateur dans localStorage
        login(userData, response.data.token);

        if (response.data.role === 'admin' || userData.role === 'admin') {
          // Admin : utiliser TempAuthStorage et rediriger vers backoffice
          setModal({
            show: true,
            title: 'Redirection...',
            message: 'Connexion admin réussie ! Redirection vers le backoffice...',
            type: 'success',
          });
          
          // Stocker temporairement les données admin
       // In Login.jsx, update storeTempAndRedirect

const storeTempAndRedirect = async () => {
  try {
    const storeResponse = await axios.post(
      `${API_BASE}/auth/store_temp/`,
      {
        token: response.data.token,
        user_data: userData,  // Change from user to user_data
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const tempId = storeResponse.data.temp_id;
    if (tempId) {
      window.location.href = `${BACKOFFICE_URL}/dashboard?temp_id=${encodeURIComponent(tempId)}`;
    } else {
      navigate('/');
    }
  } catch (error) {
    console.error('Erreur stockage temp:', error);
    setModal({
      show: true,
      title: 'Erreur',
      message: 'Erreur lors de la redirection admin.',
      type: 'error',
    });
    navigate('/');
  }
};

          storeTempAndRedirect();
        } else {
          // User/Artiste : rester sur le frontoffice
          setModal({
            show: true,
            title: 'Succès !',
            message: 'Connexion réussie !',
            type: 'success',
          });
          setTimeout(() => navigate('/'), 1500);
        }
      } else {
        throw new Error('Token ou utilisateur manquant dans la réponse');
      }
    } catch (error) {
      setModal({
        show: true,
        title: 'Erreur',
        message: error.response?.data?.error || 'Échec de connexion',
        type: 'error',
      });
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

      <div className="space">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <div
                style={{
                  background: '#fff',
                  padding: '50px 40px',
                  borderRadius: '20px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="text-center mb-4">
                  <h2 className="sec-title" style={{ marginBottom: '10px' }}>
                    Bienvenue
                  </h2>
                  <p style={{ color: '#7B7E86' }}>
                    Connectez-vous pour accéder à votre compte
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-3">
                    <label className="form-label">Email</label>
                    <input
                      className="form-control"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ borderRadius: '10px', padding: '12px' }}
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label">Mot de passe</label>
                    <input
                      className="form-control"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ borderRadius: '10px', padding: '12px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn w-100 mt-3"
                    style={{ padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: '500' }}
                  >
                    Se connecter
                  </button>
                </form>

                <div className="text-center mt-4">
                  <Link
                    to="/forgot-password"
                    className="text-theme"
                    style={{ fontSize: '0.95em', textDecoration: 'none' }}
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                <div className="text-center mt-4 pt-4" style={{ borderTop: '1px solid #e9ecef' }}>
                  <p style={{ color: '#7B7E86', marginBottom: '10px' }}>
                    Pas encore de compte ?{' '}
                    <Link
                      to="/register"
                      className="text-theme"
                      style={{ textDecoration: 'none', fontWeight: '500' }}
                    >
                      S'inscrire
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
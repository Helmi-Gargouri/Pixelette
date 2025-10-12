import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/utilisateurs/login/',
        { email, password },
        { withCredentials: true }
      );
      
      const userData = response.data.user;
      
      // Si l'utilisateur est admin, rediriger vers le backoffice
      if (userData && userData.role === 'admin') {
        // Stocke les données pour le backoffice
        window.sessionStorage.setItem('admin_user_data', JSON.stringify(userData));
        
        setModal({ 
          show: true, 
          title: 'Redirection...', 
          message: 'Connexion admin réussie ! Redirection vers le backoffice...', 
          type: 'success' 
        });
        
        // Redirige vers le backoffice sur le port 5174
        setTimeout(() => {
          window.location.href = 'http://localhost:5174';
        }, 1500);
        return;
      }
      
      // Pour les utilisateurs normaux
      if (response.data.token) {
        login(response.data.user, response.data.token);
        setModal({ 
          show: true, 
          title: 'Succès !', 
          message: 'Connexion réussie !', 
          type: 'success' 
        });
        setTimeout(() => navigate('/'), 1500);
      } else {
        login(response.data.user, response.data.token);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error) {
      setModal({ 
        show: true, 
        title: 'Erreur', 
        message: error.response?.data?.error || 'Échec de connexion', 
        type: 'error' 
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
              <div style={{ 
                background: '#fff', 
                padding: '50px 40px', 
                borderRadius: '20px', 
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
              }}>
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
                    Pas encore de compte ? <Link 
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
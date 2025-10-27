import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Modal from '../../components/Modal';

const Register = () => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    passwordConfirm: ''
  });
  const [errors, setErrors] = useState({});  
  const [showPassword, setShowPassword] = useState(false);  
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'nom':
      case 'prenom':
        if (!value.trim()) error = 'Ce champ est obligatoire';
        break;
      case 'email':
        if (!value.trim()) error = 'Ce champ est obligatoire';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Email invalide';
        break;
      case 'telephone':
        if (value && !/^\+?[\d\s-]{8,15}$/.test(value)) error = 'Numéro invalide';
        break;
      case 'password':
        if (!value) error = 'Ce champ est obligatoire';
        else if (value.length < 8) error = 'Minimum 8 caractères';
        break;
      case 'passwordConfirm':
        if (!value) error = 'Ce champ est obligatoire';
        else if (value !== formData.password) error = 'Les mots de passe ne correspondent pas';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setModal({ show: true, title: 'Erreur', message: 'Veuillez corriger les erreurs', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE}utilisateurs/`, 
        { ...formData, password_confirm: formData.passwordConfirm },
        { withCredentials: true }
      );
      setModal({ show: true, title: 'Succès !', message: 'Inscription réussie !', type: 'success' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || error.response?.data?.password || 'Échec inscription', type: 'error' });
    } finally {
      setIsSubmitting(false);
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
            <div className="col-lg-8 col-md-10">
              <div style={{ 
                background: '#fff', 
                padding: '50px 40px', 
                borderRadius: '20px', 
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
              }}>
                <div className="text-center mb-4">
                  <h2 className="sec-title" style={{ marginBottom: '10px' }}>
                    Créer un compte
                  </h2>
                  <p style={{ color: '#7B7E86' }}>
                    Rejoignez notre communauté d'artistes
                  </p>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prénom *</label>
                      <input 
                        type="text" 
                        name="prenom" 
                        value={formData.prenom} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        className={`form-control ${errors.prenom ? 'is-invalid' : ''}`} 
                        placeholder="Votre prénom" 
                        style={{ borderRadius: '10px', padding: '12px' }} 
                        required 
                      />
                      {errors.prenom && <div className="invalid-feedback">{errors.prenom}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nom *</label>
                      <input 
                        type="text" 
                        name="nom" 
                        value={formData.nom} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        className={`form-control ${errors.nom ? 'is-invalid' : ''}`} 
                        placeholder="Votre nom" 
                        style={{ borderRadius: '10px', padding: '12px' }} 
                        required 
                      />
                      {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      onBlur={handleBlur}
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
                      placeholder="votre@email.com" 
                      style={{ borderRadius: '10px', padding: '12px' }} 
                      required 
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Téléphone</label>
                    <input 
                      type="tel" 
                      name="telephone" 
                      value={formData.telephone} 
                      onChange={handleChange} 
                      onBlur={handleBlur}
                      className={`form-control ${errors.telephone ? 'is-invalid' : ''}`} 
                      placeholder="+33 1 23 45 67 89" 
                      style={{ borderRadius: '10px', padding: '12px' }} 
                    />
                    {errors.telephone && <div className="invalid-feedback">{errors.telephone}</div>}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Mot de Passe *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`} 
                        placeholder="Minimum 8 caractères" 
                        style={{ borderRadius: '10px', padding: '12px', paddingRight: '45px' }} 
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        style={{ 
                          position: 'absolute', 
                          right: '12px', 
                          top: '50%', 
                          transform: 'translateY(-50%)', 
                          background: 'none', 
                          border: 'none', 
                          color: '#7B7E86', 
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '0'
                        }}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                      {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Confirmer le mot de passe *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'} 
                        name="passwordConfirm" 
                        value={formData.passwordConfirm} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        className={`form-control ${errors.passwordConfirm ? 'is-invalid' : ''}`} 
                        placeholder="Confirmez votre mot de passe" 
                        style={{ borderRadius: '10px', padding: '12px', paddingRight: '45px' }} 
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                        style={{ 
                          position: 'absolute', 
                          right: '12px', 
                          top: '50%', 
                          transform: 'translateY(-50%)', 
                          background: 'none', 
                          border: 'none', 
                          color: '#7B7E86', 
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '0'
                        }}
                      >
                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                      {errors.passwordConfirm && <div className="invalid-feedback">{errors.passwordConfirm}</div>}
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn w-100 mt-4"
                    style={{ padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: '500' }}
                  >
                    {isSubmitting ? 'Inscription en cours...' : 'S\'inscrire'}
                  </button>
                </form>

                <div className="text-center mt-4 pt-4" style={{ borderTop: '1px solid #e9ecef' }}>
                  <p style={{ color: '#7B7E86', marginBottom: '10px' }}>
                    Vous avez déjà un compte ? <Link 
                      to="/login"
                      className="text-theme"
                      style={{ textDecoration: 'none', fontWeight: '500' }}
                    >
                      Se connecter
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

export default Register;

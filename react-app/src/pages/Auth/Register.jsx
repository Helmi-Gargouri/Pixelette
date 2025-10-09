import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../_pageStyles.css';  

const Register = () => {
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
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'nom':
      case 'prenom':
        if (!value.trim()) error = 'Ce champ est obligatoire. Veuillez saisir votre nom.';
        break;
      case 'email':
        if (!value.trim()) error = 'Ce champ est obligatoire. Veuillez saisir votre email.';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Email invalide.';
        break;
      case 'telephone':
        if (value && !/^\+?[\d\s-]{8,15}$/.test(value)) error = 'Numéro de téléphone invalide.';
        break;
      case 'password':
        if (!value) error = 'Ce champ est obligatoire. Veuillez saisir votre mot de passe.';
        else if (value.length < 8) error = 'Le mot de passe doit contenir au moins 8 caractères.';
        break;
      case 'passwordConfirm':
        if (!value) error = 'Ce champ est obligatoire. Veuillez confirmer votre mot de passe.';
        else if (value !== formData.password) error = 'Les mots de passe ne correspondent pas.';
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
      setMessage('Veuillez corriger les erreurs ci-dessous.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      await axios.post('http://localhost:8000/api/utilisateurs/', 
        { ...formData, password_confirm: formData.passwordConfirm },
        { withCredentials: true }
      );
      setMessage('Inscription réussie ! Redirection...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || error.response?.data?.password || 'Échec'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageClass = message
    ? (message.toLowerCase().includes('erreur') ? 'message message-error' : 'message message-success')
    : '';

  const togglePasswordVisibility = (field) => {
    if (field === 'password') setShowPassword(!showPassword);
    else setShowConfirmPassword(!showConfirmPassword);
  };

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
          background: 'url("/assets/img/auth-bg.jpg") center/cover no-repeat', 
          opacity: 0.1, 
          zIndex: -1 
        }}></div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <div className="login-form-container" style={{ 
                background: 'white', 
                padding: '40px', 
                borderRadius: '20px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
                position: 'relative' 
              }}>
                <div className="mb-4 text-center">
                  <h2 style={{ 
                    color: 'var(--theme-color, #C57642)', 
                    fontFamily: 'var(--title-font, "Jost", sans-serif)', 
                    marginBottom: '10px' 
                  }}>
                    Inscription
                  </h2>
                  <p style={{ color: 'var(--body-color, #7B7E86)', fontSize: '14px' }}>
                    Créez votre compte pour explorer la galerie d'art.
                  </p>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label" style={{ fontWeight: '600', color: 'var(--body-color, #7B7E86)' }}>Prénom</label>
                      <input 
                        type="text" 
                        name="prenom" 
                        value={formData.prenom} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        className={`form-control ${errors.prenom ? 'is-invalid' : ''}`} 
                        placeholder="Votre prénom" 
                        style={{ borderRadius: '10px', border: '1px solid #e9ecef' }} 
                        required 
                      />
                      {errors.prenom && <div className="invalid-feedback" style={{ fontSize: '12px' }}>{errors.prenom}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label" style={{ fontWeight: '600', color: 'var(--body-color, #7B7E86)' }}>Nom</label>
                      <input 
                        type="text" 
                        name="nom" 
                        value={formData.nom} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        className={`form-control ${errors.nom ? 'is-invalid' : ''}`} 
                        placeholder="Votre nom" 
                        style={{ borderRadius: '10px', border: '1px solid #e9ecef' }} 
                        required 
                      />
                      {errors.nom && <div className="invalid-feedback" style={{ fontSize: '12px' }}>{errors.nom}</div>}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--body-color, #7B7E86)' }}>Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      onBlur={handleBlur}
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
                      placeholder="votre@email.com" 
                      style={{ borderRadius: '10px', border: '1px solid #e9ecef' }} 
                      required 
                    />
                    {errors.email && <div className="invalid-feedback" style={{ fontSize: '12px' }}>{errors.email}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--body-color, #7B7E86)' }}>Téléphone</label>
                    <input 
                      type="tel" 
                      name="telephone" 
                      value={formData.telephone} 
                      onChange={handleChange} 
                      onBlur={handleBlur}
                      className={`form-control ${errors.telephone ? 'is-invalid' : ''}`} 
                      placeholder="+33 1 23 45 67 89" 
                      style={{ borderRadius: '10px', border: '1px solid #e9ecef' }} 
                    />
                    {errors.telephone && <div className="invalid-feedback" style={{ fontSize: '12px' }}>{errors.telephone}</div>}
                  </div>
                  <div className="mb-3 position-relative">
                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--body-color, #7B7E86)' }}>Mot de Passe</label>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      onBlur={handleBlur}
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`} 
                      placeholder="Au moins 8 caractères" 
                      style={{ borderRadius: '10px', border: '1px solid #e9ecef', paddingRight: '40px' }} 
                      required 
                    />
                    {/* ← NOUVEAU : Icône œil élégante (assume Font Awesome ou SVG inline) */}
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
                        color: 'var(--body-color, #7B7E86)', 
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0'
                      }}
                      title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ transition: 'opacity 0.2s' }}></i>  {/* Font Awesome */}
                    </button>
                    {errors.password && <div className="invalid-feedback" style={{ fontSize: '12px' }}>{errors.password}</div>}
                  </div>
                  <div className="mb-3 position-relative">
                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--body-color, #7B7E86)' }}>Confirmer Mot de Passe</label>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      name="passwordConfirm" 
                      value={formData.passwordConfirm} 
                      onChange={handleChange} 
                      onBlur={handleBlur}
                      className={`form-control ${errors.passwordConfirm ? 'is-invalid' : ''}`} 
                      placeholder="Confirmez votre mot de passe" 
                      style={{ borderRadius: '10px', border: '1px solid #e9ecef', paddingRight: '40px' }} 
                      required 
                    />
                    {/* ← NOUVEAU : Icône œil pour confirm */}
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
                        color: 'var(--body-color, #7B7E86)', 
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0'
                      }}
                      title={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ transition: 'opacity 0.2s' }}></i>
                    </button>
                    {errors.passwordConfirm && <div className="invalid-feedback" style={{ fontSize: '12px' }}>{errors.passwordConfirm}</div>}
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn btn-primary w-100 mt-3"
                    style={{ 
                      background: 'linear-gradient(135deg, var(--theme-color, #C57642) 0%, #a55c38 100%)',  
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontFamily: 'var(--title-font, "Jost", sans-serif)',
                      boxShadow: '0 4px 15px rgba(197, 118, 66, 0.3)',  
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    {isSubmitting ? 'Inscription en cours...' : 'S\'inscrire'}
                  </button>
                </form>
                {message && (
                  <div className={`mt-4 ${messageClass}`} role="status" style={{ 
                    textAlign: 'center', 
                    marginTop: '25px', 
                    padding: '12px',
                    borderRadius: '10px', 
                    fontWeight: 500,
                    fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                    border: '1px solid',
                    width: '100%',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',  
                    ...(messageClass.includes('success') ? { 
                      color: '#28a745', 
                      background: 'rgba(40, 167, 69, 0.1)',
                      borderColor: '#28a745'
                    } : { 
                      color: '#dc3545', 
                      background: 'rgba(220, 53, 69, 0.1)',
                      borderColor: '#dc3545'
                    })
                  }}>
                    {message}
                  </div>
                )}
                <div className="text-center mt-4">
                  <button 
                    onClick={() => navigate('/login')} 
                    style={{ 
                      color: 'var(--theme-color, #C57642)', 
                      background: 'none', 
                      border: 'none', 
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.color = '#a55c38'}
                    onMouseOut={(e) => e.target.style.color = 'var(--theme-color, #C57642)'}
                  >
                    Déjà un compte ? Se connecter
                  </button>
                </div>
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
                <a href="https://facebook.com/" style={{ color: 'var(--theme-color, #C57642)', transition: 'color 0.3s ease' }} onMouseOver={(e) => e.target.style.color = '#a55c38'} onMouseOut={(e) => e.target.style.color = 'var(--theme-color, #C57642)'}><i className="fab fa-facebook-f"></i></a>
                <a href="https://twitter.com/" style={{ color: 'var(--theme-color, #C57642)', transition: 'color 0.3s ease' }} onMouseOver={(e) => e.target.style.color = '#a55c38'} onMouseOut={(e) => e.target.style.color = 'var(--theme-color, #C57642)'}><i className="fab fa-twitter"></i></a>
                <a href="https://instagram.com/" style={{ color: 'var(--theme-color, #C57642)', transition: 'color 0.3s ease' }} onMouseOver={(e) => e.target.style.color = '#a55c38'} onMouseOut={(e) => e.target.style.color = 'var(--theme-color, #C57642)'}><i className="fab fa-instagram"></i></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Register;
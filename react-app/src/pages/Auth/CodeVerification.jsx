import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../_pageStyles.css';  

const CodeVerification = () => {
  const [resetCode, setResetCode] = useState(['', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const digitValidate = (value) => value.replace(/[^0-9]/g, '');

  const handleInputChange = (index, value) => {
    const validatedValue = digitValidate(value);
    if (validatedValue.length <= 1) {
      const newResetCode = [...resetCode];
      newResetCode[index] = validatedValue;
      setResetCode(newResetCode);
      if (validatedValue && index < 4) inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !resetCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resetCodeString = resetCode.join('');
    if (resetCodeString.length !== 5) {
      setError('Le code doit faire 5 chiffres.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/utilisateurs/verify_code/', { email, reset_code: resetCodeString });
      setMessage('Code vérifié avec succès !');
      setError('');
      setTimeout(() => navigate('/reset-password', { state: { email, resetCode: resetCodeString } }), 1500);
    } catch (error) {
      setMessage('');
      setError(error.response?.data?.message || 'Code invalide, réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResetCode(['', '', '', '', '']);
    inputRefs.current[0].focus();
  };

  return (
    <>
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
              <div className="text-center mb-5">
                <h2 style={{ color: 'var(--theme-color, #C57642)' }}>Vérification du Code</h2>
                <p>Entrez le code de 5 chiffres envoyé à <strong>{email}</strong></p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="d-flex justify-content-center gap-2 mb-4">
                  {resetCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      className="form-control text-center h-60 w-60"  // Classes custom pour taille
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      type="text"
                    />
                  ))}
                </div>
                {message && <p className="text-success text-center">{message}</p>}
                {error && <p className="text-danger text-center">{error}</p>}
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="btn btn-primary w-100" 
                  style={{ background: 'var(--theme-color, #C57642)', border: 'none' }}
                >
                  {isLoading ? 'Vérification...' : 'Vérifier'}
                </button>
              </form>
              <div className="text-center mt-3">
                <button onClick={handleReset} style={{ color: 'var(--theme-color, #C57642)', background: 'none', border: 'none' }}>
                  Réinitialiser les Champs
                </button>
              </div>
              <div className="text-center mt-3">
                <button onClick={() => navigate('/forgot-password')} style={{ color: 'var(--theme-color, #C57642)', background: 'none', border: 'none' }}>
                  Renvoyer le Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-wrapper footer-layout1" style={{ background: 'var(--smoke-color, #F8F7F4)', padding: '30px 0', textAlign: 'center' }}>
        {/* Ton footer existant */}
      </footer>
    </>
  );
};

export default CodeVerification;
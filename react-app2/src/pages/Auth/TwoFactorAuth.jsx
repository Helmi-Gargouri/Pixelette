import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from '../../context/AuthContext';

const TwoFactorAuth = () => {
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [qrCode, setQrCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = localStorage.getItem("email");
  
  const inputRefs = useRef([]);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log("⚠️ Utilisateur déjà connecté, redirection...");
          navigate('/');
          return;
        }

        if (!email) {
          throw new Error("Aucun email trouvé dans le stockage local !");
        }

        console.log("📤 Envoi requête QR code avec email:", email);

        const response = await axios.post(
          "http://localhost:8000/api/utilisateurs/verify_2fa/",
          { email: email },
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        console.log("📌 Réponse API QR Code:", response.data);

        if (response.data.qrCode) {
          setQrCode(response.data.qrCode);
        }
        setLoading(false);
      } catch (error) {
        console.error("❌ Erreur complète:", error);
        console.error("❌ Réponse erreur:", error.response?.data);
        setError(error.response?.data?.error || error.message);
        setLoading(false);
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    fetchQRCode();
  }, [email, navigate]);

  const handleInputChange = (index, value) => {
    // N'autoriser que les chiffres
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Passer au champ suivant si un chiffre est saisi
    if (value !== "" && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (index, e) => {
    // Gérer la touche retour arrière
    if (e.key === 'Backspace') {
      if (verificationCode[index] === '' && index > 0) {
        // Si le champ est vide, aller au champ précédent
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      } else if (verificationCode[index] !== '') {
        // Si le champ contient un chiffre, le vider d'abord
        const newCode = [...verificationCode];
        newCode[index] = '';
        setVerificationCode(newCode);
      }
    }
    
    // Gérer les flèches pour naviguer
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
      }, 10);
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, 6);
    
    const newCode = [...verificationCode];
    digits.forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });
    
    setVerificationCode(newCode);
    
    // Focus sur le dernier champ rempli
    const lastFilledIndex = digits.length - 1;
    if (lastFilledIndex < 5) {
      setTimeout(() => {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      }, 10);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError(null);

    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError("Veuillez saisir les 6 chiffres du code de vérification");
      return;
    }

    try {
      if (!email) {
        throw new Error("Aucun email trouvé pour la vérification du 2FA !");
      }

      console.log("📤 Envoi code 2FA:", { email, code });

      const response = await axios.post(
        "http://localhost:8000/api/utilisateurs/verify_2fa/",
        { email, token: code },
        { withCredentials: true }
      );

      console.log("📌 Réponse API Vérification 2FA:", response.data);

      if (response.data.token && response.data.user) {
        console.log("✅ 2FA vérifié avec succès !");
        
        localStorage.removeItem("email");
        
        if (typeof login !== 'function') {
          console.error("❌ La fonction login n'est pas disponible dans le contexte!");
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          window.location.href = "/";
          return;
        }
        
        console.log("🔐 Appel de la fonction login...");
        login(response.data.user, response.data.token);
        
        console.log("✅ Login terminé, redirection...");
        window.location.href = "/";
      } else {
        throw new Error("Token ou utilisateur manquant dans la réponse");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la vérification 2FA :", error);
      setError(error.response?.data?.error || error.message);
      
      // Réinitialiser le code en cas d'erreur
      setVerificationCode(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 10);
    }
  };

  return (
    <div className="sign-in-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="text-primary-dark f-w-600 mb-3">Authentification 2FA</h2>
                  <p className="text-muted">
                    Scannez le QR code avec Google Authenticator et entrez le code à 6 chiffres.
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger text-center" role="alert">
                    {error}
                    <div className="mt-2">
                      <Link to="/login" className="btn btn-sm btn-secondary">
                        Retour à la connexion
                      </Link>
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p className="mt-3 text-muted">Chargement du QR code...</p>
                  </div>
                ) : (
                  <>
                    {qrCode && (
                      <div className="text-center mb-4">
                        <div className="bg-light rounded-3 p-4 d-inline-block">
                          <img 
                            src={qrCode} 
                            alt="QR Code" 
                            className="img-fluid" 
                            style={{ maxWidth: '200px' }} 
                          />
                        </div>
                        <p className="mt-3 text-muted small">
                          Scannez ce QR code avec Google Authenticator
                        </p>
                      </div>
                    )}

                    <form onSubmit={handleVerifyCode}>
                      <div className="mb-4">
                        <label className="form-label text-center w-100 mb-3 fw-semibold">
                          Code de vérification
                        </label>
                        <div className="d-flex justify-content-center gap-2 mb-3">
                          {verificationCode.map((digit, index) => (
                            <input
                              key={index}
                              ref={el => inputRefs.current[index] = el}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength="1"
                              value={digit}
                              onChange={(e) => handleInputChange(index, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              onFocus={handleFocus}
                              onPaste={handlePaste}
                              style={{
                                width: '50px',
                                height: '60px',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                color: '#000000',
                                backgroundColor: '#ffffff',
                                border: '2px solid #dee2e6',
                                borderRadius: '8px',
                                padding: '0',
                                margin: '0',
                                display: 'block',
                                outline: 'none',
                                transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = '#86b7fe';
                                e.target.style.boxShadow = '0 0 0 0.25rem rgba(13, 110, 253, 0.25)';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = '#dee2e6';
                                e.target.style.boxShadow = 'none';
                              }}
                              required
                            />
                          ))}
                        </div>
                      </div>

                      <button 
                        className="btn btn-primary w-100 py-3 fw-semibold" 
                        type="submit"
                        disabled={verificationCode.join('').length !== 6}
                      >
                        Vérifier le code
                      </button>
                    </form>

                    <div className="text-center mt-4">
                      <Link to="/login" className="text-muted text-decoration-none">
                        ← Retour à la connexion
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
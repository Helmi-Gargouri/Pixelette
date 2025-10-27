import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import logoDark from '@/assets/images/logo-dark.png';
import logoLight from '@/assets/images/logo-light.png';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import PageMeta from '@/components/PageMeta';

const TwoFactorAuth = () => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || localStorage.getItem('email');
  const inputRefs = useRef([]);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('⚠️ Utilisateur déjà connecté, redirection...');
          navigate('/');
          return;
        }

        if (!email) {
          throw new Error('Aucun email trouvé pour la vérification 2FA !');
        }

        console.log('📤 Envoi requête QR code avec email:', email);

        const response = await axios.post(
          'http://localhost:8000/api/utilisateurs/verify_2fa/',
          { email },
          { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
        );

        console.log('📌 Réponse API QR Code:', response.data);

        if (response.data.qrCode) {
          setQrCode(response.data.qrCode);
        }
        setLoading(false);
      } catch (error) {
        console.error('❌ Erreur complète:', error);
        console.error('❌ Réponse erreur:', error.response?.data);
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
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value !== '' && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (verificationCode[index] === '' && index > 0) {
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      } else if (verificationCode[index] !== '') {
        const newCode = [...verificationCode];
        newCode[index] = '';
        setVerificationCode(newCode);
      }
    }

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
      setError('Veuillez saisir les 6 chiffres du code de vérification');
      return;
    }

    try {
      if (!email) {
        throw new Error('Aucun email trouvé pour la vérification 2FA !');
      }

      console.log('📤 Envoi code 2FA:', { email, code });

      const response = await axios.post(
        'http://localhost:8000/api/utilisateurs/verify_2fa/',
        { email, token: code },
        { withCredentials: true }
      );

      console.log('📌 Réponse API Vérification 2FA:', response.data);

      if (response.data.token && response.data.user) {
        if (!response.data.user.role || (response.data.user.role !== 'admin' && response.data.user.role !== 'artiste')) {
          throw new Error('Accès refusé : seuls les administrateurs et artistes peuvent accéder au backoffice');
        }

        console.log('✅ 2FA vérifié avec succès !');

        localStorage.removeItem('email');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Vérification 2FA réussie !');

        if (response.data.user.role === 'admin') {
          navigate('/users-list');
        } else if (response.data.user.role === 'artiste') {
          navigate('/');
        }
      } else {
        throw new Error('Token ou utilisateur manquant dans la réponse');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification 2FA:', error);
      setError(error.response?.data?.error || error.message);
      setVerificationCode(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 10);
    }
  };

  return (
    <>
      <PageMeta title="Two-Factor Authentication" />
      <div className="relative min-h-screen w-full flex justify-center items-center py-16 md:py-10">
        <div className="card md:w-lg w-screen z-10">
          <div className="text-center px-10 py-12">
            <Link to="/" className="flex justify-center mb-6">
              <img src={logoDark} alt="logo dark" className="h-6 flex dark:hidden" width={111} />
              <img src={logoLight} alt="logo light" className="h-6 hidden dark:flex" width={111} />
            </Link>

            <div className="mt-4 text-center">
              <h4 className="mb-2.5 text-xl font-semibold text-primary">Vérification à deux facteurs</h4>
              <p className="text-base text-default-500">Entrez le code de votre application d'authentification pour vous connecter.</p>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
                <div className="mt-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="btn btn-sm bg-danger/10 text-danger hover:bg-danger/20 transition duration-200"
                  >
                    Retour à la connexion
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <Loader className="animate-spin h-8 w-8 text-primary mx-auto" />
                <p className="mt-3 text-default-600">Chargement du QR code...</p>
              </div>
            ) : (
              <>
                {qrCode && (
                  <div className="text-center mb-8">
                    <div className="bg-white border border-default-200 rounded-lg p-4 inline-block shadow-sm">
                      <img
                        src={qrCode}
                        alt="QR Code"
                        className="img-fluid"
                        style={{ maxWidth: '200px', height: '200px' }}
                      />
                    </div>
                    <p className="mt-3 text-default-600 text-sm">
                      Scannez ce QR code avec une application comme Google Authenticator
                    </p>
                  </div>
                )}

                <form onSubmit={handleVerifyCode} className="w-full mt-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-default-700 mb-3 text-center">
                      Code de vérification
                    </label>
                    <div className="flex justify-center gap-2 mb-4">
                      {verificationCode.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onFocus={handleFocus}
                          onPaste={handlePaste}
                          className="form-input w-12 h-14 text-center text-lg font-semibold border-2 border-default-300 rounded-lg focus:border-primary focus:ring focus:ring-primary/20 transition duration-200 shadow-sm hover:border-primary/50"
                          required
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn bg-primary text-white w-full hover:bg-primary/90 transition duration-200 disabled:opacity-50"
                    disabled={verificationCode.join('').length !== 6}
                  >
                    Vérifier le code
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-default-500 text-sm font-medium hover:text-primary transition duration-200"
                  >
                    ← Retour à la connexion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <svg aria-hidden="true" className="absolute inset-0 size-full fill-black/2 stroke-black/5 dark:fill-white/2.5 dark:stroke-white/2.5">
            <defs>
              <pattern id="authPattern" width="56" height="56" patternUnits="userSpaceOnUse" x="50%" y="16">
                <path d="M.5 56V.5H72" fill="none"></path>
              </pattern>
            </defs>
            <rect width="100%" height="100%" strokeWidth="0" fill="url(#authPattern)"></rect>
          </svg>
        </div>
      </div>
    </>
  );
};

export default TwoFactorAuth;
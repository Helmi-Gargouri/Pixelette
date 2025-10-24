import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import logoDark from '@/assets/images/logo-dark.png';
import logoLight from '@/assets/images/logo-light.png';
import PageMeta from '@/components/PageMeta';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyCode = () => {
  const [code, setCode] = useState(['', '', '', '', '']);  // 5 digits
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupère l'email depuis navigation state ou localStorage
  const email = location.state?.email || localStorage.getItem('resetEmail') || '';

  // Vérifie si email existe, sinon redirige
  useEffect(() => {
    if (!email) {
      toast.error('Email manquant. Veuillez recommencer.');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleInputChange = (index, value) => {
    // Accepte seulement les chiffres
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Si input vide, revenir à l'input précédent
        inputRefs.current[index - 1].focus();
      } else {
        // Sinon, effacer l'input actuel
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Vérifie si c'est 5 chiffres
    if (/^\d{5}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      // Focus le dernier input
      inputRefs.current[4].focus();
    } else {
      toast.error('Le code doit contenir exactement 5 chiffres');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const fullCode = code.join('');
    if (fullCode.length !== 5) {
      setError('Code incomplet (5 chiffres requis)');
      toast.error('Code incomplet (5 chiffres requis)');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(
        'http://localhost:8000/api/utilisateurs/verify_code/', 
        { 
          email: email,
          reset_code: fullCode 
        },
        { withCredentials: true }
      );
      
      toast.success('Code vérifié !');
      
      // ✅ Passe le code ET l'email dans le state pour la page suivante
      navigate('/basic-create-password', { 
        state: { 
          email: email,
          resetCode: fullCode,  // ← Important: passer le code ici!
          verified: true 
        } 
      });
    } catch (error) {
      console.error('Verification error:', error.response?.data);
      const errMsg = error.response?.data?.error || 
                     error.response?.data?.message || 
                     'Code invalide ou expiré.';
      setError(errMsg);
      toast.error(errMsg);
      // Reset code pour retry
      setCode(['', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await axios.post(
        'http://localhost:8000/api/utilisateurs/forgot_password/', 
        { email },
        { withCredentials: true }
      );
      toast.success('Nouveau code envoyé !');
      // Reset le code actuel
      setCode(['', '', '', '', '']);
      setError('');
      inputRefs.current[0].focus();
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Erreur lors de l\'envoi du code';
      toast.error(errMsg);
    }
  };

  return (
    <>
      <PageMeta title="Verify Code" />
      <div className="relative min-h-screen w-full flex justify-center items-center py-16 md:py-10">
        <div className="card md:w-lg w-screen z-10">
          <div className="text-center px-10 py-12">
            <Link to="/" className="flex justify-center">
              <img src={logoDark} alt="logo dark" className="h-6 flex dark:hidden" width={111} />
              <img src={logoLight} alt="logo light" className="h-6 hidden dark:flex" width={111} />
            </Link>

            <div className="mt-8">
              <h4 className="mb-4 text-primary text-xl font-semibold">Verify Code</h4>
              <p className="text-base mb-8 text-default-500">
                Please enter the 5 digit code sent to <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
              {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-5 gap-2 mb-4" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    className="form-input text-center text-lg font-bold"
                    placeholder="•"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    autoFocus={index === 0}
                    disabled={loading}
                  />
                ))}
              </div>

              <div className="flex justify-center gap-4 mb-4">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm text-primary underline hover:no-underline disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading || code.some(d => !d)}
                  className="btn text-white bg-primary w-full disabled:opacity-50"
                >
                  {loading ? <Loader className="animate-spin w-4 h-4 mx-auto" /> : 'Confirm'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <Link to="/basic-login" className="text-primary underline">
                Back to Login
              </Link>
            </div>
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

export default VerifyCode;
// ResetPassword.jsx - Version corrigée avec debug amélioré
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import logoDark from '@/assets/images/logo-dark.png';
import logoLight from '@/assets/images/logo-light.png';
import PageMeta from '@/components/PageMeta';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState({ email: null, resetCode: null });
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupère email ET resetCode depuis location.state
  const { email, resetCode, verified } = location.state || {};

  useEffect(() => {
    console.log('🔍 ResetPassword mounted');
    console.log('📦 Location state complet:', location.state);
    console.log('📧 Email:', email);
    console.log('🔑 ResetCode:', resetCode);
    console.log('✅ Verified:', verified);
    
    setDebugInfo({ email, resetCode: resetCode ? 'présent' : 'manquant' });
    
    if (!email) {
      console.error('❌ Email manquant');
      toast.error('Email manquant. Veuillez recommencer.');
      navigate('/forgot-password');
      return;
    }
    
    if (!resetCode) {
      console.error('❌ Reset code manquant');
      toast.error('Code de vérification manquant.');
      navigate('/basic-two-steps', { state: { email } });
      return;
    }
    
    console.log('✅ Toutes les données sont présentes');
  }, [email, resetCode, navigate, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Input changed: ${name} = "${value}"`);
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validatePasswords = () => {
    console.log('🔐 Validation des mots de passe...');
    console.log('  - Longueur newPassword:', formData.newPassword.length);
    console.log('  - Longueur confirmPassword:', formData.confirmPassword.length);
    console.log('  - Match:', formData.newPassword === formData.confirmPassword);
    
    if (formData.newPassword.length < 8) {
      return { valid: false, message: 'Le mot de passe doit faire au moins 8 caractères' };
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      return { valid: false, message: 'Les mots de passe ne correspondent pas' };
    }
    
    return { valid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 === SUBMIT CLICKED ===');
    console.log('📊 État actuel:', {
      email,
      resetCode: resetCode ? '✅ présent' : '❌ manquant',
      newPasswordLength: formData.newPassword.length,
      confirmPasswordLength: formData.confirmPassword.length,
      match: formData.newPassword === formData.confirmPassword,
      loading
    });
    
    // Validation
    const validation = validatePasswords();
    if (!validation.valid) {
      console.error('❌ Validation échouée:', validation.message);
      setError(validation.message);
      toast.error(validation.message);
      return;
    }

    console.log('✅ Validation passée - Début de l\'appel API');
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        email: email,
        reset_code: resetCode,
        new_password: formData.newPassword
      };
      
      console.log('📤 Envoi du payload:', {
        ...payload,
        new_password: '***' // Masqué pour la sécurité
      });
      
      const response = await axios.post(
        'http://localhost:8000/api/utilisateurs/reset_password_code/',
        payload,
        { withCredentials: true }
      );
      
      console.log('✅ Succès API:', response.data);
      toast.success('Mot de passe réinitialisé avec succès !');
      
      // Nettoie le localStorage
      localStorage.removeItem('resetEmail');
      localStorage.removeItem('reset_code');
      
      setTimeout(() => {
        console.log('➡️ Redirection vers login');
        navigate('/basic-login');
      }, 1500);
      
    } catch (err) {
      console.error('❌ Erreur API complète:', err);
      console.error('📛 Response data:', err.response?.data);
      console.error('📛 Status:', err.response?.status);
      
      const errMsg = err.response?.data?.error || 
                     err.response?.data?.message || 
                     err.response?.data?.detail ||
                     err.response?.data?.non_field_errors?.[0] ||
                     'Erreur lors de la réinitialisation du mot de passe';
      
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      console.log('🏁 Fin du submit');
      setLoading(false);
    }
  };

  // Si données manquantes, affiche erreur
  if (!email || !resetCode) {
    return (
      <div className="h-screen w-full flex justify-center items-center bg-default-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-danger mb-4">⚠️ Erreur</h2>
          <p className="text-default-600 mb-4">Informations manquantes pour la réinitialisation.</p>
          <div className="text-sm text-left bg-gray-100 p-4 rounded mb-4">
            <p>Email: {email || '❌ manquant'}</p>
            <p>Code: {resetCode || '❌ manquant'}</p>
          </div>
          <Link to="/forgot-password" className="btn bg-primary text-white">
            Retour à la récupération
          </Link>
        </div>
      </div>
    );
  }

  const isButtonDisabled = loading || 
                          formData.newPassword.length < 8 || 
                          formData.newPassword !== formData.confirmPassword;

  console.log('🎨 Render - Button disabled:', isButtonDisabled);

  return (
    <>
      <PageMeta title="Reset Password" />
      <div className="relative min-h-screen w-full flex justify-center items-center py-16 md:py-10">
        <div className="card md:w-lg w-screen z-10">
          <div className="text-center px-10 py-12">
            <Link to="/" className="flex justify-center">
              <img src={logoDark} alt="logo dark" className="h-6 flex dark:hidden" width={111} />
              <img src={logoLight} alt="logo light" className="h-6 hidden dark:flex" width={111} />
            </Link>

            <div className="mt-8">
              <h4 className="mb-2 text-primary text-xl font-semibold">Set a New Password</h4>
              <p className="text-base mb-4 text-default-500">
                Your new password should be distinct from any of your prior passwords
              </p>
              <p className="text-sm text-default-400 mb-4">
                Pour: <strong>{email}</strong>
              </p>
            </div>

            {/* Debug info - à retirer en production */}
            <div className="text-xs text-left bg-blue-50 p-3 rounded mb-4">
              <p>🔍 Debug:</p>
              <p>Email: {debugInfo.email}</p>
              <p>Code: {debugInfo.resetCode}</p>
              <p>Password length: {formData.newPassword.length}</p>
              <p>Passwords match: {formData.newPassword === formData.confirmPassword ? '✅' : '❌'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="text-start">
                <label htmlFor="newPassword" className="block text-sm font-medium text-default-700 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className="form-input w-full"
                  placeholder="Min 8 caractères"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <p className="text-xs text-default-400 mt-1">
                  {formData.newPassword.length}/8 caractères minimum
                </p>
              </div>

              <div className="text-start">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-default-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input w-full"
                  placeholder="Confirmer"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                {formData.confirmPassword && (
                  <p className={`text-xs mt-1 ${formData.newPassword === formData.confirmPassword ? 'text-success' : 'text-danger'}`}>
                    {formData.newPassword === formData.confirmPassword ? '✅ Correspond' : '❌ Ne correspond pas'}
                  </p>
                )}
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isButtonDisabled}
                  onClick={() => console.log('🖱️ Bouton cliqué!')}
                  className="btn bg-primary text-white w-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin w-4 h-4 mr-2" />
                      Réinitialisation...
                    </span>
                  ) : 'Réinitialiser le mot de passe'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-base text-default-800">
                  J'ai mon mot de passe...{' '}
                  <Link to="/basic-login" className="text-primary underline">
                    Se connecter
                  </Link>
                </p>
              </div>
            </form>
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

export default ResetPassword;
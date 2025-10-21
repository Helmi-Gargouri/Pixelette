import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import logoDark from '@/assets/images/logo-dark.png';
import logoLight from '@/assets/images/logo-light.png';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import PageMeta from '@/components/PageMeta';
import { Loader } from "lucide-react";
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'http://localhost:8000/api/utilisateurs/login/',
        formData,
        { withCredentials: true }
      );
      console.log('Réponse API:', response.data);
      const { token, user, message, email } = response.data;

      // Gestion du 2FA
      if (message === '2FA required') {
        localStorage.setItem('email', email); // Stocke l'email pour la vérification 2FA
        navigate('/two-factor', { state: { email } }); // Redirige vers la page 2FA
        return;
      }

      // Vérifie que l'utilisateur est admin ou artiste
      if (!user || !user.role || (user.role !== 'admin' && user.role !== 'artiste')) {
        throw new Error('Accès refusé : seuls les administrateurs et artistes peuvent accéder au backoffice');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (rememberMe) {
        // Optionnel: Persist pour "remember me" (ex. localStorage au lieu de sessionStorage)
      }
      toast.success('Connexion réussie !');
      if (user.role === 'admin') {
        navigate('/admin/users'); // Redirige vers liste users admin
      } else if (user.role === 'artiste') {
        navigate('/'); // Redirige artiste vers dashboard
      }
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Erreur de connexion. Vérifiez vos identifiants.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Login" />
      <div className="relative min-h-screen w-full flex justify-center items-center py-16 md:py-10">
        <div className="card md:w-lg w-screen z-10">
          <div className="text-center px-10 py-12">
            <Link to="/" className="flex justify-center">
              <img src={logoDark} alt="logo dark" className="h-6 flex dark:hidden" width={111} />
              <img src={logoLight} alt="logo light" className="h-6 hidden dark:flex" width={111} />
            </Link>

            <div className="mt-8 text-center">
              <h4 className="mb-2.5 text-xl font-semibold text-primary">Welcome Back !</h4>
              <p className="text-base text-default-500">Sign in to continue to Pixelette.</p>
            </div>

            <form onSubmit={handleSubmit} className="text-left w-full mt-10">
              {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="email" className="block font-medium text-default-900 text-sm mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <Link to="/basic-reset-password" className="text-primary font-medium text-sm mb-2 float-end">
                  Forgot Password ?
                </Link>
                <label htmlFor="password" className="block font-medium text-default-900 text-sm mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="Enter Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="form-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="text-default-900 text-sm font-medium" htmlFor="rememberMe">
                  Remember Me
                </label>
              </div>

              <div className="mt-10 text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn bg-primary text-white w-full disabled:opacity-50"
                >
                  {loading ? <Loader className="animate-spin w-4 h-4 mx-auto" /> : 'Sign In'}
                </button>
              </div>

              <div className="my-9 relative text-center before:absolute before:top-2.5 before:left-0 before:border-t before:border-t-default-200 before:w-full before:h-0.5 before:right-0 before:-z-0">
                <h4 className="relative z-1 py-0.5 px-2 inline-block font-medium text-default-600 bg-card">
                  Sign In With
                </h4>
              </div>

              <div className="flex w-full justify-center items-center gap-2">
                <button type="button" className="btn border border-default-200 flex-grow hover:bg-default-150 shadow-sm hover:text-default-800" disabled>
                  <IconifyIcon icon={'logos:google-icon'} />
                  Use Google
                </button>

                <button type="button" className="btn border border-default-200 flex-grow hover:bg-default-150 shadow-sm hover:text-default-800" disabled>
                  <IconifyIcon icon={'logos:apple'} className="text-mono" />
                  Use Apple
                </button>
              </div>

              <div className="mt-10 text-center">
                <p className="text-base text-default-500">
                  Don't have an Account ?{' '}
                  <Link to="/basic-register" className="font-semibold underline hover:text-primary transition duration-200">
                    Sign Up
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

export default Login;
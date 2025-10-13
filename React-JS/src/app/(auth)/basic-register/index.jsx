import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import logoDark from '@/assets/images/logo-dark.png';
import logoLight from '@/assets/images/logo-light.png';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';
import PageMeta from '@/components/PageMeta';
import { Loader } from "lucide-react";
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    password_confirm: ''  // Consistent key in state
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError('Vous devez accepter les conditions d\'utilisation');
      return;
    }
    setLoading(true);  // Use existing loading state
    setError('');  // Reset erreur
    try {
      await axios.post(
        'http://localhost:8000/api/utilisateurs/',  // URL absolue vers backend
        formData,  // formData already has password_confirm; no need to remap
        { 
          withCredentials: true  // Pour sessions/cookies si besoin
        }
      );
      toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      navigate('/basic-login');  // Redirige vers login
    } catch (error) {
      const errMsg = error.response?.data?.password?.[0] || error.response?.data?.non_field_errors?.[0] || 'Erreur d\'inscription. Vérifiez vos données.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);  // Reset loading
    }
  };

  return (
    <>
      <PageMeta title="Register" />
      <div className="relative min-h-screen w-full flex justify-center items-center py-16 md:py-10">
        <div className="card md:w-lg w-screen z-10">
          <div className="text-center px-10 py-12">
            <Link to="/" className="flex justify-center">
              <img src={logoDark} alt="logo dark" className="h-6 flex dark:hidden" width={111} />
              <img src={logoLight} alt="logo light" className="h-6 hidden dark:flex" width={111} />
            </Link>

            <div className="mt-8 text-center">
              <h4 className="mb-2.5 text-xl font-semibold text-primary">
                Create your free account
              </h4>
              <p className="text-base text-default-500">Get your free Pixelette account now</p>
            </div>

            <form onSubmit={handleSubmit} className="text-left w-full mt-10">
              {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="email" className="block font-medium text-default-900 text-sm mb-2">
                  Enter email
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

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="prenom" className="block font-medium text-default-900 text-sm mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    className="form-input"
                    placeholder="Enter Prénom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="nom" className="block font-medium text-default-900 text-sm mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    className="form-input"
                    placeholder="Enter Nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="telephone" className="block font-medium text-default-900 text-sm mb-2">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  className="form-input"
                  placeholder="Enter Téléphone"
                  value={formData.telephone}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
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
                  minLength={8}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password_confirm" className="block font-medium text-default-900 text-sm mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="password_confirm"
                  name="password_confirm"
                  className="form-input"
                  placeholder="Confirm Password"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4 flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  className="form-checkbox me-2"
                  onChange={(e) => setTermsAccepted(e.target.checked)}  // Removed 'required' from input; handled in JS
                />
                <p className="italic text-sm font-medium text-default-500">
                  By registering you agree to the Pixelette{' '}
                  <Link to="/terms" className="underline">
                    Terms of Use
                  </Link>
                </p>
              </div>

              <div className="mt-10 text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn bg-primary text-white w-full disabled:opacity-50"
                >
                  {loading ? <Loader className="animate-spin w-4 h-4 mx-auto" /> : 'Sign Up'}
                </button>
              </div>


              <div className="my-9 relative text-center before:absolute before:top-2.5 before:left-0 before:border-t before:border-t-default-200 before:w-full before:h-0.5 before:right-0 before:-z-0">
                <h4 className="relative z-1 py-0.5 px-2 inline-block font-medium bg-card text-default-600">
                  Create Account with
                </h4>
              </div>

              <div className="flex w-full justify-center items-center gap-2">
                <button type="button" className="btn border border-default-200 flex-grow hover:bg-default-150 shadow-sm hover:text-default-800 disabled:opacity-50" disabled>
                  <IconifyIcon icon={'logos:google-icon'} />
                  Use Google
                </button>

                <button type="button" className="btn border border-default-200 flex-grow hover:bg-default-150 shadow-sm hover:text-default-800 disabled:opacity-50" disabled>
                  <IconifyIcon icon={'logos:apple'} className="text-mono" />
                  Use Apple
                </button>
              </div>

              <div className="mt-10 text-center">
                <p className="text-base text-default-500">
                  Already have an Account ?{' '}
                  <Link to="/basic-login" className="font-semibold underline hover:text-primary transition duration-200">
                    Sign In
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

export default Register;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader } from "lucide-react";
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/utilisateurs/login/', formData, { withCredentials: true });
      const { token, user } = response.data;
      
      // RBAC Check: Seul admin peut accéder
      if (user.role !== 'admin') {
        throw new Error('Accès refusé');  // Message exact comme demandé
      }
      
      // Succès: Stocke et redirige
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Connexion admin réussie !');
      navigate('/users-list');  // Redirige vers dashboard admin (liste users)
    } catch (err) {
      // Gestion erreur: Pour non-admin ou autres (ex. mauvais creds)
      const errMsg = err.response?.data?.error || err.message || 'Erreur de connexion';
      setError(errMsg);
      toast.error(errMsg);
      // Ne stocke rien pour non-admin
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-info/10 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-default-800 mb-2">
              Pixelette Admin
            </h1>
            <p className="text-default-600">
              Connectez-vous pour accéder au backoffice
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-default-700 mb-2">
                  Email
                </label>
                <input 
                  type="email" 
                  name="email"
                  className="form-input w-full"
                  placeholder="admin@pixelette.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-default-700 mb-2">
                  Mot de passe
                </label>
                <input 
                  type="password" 
                  name="password"
                  className="form-input w-full"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
              </div>

              {/* Submit */}
            <button 
              type="submit" 
              className="btn bg-primary text-white w-full hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="animate-spin h-4 w-4" />
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </button>

            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-default-500">
            <p>Accès réservé aux administrateurs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2, Upload, Save, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // Ajouté

const Profile = () => {
  const { updateUser } = useAuth(); // Ajouté
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ prenom: '', nom: '', telephone: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false); // Ajouté
  const [isDisabling2FA, setIsDisabling2FA] = useState(false); // Ajouté
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      toast.error('Session expirée - Veuillez vous reconnecter');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    const userData = JSON.parse(storedUser);
    if (userData.role !== 'admin') {
      toast.error('Accès refusé : Réservé aux administrateurs');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    fetchProfile(token);
  }, [navigate]);

  const fetchProfile = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/utilisateurs/profile/', {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true,
      });

      setUser(response.data);
      setFormData({
        prenom: response.data.prenom,
        nom: response.data.nom,
        telephone: response.data.telephone || '',
      });

      if (response.data.image) {
        const imageUrl = response.data.image.startsWith('http')
          ? response.data.image
          : `http://localhost:8000${response.data.image}`;
        setImagePreview(imageUrl);
      }

      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Erreur fetch profile:', error);
      toast.error(error.response?.data?.error || 'Session expirée');
      localStorage.clear();
      sessionStorage.clear();
      setTimeout(() => {
        window.location.href = 'http://localhost:5173';
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setSelectedImage(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('image', selectedImage);

      const response = await axios.patch(`http://localhost:8000/api/utilisateurs/${user.id}/`, form, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      setUser(response.data);
      setImagePreview(
        response.data.image.startsWith('http')
          ? response.data.image
          : `http://localhost:8000${response.data.image}`
      );
      setSelectedImage(null);
      fileInputRef.current.value = '';
      updateUser(response.data); // Ajouté
      toast.success('Image mise à jour !');
    } catch (error) {
      toast.error("Erreur lors du téléversement de l'image");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:8000/api/utilisateurs/${user.id}/`, formData, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true,
      });

      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      updateUser(response.data); // Ajouté
      setEditing(false);
      toast.success('Profil mis à jour !');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  // Nouvelle fonction : Activer le 2FA
  const enable2FA = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir activer le 2FA ? Vous devrez scanner un QR code à la prochaine connexion.')) {
      return;
    }
    setIsEnabling2FA(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/utilisateurs/enable_2fa/',
        {},
        {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true,
        }
      );

      const updatedUser = { ...user, two_factor_enabled: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      updateUser(updatedUser);
      toast.success('2FA activé ! Reconnectez-vous pour scanner le QR code.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'activation du 2FA');
    } finally {
      setIsEnabling2FA(false);
    }
  };

  // Nouvelle fonction : Désactiver le 2FA
  const disable2FA = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver le 2FA ? Cela rendra votre compte moins sécurisé.')) {
      return;
    }
    setIsDisabling2FA(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/utilisateurs/disable_2fa/',
        {},
        {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true,
        }
      );

      const updatedUser = { ...user, two_factor_enabled: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      updateUser(updatedUser);
      toast.success('2FA désactivé ! Votre prochaine connexion ne nécessitera pas de code.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la désactivation du 2FA');
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Supprimer le compte admin ? Cette action est irréversible.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/utilisateurs/${user.id}/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true,
      });

      localStorage.clear();
      sessionStorage.clear();
      toast.success('Compte supprimé');
      setTimeout(() => {
        window.location.href = 'http://localhost:5173';
      }, 1500);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success('Déconnexion réussie');
    setTimeout(() => {
      window.location.href = 'http://localhost:5173';
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4" />
          <p className="text-default-500">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-default-500">Erreur: impossible de charger le profil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="card">
        <div className="card-body p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-2xl font-semibold">Profil Admin</h4>
          
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Avatar & Info */}
            <div className="col-span-1 text-center">
              <div className="relative mb-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-primary"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-default-200 flex items-center justify-center mx-auto border-4 border-primary text-2xl font-bold">
                    {user?.prenom?.[0]?.toUpperCase()}
                    {user?.nom?.[0]?.toUpperCase()}
                  </div>
                )}
                {editing && (
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer -m-2">
                    <Upload size={20} />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                )}
              </div>

              {editing && selectedImage && (
                <button
                  onClick={uploadImage}
                  disabled={updating}
                  className="btn btn-sm bg-primary text-white w-full flex items-center justify-center gap-1"
                >
                  {updating ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />} Upload
                </button>
              )}

              <div className="mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-danger text-white">
                  Admin
                </span>
              </div>
              <p className="text-sm text-default-500 mt-1">{user.email}</p>
              <p className="text-sm text-default-500">{user.telephone || 'Non renseigné'}</p>
            </div>

            {/* Formulaire Profil */}
            <div className="col-span-2 space-y-4">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="btn bg-primary text-white mb-4 w-full"
                >
                  Modifier mes informations
                </button>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prénom</label>
                    <input
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="form-input w-full"
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom</label>
                    <input
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="form-input w-full"
                      disabled={!editing}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input value={user.email} className="form-input w-full bg-default-100" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Téléphone</label>
                  <input
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="form-input w-full"
                    disabled={!editing}
                  />
                </div>

                {editing && (
                  <div className="flex gap-2">
                    <button type="submit" disabled={updating} className="btn bg-success text-white flex items-center flex-1">
                      {updating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />}
                      Sauvegarder
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className="btn bg-default-200 text-default-600 flex-1">
                      <X size={16} className="mr-2" />
                      Annuler
                    </button>
                  </div>
                )}
              </form>

              {/* Nouvelle section : Sécurité */}
              <div className="p-4 bg-default-50 rounded-lg mt-6">
                <h6 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2m4-2h2c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2m-4-8V5c0-1.1-.9-2-2-2H8C6.9 3 6 3.9 6 5v2" />
                  </svg>
                  Sécurité
                </h6>
                <div className="flex justify-between items-center p-3 bg-white rounded-md border border-default-200">
                  <div>
                    <p className="font-medium">Authentification à deux facteurs</p>
                    <p className="text-sm text-default-500">
                      {user.two_factor_enabled ? 'Activée' : 'Désactivée'}
                    </p>
                  </div>
                  {user.two_factor_enabled ? (
                    <button
                      onClick={disable2FA}
                      disabled={isDisabling2FA}
                      className="btn btn-sm bg-danger text-white"
                    >
                      {isDisabling2FA ? <Loader2 className="animate-spin w-4 h-4" /> : 'Désactiver'}
                    </button>
                  ) : (
                    <button
                      onClick={enable2FA}
                      disabled={isEnabling2FA}
                      className="btn btn-sm bg-success text-white"
                    >
                      {isEnabling2FA ? <Loader2 className="animate-spin w-4 h-4" /> : 'Activer'}
                    </button>
                  )}
                </div>
              </div>

              {/* Zone Danger */}
              <div className="p-4 bg-danger/10 rounded-lg mt-6">
                <h6 className="font-semibold mb-2 flex items-center gap-2 text-danger">
                  <Trash2 size={20} /> Zone Danger
                </h6>
                <p className="text-sm text-default-600 mb-3">
                  Supprimer votre compte admin supprimera définitivement toutes vos données.
                </p>
                <button onClick={deleteAccount} className="btn btn-sm bg-danger text-white w-full">
                  Supprimer le compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoDark from '@/assets/images/logo-dark.png';
import logoLight from '@/assets/images/logo-light.png';
import PageMeta from '@/components/PageMeta';
import { Loader2, Upload, Save, X, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ prenom: '', nom: '', telephone: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDemande, setShowDemande] = useState(false);
  const [raison, setRaison] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expirée');
      navigate('/login');
      return;
    }
    setLoading(true);
    fetchProfile(token);
  }, [navigate]);

  const fetchProfile = async (token) => {
    try {
      const response = await axios.get('http://localhost:8000/api/utilisateurs/profile/', {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });

      setUser(response.data);
      setFormData({
        prenom: response.data.prenom,
        nom: response.data.nom,
        telephone: response.data.telephone || ''
      });

      if (response.data.image) {
        const imageUrl = response.data.image.startsWith('http')
          ? response.data.image
          : `http://localhost:8000${response.data.image}`;
        setImagePreview(imageUrl);
      } else {
        setImagePreview('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Session expirée');
      localStorage.removeItem('token');
      setTimeout(() => navigate('/login'), 1500);
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
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });

      setUser(response.data);
      setImagePreview(
        response.data.image.startsWith('http')
          ? response.data.image
          : `http://localhost:8000${response.data.image}`
      );
      setSelectedImage(null);
      fileInputRef.current.value = '';
      toast.success('Image mise à jour !');
    } catch {
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
        withCredentials: true
      });

      setUser(response.data);
      setEditing(false);
      toast.success('Profil mis à jour !');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestArtiste = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/demandes/',
        { nouveau_role: 'artiste', raison: raison || '' },
        {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true
        }
      );

      toast.success(response.data.message || 'Demande envoyée avec succès !');
      setShowDemande(false);
      setRaison('');
      fetchProfile(localStorage.getItem('token'));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Échec de la demande');
    } finally {
      setUpdating(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Supprimer le compte ?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/utilisateurs/${user.id}/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });

      localStorage.clear();
      toast.success('Compte supprimé');
      navigate('/login');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full flex justify-center items-center">
        <div className="card md:w-lg w-screen z-10 text-center p-10">
          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4" />
          <p className="text-default-500">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen w-full flex justify-center items-center">
        <div className="card md:w-lg w-screen z-10 text-center p-10">
          <p className="text-default-500">Erreur: impossible de charger le profil</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Profil" />
      <div className="relative min-h-screen w-full flex justify-center items-center py-16 md:py-10">
        <div className="card md:w-4xl w-screen z-10">
          <div className="text-center px-10 py-12">
            <Link to="/" className="flex justify-center mb-4">
              <img src={logoDark} alt="logo dark" className="h-6 flex dark:hidden" />
              <img src={logoLight} alt="logo light" className="h-6 hidden dark:flex" />
            </Link>

            <h4 className="text-xl font-semibold text-primary mb-2">Mon Profil</h4>
            <p className="text-default-500">Gérez vos informations personnelles</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
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
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-danger text-white'
                        : user.role === 'artiste'
                        ? 'bg-warning text-white'
                        : 'bg-success text-white'
                    }`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
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
                        <X size={16} />
                        Annuler
                      </button>
                    </div>
                  )}
                </form>

                {/* Demande Artiste - Seulement pour les users */}
                {user.role === 'user' && (
                  <div className="p-4 bg-warning/10 rounded-lg">
                    <h6 className="font-semibold mb-2 flex items-center gap-2">
                      <Star size={20} className="text-warning" />
                      Devenir Artiste
                    </h6>
                    <p className="text-sm text-default-600 mb-3">Partagez vos œuvres avec la communauté</p>
                    <button
                      onClick={() => setShowDemande(true)}
                      disabled={updating}
                      className="btn btn-sm bg-warning text-white disabled:opacity-50 w-full"
                    >
                      Faire une demande
                    </button>
                  </div>
                )}

                {/* Zone Danger */}
                <div className="p-4 bg-danger/10 rounded-lg">
                  <h6 className="font-semibold mb-2 flex items-center gap-2 text-danger">
                    <Trash2 size={20} className="text-danger" /> Supprimer Compte
                  </h6>
                  <p className="text-sm text-default-600 mb-3">Cette action est irréversible</p>
                  <button onClick={deleteAccount} className="btn btn-sm bg-danger text-white w-full">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Demande */}
            {showDemande && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h6 className="font-semibold mb-3">Demande Artiste</h6>
                  <textarea
                    value={raison}
                    onChange={(e) => setRaison(e.target.value)}
                    className="form-input w-full mb-3"
                    rows={3}
                    placeholder="Pourquoi voulez-vous devenir artiste ?"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowDemande(false)} className="btn bg-default-200 text-default-600 flex-1">
                      Annuler
                    </button>
                    <button onClick={handleRequestArtiste} disabled={updating} className="btn bg-primary text-white flex-1">
                      {updating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Envoyer'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
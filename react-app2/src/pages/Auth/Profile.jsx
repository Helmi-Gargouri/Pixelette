import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';

const Profile = () => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const MEDIA_BASE = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8000';
const BACKOFFICE_URL = import.meta.env.VITE_BACKOFFICE_URL || 'http://localhost:5174';
  const { user, updateUser, token } = useAuth();
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' });
  const [isLocalPreview, setIsLocalPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [enableCode, setEnableCode] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);  
  const [showDemandeModal, setShowDemandeModal] = useState(false);  
  const [raison, setRaison] = useState('');
  const [scoreData, setScoreData] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);

  /*useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile(token);
    // ✨ NOUVEAU : Charger le score si c'est un user
    if (user?.role === 'user') {
      fetchScoreArtiste(token);
    }
  }, [navigate, user?.role]);*/

  useEffect(() => {
  if (!token) {
    navigate('/login');
    return;
  }
  if (user) {
    setPrenom(user.prenom);
    setNom(user.nom);
    setTelephone(user.telephone || '');
    
    if (user.image) {
    const imageUrl = response.data.image.startsWith('http') 
      ? response.data.image 
      : `${MEDIA_BASE}${response.data.image}`;
      setImagePreview(imageUrl);
      setIsLocalPreview(false);
    } else {
      setImagePreview('');
      setIsLocalPreview(false);
    }
    
    checkPendingRequest();
  }
}, [navigate, token, user]);

// Vérifier si l'utilisateur est admin et le rediriger
useEffect(() => {
  if (user && user.role === 'admin') {
    console.log('⚠️ Admin détecté dans Profile, redirection vers backoffice');
    // Utiliser TempAuthStorage pour redirection vers backoffice
    const storeTempAndRedirect = async () => {
      try {
        const storeResponse = await axios.post(
          `${API_BASE}auth/store_temp/`,
          {
            token: token,
            user: user,
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        const tempId = storeResponse.data.temp_id;
        if (tempId) {
  window.location.href = `${BACKOFFICE_URL}/dashboard?temp_id=${encodeURIComponent(tempId)}`;
}else {
          navigate('/');
        }
      } catch (error) {
        console.error('Erreur stockage temp:', error);
        navigate('/');
      }
    };
    storeTempAndRedirect();
  }
}, [user?.role]);

// useEffect 2 : Charger le score APRÈS que user soit défini
useEffect(() => {
  if (user && user.role === 'user' && token && !scoreData && !loadingScore) {
    console.log('✅ User détecté:', user.email, '- Role:', user.role);
    console.log('🔄 Chargement du score pour:', user.email);
    fetchScoreArtiste();
  } else {
    console.log('⚠️ Conditions non remplies:', {
      hasUser: !!user,
      role: user?.role,
      hasToken: !!token,
      hasScoreData: !!scoreData,
      loadingScore: loadingScore
    });
  }
}, [user?.id, user?.role, token]); // Ajouté token dans les dépendances


  // ✨ NOUVEAU : Fonction pour récupérer le score artiste
  const fetchScoreArtiste = async () => {
    if (!token) {
      console.error('❌ Pas de token pour score !');
      return;
    }
    
    if (user && user.role !== 'user') {
      console.log('⚠️ Score artiste non disponible pour le rôle:', user.role);
      setLoadingScore(false);
      return;
    }
    
    if (loadingScore || scoreData) {
      console.log('⚠️ Score déjà en cours de chargement ou déjà chargé');
      return;
    }
    
    setLoadingScore(true);
    try {
      console.log('📡 Appel API score avec interceptor');
      // ✅ URL simplifiée (l'interceptor ajoute baseURL et token)
      const response = await axios.get('/api/utilisateurs/mon-score-artiste/');
      console.log('✅ Score OK:', response.data);
      setScoreData(response.data);
    } catch (error) {
      console.error('❌ Score error:', error.response?.status, error.response?.data);
      if (error.response?.status === 403) {
        console.log('⚠️ 403 - Vérifiez les permissions backend');
      }
    } finally {
      setLoadingScore(false);
    }
  };

  // ✨ NOUVEAU : Fonction pour rafraîchir le score
  const refreshScore = async () => {
    await fetchScoreArtiste();
  };

const formatCritereName = (key) => {
  const names = {
    'artistes_suivis': 'Artistes Suivis',
    'consultations_oeuvres': 'Consultations d\'Œuvres',
    'contacts_artistes': 'Contacts avec Artistes',
    'photo_profil': 'Photo de Profil',
    'deux_facteurs': 'Authentification 2FA',
    'profil_complet': 'Profil Complet'
  };
  return names[key] || key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1);
};

const formatValeur = (key, detail) => {
  // Cas booléens (photo, 2FA)
  if (typeof detail.valeur === 'boolean') {
    return detail.valeur ? '✅ Activé' : '❌ Non activé';
  }
  
  // Cas profil complet (pourcentage)
  if (key === 'profil_complet') {
    return `Complété à ${detail.valeur} (${detail.champs_remplis} champs)`;
  }
  
  // Cas numériques
  switch(key) {
    case 'artistes_suivis':
      return `${detail.valeur} artiste${detail.valeur > 1 ? 's' : ''}`;
    
    case 'consultations_oeuvres':
      return `${detail.valeur} œuvre${detail.valeur > 1 ? 's' : ''} consultée${detail.valeur > 1 ? 's' : ''}`;
    
    case 'contacts_artistes':
      return `${detail.valeur} message${detail.valeur > 1 ? 's' : ''}`;
    
    default:
      return String(detail.valeur);
  }
};

const getCritereIcon = (key) => {
  const icons = {
    'artistes_suivis': '👥',
    'consultations_oeuvres': '👁️',
    'contacts_artistes': '💬',
    'photo_profil': '📸',
    'deux_facteurs': '🔐',
    'profil_complet': '✅'
  };
  return icons[key] || '•';
};

const getScoreColor = (percentage) => {
  if (percentage >= 80) return '#28a745';
  if (percentage >= 60) return '#ffc107';
  if (percentage >= 40) return '#fd7e14';
  return '#6c757d';
};

  const disable2FA = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver le 2FA ? Cela rendra votre compte moins sécurisé.')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(
        `${API_BASE}utilisateurs/disable_2fa/`, 
        {}, 
        {
          withCredentials: true
        }
      );
      
      updateUser({ ...user, two_factor_enabled: false });
      
      setModal({ 
        show: true, 
        title: 'Succès !', 
        message: '2FA désactivé ! Votre prochaine connexion ne nécessitera pas de code.', 
        type: 'success' 
      });
    } catch (error) {
      setModal({ 
        show: true, 
        title: 'Erreur', 
        message: error.response?.data?.error || 'Erreur lors de la désactivation', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const checkPendingRequest = async () => {
    try {
      // Utiliser les données utilisateur déjà chargées
      if (!user) {
        console.log('⚠️ Pas d\'utilisateur pour checkPendingRequest');
        setHasPendingRequest(false);
        return;
      }
      
      // Seuls les admins peuvent accéder à /api/demandes/
      if (user.role === 'admin') {
        const res = await axios.get(`${API_BASE}demandes/`, {
          withCredentials: true
        });
        const pending = res.data.some(d => d.statut === 'pending' && d.utilisateur_nom === `${user.prenom} ${user.nom}`);
        setHasPendingRequest(pending);
      } else {
        // Pour les non-admin, vérifier s'ils ont une demande en cours
        const res = await axios.get(`${API_BASE}demandes/?utilisateur=${user.id}`, {
          withCredentials: true
        });
        const pending = res.data.some(d => d.statut === 'pending');
        setHasPendingRequest(pending);
      }
    } catch (err) {
      console.log('⚠️ Erreur checkPendingRequest:', err.response?.status);
      setHasPendingRequest(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (isLocalPreview && imagePreview) {
        try { URL.revokeObjectURL(imagePreview); } catch (err) {}
      }
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setIsLocalPreview(true);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return;
    const formData = new FormData();
    formData.append('image', selectedImage);
    setIsUploading(true);
    try {
      const response = await axios.patch(`${API_BASE}utilisateurs/${user.id}/`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      setModal({ show: true, title: 'Succès !', message: 'Image mise à jour !', type: 'success' });
      updateUser(response.data);
const imageUrl = response.data.image.startsWith('http') 
  ? response.data.image 
  : `${MEDIA_BASE}${response.data.image}`;
      setImagePreview(imageUrl);
      setIsLocalPreview(false);
      setSelectedImage(null);
      fileInputRef.current.value = '';
      // ✨ Rafraîchir le score après upload
      refreshScore();
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || 'Échec upload', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.patch(`${API_BASE}utilisateurs/${user.id}/`, {
        prenom,
        nom,
        telephone
      }, {
        withCredentials: true
      });
      updateUser(response.data);
      setModal({ show: true, title: 'Succès !', message: 'Profil mis à jour !', type: 'success' });
      // ✨ Rafraîchir le score après mise à jour
      refreshScore();
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || 'Échec mise à jour', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setConfirmModal(true);
  };

  const handleDeleteConfirm = async () => {
    setConfirmModal(false);
    try {
      await axios.delete(`${API_BASE}utilisateurs/${user.id}/`, {
        withCredentials: true
      });
      localStorage.removeItem('token');
      setModal({ show: true, title: 'Succès !', message: 'Compte supprimé', type: 'success' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || 'Échec suppression', type: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const openDemandeModal = () => {
    if (hasPendingRequest) {
      setModal({ show: true, title: 'Info', message: 'Demande déjà en cours !', type: 'error' });
      return;
    }
    setShowDemandeModal(true);
  };

  const handleSubmitDemande = async () => {
    setIsSubmitting(true);
    try {
      // Vérifier d'abord si l'utilisateur peut faire une demande
      if (!user || user.role !== 'user') {
        setModal({ show: true, title: 'Erreur', message: 'Seuls les utilisateurs peuvent faire une demande de rôle artiste', type: 'error' });
        return;
      }
      
      const response = await axios.post(`${API_BASE}demandes/`, {
        nouveau_role: 'artiste',
        raison: raison || ''  
      }, {
        withCredentials: true
      });
      setModal({ show: true, title: 'Succès !', message: response.data.message || 'Demande envoyée !', type: 'success' });
      setHasPendingRequest(true); 
      closeDemandeModal();  
    } catch (error) {
      console.error('❌ Erreur demande:', error.response?.status, error.response?.data);
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || 'Échec de la demande', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDemandeModal = () => {
    setShowDemandeModal(false);
    setRaison('');
  };

  const enable2FA = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir activer le 2FA ? Vous devrez scanner un QR code à la prochaine connexion.')) {
      return;
    }
    
    setIsEnabling(true);
    
    try {
      const response = await axios.post(
        `${API_BASE}utilisateurs/enable_2fa/`, 
        {}, 
        {
          withCredentials: true
        }
      );
      
      updateUser({ ...user, two_factor_enabled: true });
      
      setModal({ 
        show: true, 
        title: 'Succès !', 
        message: '2FA activé ! Reconnectez-vous pour scanner le QR code.', 
        type: 'success' 
      });
      // ✨ Rafraîchir le score après activation 2FA
      refreshScore();
    } catch (error) {
      setModal({ 
        show: true, 
        title: 'Erreur', 
        message: error.response?.data?.error || 'Erreur lors de l\'activation', 
        type: 'error' 
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const handleModalClose = () => {
    setModal({ ...modal, show: false });
  };



  if (!user) {
    return (
      <div className="preloader">
        <div className="preloader-inner">
          <span className="loader"></span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Modal
        show={modal.show}
        onClose={handleModalClose}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
  
      <ConfirmModal
        show={confirmModal}
        onClose={() => setConfirmModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible."
      />

      <div className="space">
        <div className="container">
          <div className="row">
            <div className="col-lg-4">
              <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <div className="text-center">
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Profil" 
                        style={{ 
                          width: '150px', 
                          height: '150px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: '5px solid var(--theme-color)',
                          opacity: isLocalPreview ? 0.7 : 1
                        }} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : null}
                    {!imagePreview && (
                      <div 
                        style={{ 
                          width: '150px', 
                          height: '150px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, var(--theme-color) 0%, #a55e35 100%)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3rem',
                          fontWeight: '600',
                          border: '5px solid var(--theme-color)'
                        }}
                      >
                        {user.prenom?.charAt(0)?.toUpperCase()}{user.nom?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current.click()}
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--theme-color)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                      }}
                    >
                      <i className="fas fa-camera"></i>
                    </button>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageChange} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                  {selectedImage && (
                    <button 
                      onClick={uploadImage} 
                      disabled={isUploading}
                      className="btn btn-sm mt-3"
                    >
                      {isUploading ? 'Sauvegarde...' : 'Sauvegarder la photo'}
                    </button>
                  )}
                  <h3 className="mt-3 mb-2">{prenom} {nom}</h3>
                  <div className="mb-2">
                    <span style={{ 
                      padding: '6px 15px', 
                      borderRadius: '20px', 
                      background: user.role === 'admin' ? '#dc3545' : user.role === 'artiste' ? '#28a745' : '#6c757d',
                      color: 'white', 
                      fontSize: '0.9em'
                    }}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                  <p style={{ color: '#7B7E86', fontSize: '0.95em', marginBottom: '10px' }}>{user.email}</p>
                  <p style={{ color: '#7B7E86', fontSize: '0.85em', margin: 0 }}>
                    <i className="fas fa-calendar me-2"></i>
                    Membre depuis {new Date(user.date_inscription).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* ✨ NOUVEAU : Widget Score Artiste (seulement pour les users) */}
              {user.role === 'user' && scoreData && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  padding: '25px', 
                  borderRadius: '15px', 
                  marginBottom: '20px',
                  color: '#fff',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Badge dans le coin */}
                  {scoreData.badge && (
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      padding: '8px 15px',
                      borderRadius: '25px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: '#fff',
                      boxShadow: '0 4px 15px rgba(255, 165, 0, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>🏆</span>
                      {scoreData.badge === 'futur_artiste' ? 'Futur Artiste' : 'Potentiel Artiste'}
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0" style={{ color: '#fff' }}>
                      <i className="fas fa-chart-line me-2"></i>Score Artiste
                    </h5>
                    <button
                      onClick={refreshScore}
                      disabled={loadingScore}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '35px',
                        height: '35px',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      title="Rafraîchir"
                    >
                      <i className={`fas fa-sync-alt ${loadingScore ? 'fa-spin' : ''}`}></i>
                    </button>
                  </div>

                  {/* Score principal */}
                  <div className="text-center mb-3">
                    <div style={{
                      fontSize: '3.5rem',
                      fontWeight: 'bold',
                      lineHeight: '1'
                    }}>
                      {scoreData.score}
                      <span style={{ fontSize: '2rem', opacity: 0.8 }}>/100</span>
                    </div>
                    <div style={{
                      fontSize: '1.1rem',
                      marginTop: '10px',
                      opacity: 0.95
                    }}>
                      {scoreData.categorie}
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    height: '12px',
                    overflow: 'hidden',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      background: '#fff',
                      height: '100%',
                      width: `${scoreData.score}%`,
                      transition: 'width 0.5s ease',
                      borderRadius: '10px'
                    }}></div>
                  </div>

                  {/* Message personnalisé */}
                  <p style={{
                    fontSize: '0.9rem',
                    marginBottom: '15px',
                    opacity: 0.95,
                    lineHeight: '1.5'
                  }}>
                    {scoreData.message}
                  </p>

                  {/* Bouton détails */}
                  <button
                    onClick={() => setShowScoreDetails(true)}
                    className="btn btn-sm w-100"
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      color: '#667eea',
                      border: 'none',
                      fontWeight: '600'
                    }}
                  >
                    <i className="fas fa-info-circle me-2"></i>
                    Voir les détails
                  </button>
                </div>
              )}

              {user.role === 'user' && (
                <div style={{ background: '#F8F7F4', padding: '25px', borderRadius: '15px', marginBottom: '20px' }}>
                  <h5 className="mb-3"><i className="fas fa-star me-2" style={{ color: 'var(--theme-color)' }}></i>Devenir Artiste</h5>
                  <p style={{ fontSize: '0.9em', color: '#7B7E86', marginBottom: '15px' }}>
                    Partagez vos œuvres avec la communauté
                  </p>
                  <button 
                    onClick={openDemandeModal}  
                    disabled={isSubmitting || hasPendingRequest}
                    className="btn w-100"
                    style={{ fontSize: '0.9em' }}
                  >
                    {hasPendingRequest ? 'Demande en cours...' : 'Faire une demande'}
                  </button>
                </div>
              )}
            </div>

            <div className="col-lg-8">
              <div style={{ background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <h4 className="mb-4"><i className="fas fa-user-edit me-2" style={{ color: 'var(--theme-color)' }}></i>Informations personnelles</h4>
                <form onSubmit={handleUpdateProfile}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prénom</label>
                      <input 
                        type="text" 
                        value={prenom} 
                        onChange={(e) => setPrenom(e.target.value)} 
                        className="form-control" 
                        style={{ borderRadius: '10px', padding: '12px' }}
                        required 
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nom</label>
                      <input 
                        type="text" 
                        value={nom} 
                        onChange={(e) => setNom(e.target.value)} 
                        className="form-control" 
                        style={{ borderRadius: '10px', padding: '12px' }}
                        required 
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Téléphone</label>
                      <input 
                        type="tel" 
                        value={telephone} 
                        onChange={(e) => setTelephone(e.target.value)} 
                        className="form-control" 
                        style={{ borderRadius: '10px', padding: '12px' }}
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn mt-2"
                  >
                    {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                </form>
              </div>

              <div style={{ background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <h4 className="mb-4"><i className="fas fa-shield-alt me-2" style={{ color: 'var(--theme-color)' }}></i>Sécurité</h4>
                <div className="d-flex justify-content-between align-items-center" style={{ padding: '15px', background: '#F8F7F4', borderRadius: '10px' }}>
                  <div>
                    <h6 className="mb-1">Authentification à deux facteurs</h6>
                    <p style={{ fontSize: '0.85em', color: '#7B7E86', marginBottom: 0 }}>
                      {user.two_factor_enabled ? 'Activée' : 'Désactivée'}
                    </p>
                  </div>
                  {user.two_factor_enabled ? (
                    <button 
                      onClick={disable2FA}
                      className="btn btn-sm"
                      style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}
                    >
                      Désactiver
                    </button>
                  ) : (
                    <button 
                      onClick={enable2FA}
                      className="btn btn-sm"
                    >
                      Activer
                    </button>
                  )}
                </div>
              </div>

              <div style={{ background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
                <h4 className="mb-4" style={{ color: '#dc3545' }}><i className="fas fa-exclamation-triangle me-2"></i>Zone de danger</h4>
                <p style={{ fontSize: '0.9em', color: '#7B7E86', marginBottom: '15px' }}>
                  La suppression de votre compte est définitive et irréversible.
                </p>
                <button 
                  onClick={handleDeleteClick}
                  className="btn btn-sm"
                  style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}
                >
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✨ NOUVEAU : Modal Détails du Score */}
     {showScoreDetails && scoreData && (
  <div style={{ 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    background: 'rgba(0,0,0,0.5)', 
    zIndex: 9999, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: '20px',
    overflowY: 'auto'
  }}>
    <div style={{ 
      background: 'white', 
      padding: '40px', 
      borderRadius: '15px', 
      maxWidth: '800px', 
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
    }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">📊 Détails de votre Score Artiste</h4>
        <button
          onClick={() => setShowScoreDetails(false)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.8rem',
            cursor: 'pointer',
            color: '#7B7E86',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>

      {/* Score global */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px',
        borderRadius: '15px',
        color: '#fff',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', lineHeight: '1' }}>
          {scoreData.score}
          <span style={{ fontSize: '2rem', opacity: 0.8 }}>/100</span>
        </div>
        <div style={{ 
          fontSize: '1.3rem', 
          marginTop: '15px',
          fontWeight: '600',
          letterSpacing: '0.5px'
        }}>
          {scoreData.categorie}
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '10px',
          height: '10px',
          overflow: 'hidden',
          marginTop: '20px',
          maxWidth: '400px',
          margin: '20px auto 0'
        }}>
          <div style={{
            background: '#fff',
            height: '100%',
            width: `${scoreData.score}%`,
            transition: 'width 0.5s ease',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(255,255,255,0.5)'
          }}></div>
        </div>
      </div>

      {/* Message personnalisé */}
      {scoreData.message && (
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          borderLeft: '4px solid #667eea'
        }}>
          <p style={{ 
            fontSize: '1rem', 
            marginBottom: 0,
            color: '#2C3E50',
            lineHeight: '1.6'
          }}>
            {scoreData.message}
          </p>
        </div>
      )}

      {/* Détails des critères */}
      <h5 className="mb-3" style={{ 
        fontSize: '1.2rem', 
        fontWeight: '600',
        color: '#2C3E50',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '10px'
      }}>
        🎯 Analyse Détaillée des Critères
      </h5>
      
      <div className="mb-4">
        {Object.entries(scoreData.details).map(([key, detail]) => {
          const percentage = (detail.score / detail.max) * 100;
          const icon = getCritereIcon(key);
          const critereName = formatCritereName(key);
          const valeurFormatee = formatValeur(key, detail);
          
          return (
            <div 
              key={key} 
              style={{ 
                marginBottom: '20px',
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                  <span style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: '#2C3E50'
                  }}>
                    {critereName}
                  </span>
                </div>
                <span style={{ 
                  fontSize: '0.95rem', 
                  color: '#7B7E86',
                  fontWeight: '600'
                }}>
                  {detail.score}/{detail.max} pts
                </span>
              </div>
              
              {/* Barre de progression */}
              <div style={{
                background: '#e9ecef',
                borderRadius: '10px',
                height: '10px',
                overflow: 'hidden',
                marginBottom: '10px'
              }}>
                <div style={{
                  background: getScoreColor(percentage),
                  height: '100%',
                  width: `${percentage}%`,
                  transition: 'width 0.5s ease',
                  borderRadius: '10px'
                }}></div>
              </div>
              
              {/* Valeur */}
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#6c757d',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <i className="fas fa-info-circle" style={{ fontSize: '0.85rem' }}></i>
                {valeurFormatee}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestions d'amélioration */}
      {scoreData.suggestions && scoreData.suggestions.length > 0 && (
        <>
          <h5 className="mb-3" style={{ 
            fontSize: '1.2rem', 
            fontWeight: '600',
            color: '#2C3E50',
            borderBottom: '2px solid #e9ecef',
            paddingBottom: '10px'
          }}>
            💡 Suggestions pour Progresser
          </h5>
          
          <div className="mb-4">
            {scoreData.suggestions.map((suggestion, index) => {
              const priorityConfig = {
                'haute': { color: '#dc3545', bg: '#ffe6e6', icon: '🔥' },
                'moyenne': { color: '#ffc107', bg: '#fff9e6', icon: '⭐' },
                'basse': { color: '#28a745', bg: '#e6ffe6', icon: '💡' }
              };
              
              const config = priorityConfig[suggestion.priorite] || priorityConfig['moyenne'];
              
              return (
                <div 
                  key={index}
                  style={{
                    background: config.bg,
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '15px',
                    borderLeft: `5px solid ${config.color}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#2C3E50',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>{config.icon}</span>
                        {suggestion.action}
                      </div>
                      <p style={{ 
                        fontSize: '0.9rem', 
                        color: '#6c757d', 
                        marginBottom: '12px',
                        lineHeight: '1.5'
                      }}>
                        {suggestion.description}
                      </p>
                    </div>
                    <span style={{
                      background: config.color,
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: '15px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                      marginLeft: '10px'
                    }}>
                      {suggestion.priorite}
                    </span>
                  </div>
                  
                  <div style={{
                    background: '#fff',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: '#28a745',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <i className="fas fa-arrow-up"></i>
                    {suggestion.points}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Badge potentiel */}
      {scoreData.badge && (
        <div style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          padding: '25px',
          borderRadius: '15px',
          textAlign: 'center',
          color: '#fff',
          marginTop: '25px',
          boxShadow: '0 4px 15px rgba(255, 165, 0, 0.3)'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '15px'
          }}>
            🏆
          </div>
          <h5 className="mb-2" style={{ 
            color: '#fff', 
            fontSize: '1.3rem',
            fontWeight: '700'
          }}>
            Badge Débloqué !
          </h5>
          <p style={{ 
            fontSize: '1rem', 
            marginBottom: 0, 
            opacity: 0.95,
            fontWeight: '500'
          }}>
            {scoreData.badge === 'futur_artiste' ? '🌟 Futur Artiste' : '🎨 Potentiel Artiste'}
          </p>
        </div>
      )}

      {/* Bouton fermer */}
      <button
        onClick={() => setShowScoreDetails(false)}
        className="btn w-100 mt-4"
        style={{
          padding: '15px',
          fontSize: '1rem',
          fontWeight: '600'
        }}
      >
        <i className="fas fa-times me-2"></i>
        Fermer
      </button>
    </div>
  </div>
)}

      {/* Modal QR Code 2FA */}
      {showQRModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '40px', 
            borderRadius: '15px', 
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h4 className="text-center mb-4">Activer 2FA</h4>
            <div className="text-center mb-3">
              <img src={`data:image/png;base64,${qrCode}`} alt="QR" style={{ width: '200px', height: '200px' }} />
            </div>
            <p style={{ fontSize: '0.85em', color: '#7B7E86', textAlign: 'center', marginBottom: '20px' }}>
              Scannez ce QR code avec votre application d'authentification
            </p>
            <div className="form-group mb-3">
              <label className="form-label">Code de vérification</label>
              <input 
                type="text" 
                placeholder="000000" 
                value={enableCode} 
                onChange={(e) => setEnableCode(e.target.value)} 
                className="form-control text-center"
                style={{ fontSize: '1.5em', letterSpacing: '0.5em', borderRadius: '10px' }}
                maxLength="6"
              />
            </div>
            <div className="d-flex gap-2">
              <button 
                onClick={() => setShowQRModal(false)}
                className="btn btn-secondary flex-fill"
              >
                Annuler
              </button>
              <button 
                onClick={enable2FA} 
                disabled={isEnabling || enableCode.length !== 6}
                className="btn flex-fill"
              >
                {isEnabling ? 'Activation...' : 'Activer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Demande Artiste */}
      {showDemandeModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '40px', 
            borderRadius: '15px', 
            maxWidth: '500px', 
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h4 className="mb-3">Demande de rôle artiste</h4>
            <p style={{ fontSize: '0.9em', color: '#7B7E86', marginBottom: '20px' }}>
              Expliquez pourquoi vous souhaitez devenir artiste (optionnel)
            </p>
            <textarea 
              value={raison} 
              onChange={(e) => setRaison(e.target.value)} 
              placeholder="Votre motivation..." 
              className="form-control mb-3"
              rows="4"
              style={{ borderRadius: '10px' }}
            />
            <div className="d-flex gap-2">
              <button 
                onClick={closeDemandeModal} 
                disabled={isSubmitting}
                className="btn btn-secondary flex-fill"
              >
                Annuler
              </button>
              <button 
                onClick={handleSubmitDemande} 
                disabled={isSubmitting}
                className="btn flex-fill"
              >
                {isSubmitting ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
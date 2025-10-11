import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';

const Profile = () => {
  const { updateUser } = useAuth();
  const [user, setUser] = useState(null);
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
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile(token);
  }, [navigate]);

  const fetchProfile = async (token) => {
    try {
      const response = await axios.get('http://localhost:8000/api/utilisateurs/profile/', {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      
      setUser(response.data);
      setPrenom(response.data.prenom);
      setNom(response.data.nom);
      setTelephone(response.data.telephone || '');
      
      if (response.data.image) {
        const imageUrl = response.data.image.startsWith('http') 
          ? response.data.image 
          : `http://localhost:8000${response.data.image}`;
        setImagePreview(imageUrl);
        setIsLocalPreview(false);
      } else {
        setImagePreview('');
        setIsLocalPreview(false);
      }
      
      checkPendingRequest(token);
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || 'Session expirée', type: 'error' });
      localStorage.removeItem('token');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  const checkPendingRequest = async (token) => {
    try {
      const res = await axios.get('http://localhost:8000/api/demandes/', {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      const pending = res.data.some(d => d.statut === 'pending' && d.utilisateur_nom === `${user?.prenom} ${user?.nom}`);
      setHasPendingRequest(pending);
    } catch (err) {
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
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', selectedImage);
    setIsUploading(true);
    try {
      const response = await axios.patch(`http://localhost:8000/api/utilisateurs/${user.id}/`, formData, {
        headers: { 
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      setModal({ show: true, title: 'Succès !', message: 'Image mise à jour !', type: 'success' });
      setUser(response.data);
      const imageUrl = response.data.image.startsWith('http') 
        ? response.data.image 
        : `http://localhost:8000${response.data.image}`;
      setImagePreview(imageUrl);
      setIsLocalPreview(false);
      setSelectedImage(null);
      fileInputRef.current.value = '';
      updateUser(response.data);
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || 'Échec upload', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setIsSubmitting(true);
    try {
      const response = await axios.patch(`http://localhost:8000/api/utilisateurs/${user.id}/`, {
        prenom,
        nom,
        telephone
      }, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setUser(response.data);
      setModal({ show: true, title: 'Succès !', message: 'Profil mis à jour !', type: 'success' });
      // Mettre à jour le contexte d'authentification aussi
      updateUser(response.data);
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
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8000/api/utilisateurs/${user.id}/`, {
        headers: { Authorization: `Token ${token}` },
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
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8000/api/demandes/', {
        nouveau_role: 'artiste',
        raison: raison || ''  
      }, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setModal({ show: true, title: 'Succès !', message: response.data.message || 'Demande envoyée !', type: 'success' });
      setHasPendingRequest(true); 
      setTimeout(() => fetchProfile(token), 2000);
      closeDemandeModal();  
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || 'Échec de la demande', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDemandeModal = () => {
    setShowDemandeModal(false);
    setRaison('');
  };

  const generate2FA = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('http://localhost:8000/api/utilisateurs/generate_2fa/', {}, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setSecret(response.data.secret);
      setQrCode(response.data.qr_code);
      setShowQRModal(true);
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || 'Échec génération 2FA', type: 'error' });
    }
  };

  const enable2FA = async () => {
    const token = localStorage.getItem('token');
    setIsEnabling(true);
    try {
      await axios.post('http://localhost:8000/api/utilisateurs/enable_2fa/', {
        code: enableCode
      }, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setModal({ show: true, title: 'Succès !', message: '2FA activé !', type: 'success' });
      setShowQRModal(false);
      setEnableCode('');
      fetchProfile(token);
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || 'Code invalide', type: 'error' });
    } finally {
      setIsEnabling(false);
    }
  };

  const disable2FA = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:8000/api/utilisateurs/disable_2fa/', {}, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setModal({ show: true, title: 'Succès !', message: '2FA désactivé !', type: 'success' });
      fetchProfile(token);
    } catch (error) {
      setModal({ show: true, title: 'Erreur', message: error.response?.data?.error || 'Échec désactivation', type: 'error' });
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
                      onClick={generate2FA}
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

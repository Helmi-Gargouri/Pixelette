import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../_pageStyles.css';  

const Profile = () => {
  const [user, setUser] = useState(null);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [message, setMessage] = useState('');
  const [isLocalPreview, setIsLocalPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
        setImagePreview(`http://localhost:8000${response.data.image}`);
      }
      checkPendingRequest(token);
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Session expirée'));
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
      setMessage('Image mise à jour !');
      setImagePreview(`http://localhost:8000${response.data.image}`);
      setIsLocalPreview(false);
      setSelectedImage(null);
      fileInputRef.current.value = '';
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Échec upload'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setIsSubmitting(true);
    setMessage('');
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
      setMessage('Profil mis à jour !');
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Échec mise à jour'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Confirmer suppression du compte ?')) return;
    const token = localStorage.getItem('token');
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/api/utilisateurs/${user.id}/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      localStorage.removeItem('token');
      setMessage('Compte supprimé.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Échec suppression'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const openDemandeModal = () => {
    if (hasPendingRequest) {
      setMessage('Demande déjà en cours !');
      return;
    }
    setShowDemandeModal(true);
  };

  const handleSubmitDemande = async () => {
    setIsSubmitting(true);
    setMessage('');  
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8000/api/demandes/', {
        nouveau_role: 'artiste',
        raison: raison || ''  
      }, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setMessage(response.data.message || 'Demande envoyée !');
      setHasPendingRequest(true); 
      setTimeout(() => fetchProfile(token), 2000);
      closeDemandeModal();  
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Échec de la demande'));
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
      setMessage('Erreur : ' + (error.response?.data?.error || 'Échec génération 2FA'));
    }
  };

  const enable2FA = async () => {
    const token = localStorage.getItem('token');
    setIsEnabling(true);
    try {
      const response = await axios.post('http://localhost:8000/api/utilisateurs/enable_2fa/', {
        code: enableCode
      }, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setMessage('2FA activé !');
      setShowQRModal(false);
      setEnableCode('');
      fetchProfile(token);
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Code invalide'));
    } finally {
      setIsEnabling(false);
    }
  };

  const disable2FA = async () => {
    if (!window.confirm('Confirmer la désactivation du 2FA ?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:8000/api/utilisateurs/disable_2fa/', {}, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setMessage('2FA désactivé !');
      fetchProfile(token);
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Échec désactivation'));
    }
  };

  if (!user) {
    return <div className="loading-screen"><div>Chargement du profil...</div></div>;
  }

  const messageClass = message
    ? (message.toLowerCase().includes('erreur') ? 'message message-error' : 'message message-success')
    : '';

  return (
    <>
      {/* Header */}
      <header className="nav-header header-layout1" style={{ position: 'relative', zIndex: 10 }}>
        <div className="menu-area">
          <div className="container">
            <div className="row align-items-center justify-content-between">
              <div className="col-auto">
                <div className="header-logo">
                  <a href="/">
                    <img src="/assets/img/logo.svg" alt="Artvista" style={{ maxHeight: '50px' }} />
                  </a>
                </div>
              </div>
              <div className="col-auto">
                <button onClick={handleLogout} style={{ 
                  color: 'var(--theme-color, #C57642)', 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '16px' 
                }}>
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section style={{ padding: '60px 0', background: 'var(--smoke-color, #F8F7F4)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="section-header text-center mb-5">
                <h2 style={{ 
                  color: 'var(--theme-color, #C57642)', 
                  fontFamily: 'var(--title-font, "Jost", sans-serif)' 
                }}>
                  Mon Profil
                </h2>
              </div>
              <div className="row">
                <div className="col-md-4 text-center mb-4">
                  <div className="profile-image-container">
                    <img 
                      src={imagePreview || '/assets/img/default-avatar.png'} 
                      alt="Profil" 
                      style={{ 
                        width: '150px', 
                        height: '150px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '4px solid var(--theme-color, #C57642)'
                      }} 
                    />
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageChange} 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                    />
                    <button 
                      onClick={() => fileInputRef.current.click()} 
                      disabled={isUploading}
                      style={{ 
                        marginTop: '10px',
                        padding: '8px 16px',
                        background: 'var(--theme-color, #C57642)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      {isUploading ? 'Upload...' : 'Changer photo'}
                    </button>
                    {selectedImage && (
                      <button 
                        onClick={uploadImage} 
                        disabled={isUploading}
                        style={{ 
                          marginLeft: '10px',
                          padding: '8px 16px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        {isUploading ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="profile-info">
                    <h4 style={{ color: 'var(--theme-color, #C57642)' }}>
                      {prenom} {nom}
                    </h4>
                    <p><strong>Email :</strong> {user.email}</p>
                    <p><strong>Rôle :</strong> 
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: user.role === 'admin' ? '#dc3545' : user.role === 'artiste' ? '#28a745' : '#6c757d',
                        color: 'white', 
                        fontSize: '0.9em' 
                      }}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </p>
                    <p><strong>Inscrit le :</strong> {new Date(user.date_inscription).toLocaleDateString('fr-FR')}</p>
                    {user.telephone && <p><strong>Téléphone :</strong> {user.telephone}</p>}
                  </div>
                  <form onSubmit={handleUpdateProfile}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label>Prénom</label>
                        <input 
                          type="text" 
                          value={prenom} 
                          onChange={(e) => setPrenom(e.target.value)} 
                          className="form-control" 
                          required 
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label>Nom</label>
                        <input 
                          type="text" 
                          value={nom} 
                          onChange={(e) => setNom(e.target.value)} 
                          className="form-control" 
                          required 
                        />
                      </div>
                      <div className="col-md-12 mb-3">
                        <label>Téléphone (optionnel)</label>
                        <input 
                          type="tel" 
                          value={telephone} 
                          onChange={(e) => setTelephone(e.target.value)} 
                          className="form-control" 
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="btn btn-primary mt-3"
                      style={{ 
                        background: 'var(--theme-color, #C57642)',
                        border: 'none',
                        padding: '12px 30px',
                        borderRadius: '10px'
                      }}
                    >
                      {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  </form>
                  {/* ← MODIFIÉ : Section Devenir Artiste avec bouton modal */}
                  {user && user.role === 'user' && (
                    <div className="mt-4">
                      <h5>Devenir Artiste</h5>
                      <p>Vous êtes actuellement un utilisateur standard. Demandez à devenir artiste pour créer des œuvres !</p>
                      <button 
                        onClick={openDemandeModal}  
                        disabled={isSubmitting || hasPendingRequest}
                        className="btn btn-secondary"
                        style={{ 
                          background: 'var(--theme-color, #C57642)',
                          border: 'none',
                          padding: '12px 30px',
                          borderRadius: '10px',
                          color: 'white'
                        }}
                      >
                        {isSubmitting ? 'Envoi...' : hasPendingRequest ? 'Demande en cours' : 'Demander le rôle Artiste'}
                      </button>
                    </div>
                  )}
                  {/* 2FA Section (inchangée) */}
                  <div className="mt-4">
                    <h5>Authentification à deux facteurs</h5>
                    {user.two_factor_enabled ? (
                      <div>
                        <p>2FA activé. <button onClick={disable2FA} style={{ color: '#dc3545' }}>Désactiver</button></p>
                      </div>
                    ) : (
                      <div>
                        <button onClick={generate2FA} className="btn btn-secondary">Activer 2FA</button>
                      </div>
                    )}
                  </div>
                  {/* Modal QR (inchangé) */}
                  {showQRModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', maxWidth: '300px' }}>
                        <h4>Scan QR Code</h4>
                        <img src={`data:image/png;base64,${qrCode}`} alt="QR" style={{ width: '100%' }} />
                        <p>Secret: {secret}</p>
                        <input 
                          type="text" 
                          placeholder="Code 2FA" 
                          value={enableCode} 
                          onChange={(e) => setEnableCode(e.target.value)} 
                          style={{ width: '100%', margin: '10px 0' }} 
                        />
                        <button onClick={enable2FA} disabled={isEnabling || enableCode.length !== 6}>Activer</button>
                        <button onClick={() => setShowQRModal(false)}>Fermer</button>
                      </div>
                    </div>
                  )}
                  {/* ← NOUVEAU : Modal pour Raison Demande */}
                  {showDemandeModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', maxWidth: '500px', width: '90%' }}>
                        <h4 style={{ color: 'var(--theme-color, #C57642)' }}>Demande de Rôle Artiste</h4>
                        <p style={{ marginBottom: '20px' }}>Expliquez pourquoi vous souhaitez devenir artiste (optionnel).</p>
                        <textarea 
                          value={raison} 
                          onChange={(e) => setRaison(e.target.value)} 
                          placeholder="Raison de votre demande..." 
                          style={{ width: '100%', height: '100px', marginBottom: '20px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} 
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button 
                            onClick={closeDemandeModal} 
                            disabled={isSubmitting}
                            style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                          >
                            Annuler
                          </button>
                          <button 
                            onClick={handleSubmitDemande} 
                            disabled={isSubmitting}
                            style={{ padding: '10px 20px', background: 'var(--theme-color, #C57642)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                          >
                            {isSubmitting ? 'Envoi...' : 'Envoyer la Demande'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <button 
                      onClick={handleDeleteAccount} 
                      disabled={isDeleting}
                      style={{ 
                        color: '#dc3545', 
                        background: 'none', 
                        border: 'none', 
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Supprimer le compte
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-center mt-4">
                <button 
                  onClick={handleLogout}
                  style={{ 
                    color: 'var(--theme-color, #C57642)', 
                    textDecoration: 'none', 
                    fontWeight: 500, 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Déconnexion
                </button>
              </div>
              {message && (
                <div className={`mt-3 ${messageClass}`} role="status" style={{ 
                  textAlign: 'center', 
                  padding: '12px',
                  borderRadius: '8px', 
                  fontWeight: 500,
                  fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                  border: '1px solid',
                  width: '100%',
                  ...(messageClass.includes('success') ? { 
                    color: '#28a745', 
                    background: 'rgba(40, 167, 69, 0.1)',
                    borderColor: '#28a745'
                  } : { 
                    color: '#dc3545', 
                    background: 'rgba(220, 53, 69, 0.1)',
                    borderColor: '#dc3545'
                  })
                }}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-wrapper footer-layout1" style={{ 
        background: 'var(--smoke-color, #F8F7F4)', 
        padding: '30px 0', 
        textAlign: 'center',
        fontFamily: 'var(--body-font, "Roboto", sans-serif)',
        position: 'relative',
        zIndex: 3
      }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-auto">
              <p style={{ color: 'var(--body-color, #7B7E86)', marginBottom: '10px', fontSize: '0.9em' }}>
                © 2025 Artvista. Tous droits réservés.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <a href="https://facebook.com/" style={{ color: 'var(--theme-color, #C57642)' }}><i className="fab fa-facebook-f"></i></a>
                <a href="https://twitter.com/" style={{ color: 'var(--theme-color, #C57642)' }}><i className="fab fa-twitter"></i></a>
                <a href="https://instagram.com/" style={{ color: 'var(--theme-color, #C57642)' }}><i className="fab fa-instagram"></i></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Profile;
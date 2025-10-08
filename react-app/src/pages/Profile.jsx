import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './_pageStyles.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [message, setMessage] = useState('');
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
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Session expirée'));
      localStorage.removeItem('token');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return;
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', selectedImage);
    try {
      const response = await axios.patch(`http://localhost:8000/api/utilisateurs/${user.id}/`, 
        formData,
        {
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );
      setUser(response.data);
      setMessage('Image uploadée !');
      setSelectedImage(null);
      setImagePreview(`http://localhost:8000${response.data.image}`);
    } catch (error) {
      setMessage('Erreur upload : ' + (error.response?.data?.error || 'Échec'));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await axios.patch(`http://localhost:8000/api/utilisateurs/${user.id}/`, 
        { prenom, nom, telephone },
        {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true
        }
      );
      setUser(response.data);
      setMessage('Profil mis à jour !');
    } catch (error) {
      setMessage('Erreur mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer le profil ?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8000/api/utilisateurs/${user.id}/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      localStorage.removeItem('token');
      setMessage('Profil supprimé');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setMessage('Erreur suppression');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px',
      fontFamily: 'var(--body-font, "Roboto", sans-serif)',
      color: 'var(--body-color, #7B7E86)',
      backgroundColor: 'var(--smoke-color, #F8F7F4)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div>Chargement...</div>
    </div>
  );

  const messageClass = message
    ? (message.toLowerCase().includes('erreur') ? 'message message-error' : 'message message-success')
    : '';

  return (
    <>
      {/* Header identique à Login/Register */}
      <header className="nav-header header-layout1" style={{ position: 'relative', zIndex: 10 }}>
        <div className="menu-area">
          <div className="container">
            <div className="row align-items-center justify-content-center">
              <div className="col-auto">
                <div className="header-logo">
                  <a href="/">
                    <img src="/assets/img/logo.svg" alt="Artvista" style={{ maxHeight: '50px' }} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Section principale avec même design */}
      <section className="hero-wrapper auth-hero" style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '40px 0',
        marginTop: '-80px',
        paddingTop: '120px'
      }}>
        <div className="hero-thumb1" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          overflow: 'hidden',
          opacity: 0.1,
          zIndex: 1
        }}>
          <img src="/assets/img/hero/hero_1_1.png" alt="Decor" style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }} />
        </div>

        <div className="container" style={{ 
          position: 'relative', 
          zIndex: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="row justify-content-center w-100">
            <div className="col-xl-6 col-lg-7 col-md-8 col-sm-10">
              {/* Carte principale du profil */}
              <div className="hero-style1 auth-form-wrapper" style={{ 
                background: 'rgba(255, 255, 255, 0.95)', 
                padding: '50px 45px', 
                borderRadius: '15px', 
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                <h1 className="auth-title hero-title" style={{ 
                  color: 'var(--title-color, #373E43)', 
                  marginBottom: '40px', 
                  fontSize: '2.2em', 
                  fontWeight: 300,
                  fontFamily: 'var(--title-font, "Jost", sans-serif)',
                  letterSpacing: '0.5px'
                }}>
                  Mon Profil
                </h1>

                {/* Section photo de profil */}
                <div style={{ 
                  background: 'rgba(248, 247, 244, 0.8)', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  marginBottom: '30px',
                  border: '2px solid var(--border-color, #D9D9D9)'
                }}>
                  <div style={{ marginBottom: '20px' }}>
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Profil" 
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: '3px solid var(--theme-color, #C57642)',
                          boxShadow: '0 4px 15px rgba(197, 118, 66, 0.2)'
                        }} 
                      />
                    ) : (
                      <div style={{ 
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
                        margin: '0 auto', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'var(--theme-color, #C57642)',
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                        border: '3px solid var(--theme-color, #C57642)'
                      }}>
                        Photo
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                      marginRight: '15px', 
                      padding: '12px 25px', 
                      background: 'linear-gradient(135deg, var(--theme-color, #C57642) 0%, #a55e35 100%)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '10px', 
                      cursor: 'pointer',
                      fontFamily: 'var(--title-font, "Jost", sans-serif)',
                      transition: 'all 0.3s ease',
                      fontWeight: 500,
                      boxShadow: '0 4px 15px rgba(197, 118, 66, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(197, 118, 66, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(197, 118, 66, 0.3)';
                    }}
                  >
                    Choisir Image
                  </button>
                  {selectedImage && (
                    <button
                      type="button"
                      onClick={uploadImage}
                      style={{ 
                        padding: '12px 25px', 
                        background: 'linear-gradient(135deg, #28a745 0%, #218838 100%)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '10px', 
                        cursor: 'pointer',
                        fontFamily: 'var(--title-font, "Jost", sans-serif)',
                        transition: 'all 0.3s ease',
                        fontWeight: 500,
                        boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                      }}
                    >
                      Upload Image
                    </button>
                  )}
                </div>

                {/* Informations du profil */}
                <div style={{ 
                  background: 'rgba(248, 247, 244, 0.8)', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  marginBottom: '30px',
                  border: '2px solid var(--border-color, #D9D9D9)',
                  textAlign: 'left'
                }}>
                  <p style={{ 
                    marginBottom: '15px', 
                    color: 'var(--body-color, #7B7E86)',
                    fontSize: '1em',
                    fontFamily: 'var(--body-font, "Roboto", sans-serif)'
                  }}><strong style={{ color: 'var(--title-color, #373E43)' }}>Prénom :</strong> {user.prenom}</p>
                  <p style={{ 
                    marginBottom: '15px', 
                    color: 'var(--body-color, #7B7E86)',
                    fontSize: '1em',
                    fontFamily: 'var(--body-font, "Roboto", sans-serif)'
                  }}><strong style={{ color: 'var(--title-color, #373E43)' }}>Nom :</strong> {user.nom}</p>
                  <p style={{ 
                    marginBottom: '15px', 
                    color: 'var(--body-color, #7B7E86)',
                    fontSize: '1em',
                    fontFamily: 'var(--body-font, "Roboto", sans-serif)'
                  }}><strong style={{ color: 'var(--title-color, #373E43)' }}>Email :</strong> {user.email}</p>
                  <p style={{ 
                    marginBottom: '15px', 
                    color: 'var(--body-color, #7B7E86)',
                    fontSize: '1em',
                    fontFamily: 'var(--body-font, "Roboto", sans-serif)'
                  }}><strong style={{ color: 'var(--title-color, #373E43)' }}>Téléphone :</strong> {user.telephone || 'Non renseigné'}</p>
                  <p style={{ 
                    marginBottom: '0', 
                    color: 'var(--body-color, #7B7E86)',
                    fontSize: '1em',
                    fontFamily: 'var(--body-font, "Roboto", sans-serif)'
                  }}><strong style={{ color: 'var(--title-color, #373E43)' }}>Date d'inscription :</strong> {new Date(user.date_inscription).toLocaleDateString()}</p>
                </div>

                {/* Formulaire de mise à jour */}
                <form onSubmit={handleUpdate} style={{ marginBottom: '30px' }}>
                  <div className="form-group mb-25">
                    <label className="form-label" style={{ 
                      display: 'block', 
                      marginBottom: '12px',
                      color: 'var(--body-color, #7B7E86)', 
                      fontWeight: 500,
                      fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                      fontSize: '0.95em',
                      textAlign: 'left'
                    }}>
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid var(--border-color, #D9D9D9)', 
                        borderRadius: '10px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        background: '#fff',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        textAlign: 'left'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--theme-color, #C57642)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(197, 118, 66, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-color, #D9D9D9)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                      }}
                    />
                  </div>

                  <div className="form-group mb-25">
                    <label className="form-label" style={{ 
                      display: 'block', 
                      marginBottom: '12px',
                      color: 'var(--body-color, #7B7E86)', 
                      fontWeight: 500,
                      fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                      fontSize: '0.95em',
                      textAlign: 'left'
                    }}>
                      Nom
                    </label>
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid var(--border-color, #D9D9D9)', 
                        borderRadius: '10px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        background: '#fff',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        textAlign: 'left'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--theme-color, #C57642)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(197, 118, 66, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-color, #D9D9D9)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                      }}
                    />
                  </div>

                  <div className="form-group mb-30">
                    <label className="form-label" style={{ 
                      display: 'block', 
                      marginBottom: '12px',
                      color: 'var(--body-color, #7B7E86)', 
                      fontWeight: 500,
                      fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                      fontSize: '0.95em',
                      textAlign: 'left'
                    }}>
                      Téléphone (optionnel)
                    </label>
                    <input
                      type="tel"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid var(--border-color, #D9D9D9)', 
                        borderRadius: '10px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        background: '#fff',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        textAlign: 'left'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--theme-color, #C57642)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(197, 118, 66, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-color, #D9D9D9)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <button
                      type="submit"
                      style={{ 
                        flex: 1,
                        padding: '16px',
                        background: 'linear-gradient(135deg, var(--theme-color, #C57642) 0%, #a55e35 100%)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '10px', 
                        fontSize: '16px', 
                        cursor: 'pointer',
                        fontFamily: 'var(--title-font, "Jost", sans-serif)',
                        fontWeight: 500,
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(197, 118, 66, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(197, 118, 66, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(197, 118, 66, 0.3)';
                      }}
                    >
                      Mettre à jour
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      style={{ 
                        flex: 1,
                        padding: '16px',
                        background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '10px', 
                        fontSize: '16px', 
                        cursor: 'pointer',
                        fontFamily: 'var(--title-font, "Jost", sans-serif)',
                        fontWeight: 500,
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </form>

                {/* Lien de déconnexion */}
                <p style={{ 
                  textAlign: 'center', 
                  marginTop: '20px', 
                  color: 'var(--body-color, #7B7E86)', 
                  fontFamily: 'var(--body-font, "Roboto", sans-serif)',
                  fontSize: '0.95em'
                }}>
                  <a 
                    href="#" 
                    onClick={handleLogout}
                    style={{ 
                      color: 'var(--theme-color, #C57642)', 
                      textDecoration: 'none', 
                      fontWeight: 500,
                      transition: 'color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.color = '#a55e35'}
                    onMouseOut={(e) => e.target.style.color = 'var(--theme-color, #C57642)'}
                  >
                    Déconnexion
                  </a>
                </p>

                {/* Message */}
                {message && <p className={messageClass} role="status" style={{ 
                  textAlign: 'center', 
                  marginTop: '20px', 
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
                }}>{message}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer identique */}
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
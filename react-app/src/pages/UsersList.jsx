import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './_pageStyles.css';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_inscription');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUsers(token);
  }, [navigate]);

  const fetchUsers = async (token) => {
    try {
      const response = await axios.get('http://localhost:8000/api/utilisateurs/', {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setUsers(response.data);
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Impossible de charger les utilisateurs'));
    } finally {
      setLoading(false);
    }
  };

  // Filtrer et trier les utilisateurs
  const filteredUsers = users
    .filter(user => 
      user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'prenom':
          return a.prenom?.localeCompare(b.prenom);
        case 'nom':
          return a.nom?.localeCompare(b.nom);
        case 'date_inscription':
          return new Date(b.date_inscription) - new Date(a.date_inscription);
        default:
          return 0;
      }
    });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div>Chargement des utilisateurs...</div>
      </div>
    );
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
                <div className="header-nav">
                  <a href="/profile" className="nav-link">Mon Profil</a>
                  <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Section principale - Pleine largeur */}
      <section className="hero-wrapper auth-hero" style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
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

        <div className="container-fluid" style={{  /* Changé en container-fluid pour pleine largeur */
          position: 'relative', 
          zIndex: 2,
          padding: '0 40px'  /* Padding sur les côtés */
        }}>
          <div className="row justify-content-center">
            <div className="col-12">  {/* Col-12 pour pleine largeur */}
              {/* Carte principale - Pleine largeur */}
              <div className="hero-style1 auth-form-wrapper" style={{ 
                background: 'rgba(255, 255, 255, 0.95)', 
                padding: '40px', 
                borderRadius: '15px', 
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(10px)',
                width: '100%',
                margin: '0 auto',
                minHeight: '70vh'
              }}>
                <h1 className="auth-title hero-title" style={{ 
                  color: 'var(--title-color, #373E43)', 
                  marginBottom: '30px', 
                  fontSize: '2.2em', 
                  fontWeight: 300,
                  fontFamily: 'var(--title-font, "Jost", sans-serif)',
                  letterSpacing: '0.5px',
                  textAlign: 'center'
                }}>
                  Liste des Utilisateurs
                </h1>

                {/* Barre de recherche et filtres */}
                <div style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  marginBottom: '30px',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Rechercher par nom, prénom ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '12px 20px',
                        border: '2px solid var(--border-color, #D9D9D9)', 
                        borderRadius: '10px',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        background: '#fff',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    />
                  </div>
                  <div style={{ minWidth: '200px' }}>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid var(--border-color, #D9D9D9)', 
                        borderRadius: '10px',
                        fontSize: '14px',
                        background: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="date_inscription">Plus récents</option>
                      <option value="prenom">Prénom A-Z</option>
                      <option value="nom">Nom A-Z</option>
                    </select>
                  </div>
                </div>

                {/* Statistiques */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '25px',
                  padding: '15px 25px',
                  background: 'rgba(248, 247, 244, 0.8)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, #D9D9D9)'
                }}>
                  <div>
                    <span style={{ 
                      color: 'var(--body-color, #7B7E86)',
                      fontSize: '0.9em'
                    }}>
                      {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} trouvé{filteredUsers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div>
                    <span style={{ 
                      color: 'var(--theme-color, #C57642)',
                      fontSize: '0.9em',
                      fontWeight: '500'
                    }}>
                      Total : {users.length} membres
                    </span>
                  </div>
                </div>

                {/* Tableau des utilisateurs */}
                <div style={{ 
                  overflowX: 'auto',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, #D9D9D9)',
                  background: 'white'
                }}>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '800px'
                  }}>
                    {/* En-tête du tableau */}
                    <thead>
                      <tr style={{ 
                        background: 'linear-gradient(135deg, var(--theme-color, #C57642) 0%, #a55e35 100%)',
                        color: 'white'
                      }}>
                        <th style={{ 
                          padding: '15px 20px',
                          textAlign: 'left',
                          fontWeight: '500',
                          fontSize: '0.9em',
                          borderRight: '1px solid rgba(255,255,255,0.2)'
                        }}>
                          Utilisateur
                        </th>
                        <th style={{ 
                          padding: '15px 20px',
                          textAlign: 'left',
                          fontWeight: '500',
                          fontSize: '0.9em',
                          borderRight: '1px solid rgba(255,255,255,0.2)'
                        }}>
                          Contact
                        </th>
                        <th style={{ 
                          padding: '15px 20px',
                          textAlign: 'left',
                          fontWeight: '500',
                          fontSize: '0.9em',
                          borderRight: '1px solid rgba(255,255,255,0.2)'
                        }}>
                          Téléphone
                        </th>
                        <th style={{ 
                          padding: '15px 20px',
                          textAlign: 'left',
                          fontWeight: '500',
                          fontSize: '0.9em'
                        }}>
                          Date d'inscription
                        </th>
                      </tr>
                    </thead>
                    
                    {/* Corps du tableau */}
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ 
                            padding: '40px',
                            textAlign: 'center',
                            color: 'var(--body-color, #7B7E86)'
                          }}>
                            Aucun utilisateur trouvé
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user, index) => (
                          <tr 
                            key={user.id}
                            style={{ 
                              background: index % 2 === 0 ? 'white' : 'rgba(248, 247, 244, 0.5)',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'rgba(197, 118, 66, 0.05)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = index % 2 === 0 ? 'white' : 'rgba(248, 247, 244, 0.5)';
                            }}
                          >
                            {/* Colonne Utilisateur */}
                            <td style={{ 
                              padding: '15px 20px',
                              borderBottom: '1px solid var(--border-color, #D9D9D9)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  borderRadius: '50%',
                                  background: user.image ? 'transparent' : 'linear-gradient(135deg, var(--theme-color, #C57642) 0%, #a55e35 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: user.image ? 'transparent' : 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.9em',
                                  overflow: 'hidden',
                                  flexShrink: 0
                                }}>
                                  {user.image ? (
                                    <img 
                                      src={`http://localhost:8000${user.image}`} 
                                      alt={`${user.prenom} ${user.nom}`}
                                      style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover' 
                                      }}
                                    />
                                  ) : (
                                    `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`
                                  )}
                                </div>
                                <div>
                                  <div style={{ 
                                    color: 'var(--title-color, #373E43)',
                                    fontWeight: '500',
                                    fontSize: '0.95em',
                                    marginBottom: '2px'
                                  }}>
                                    {user.prenom} {user.nom}
                                  </div>
                                  <div style={{ 
                                    color: 'var(--body-color, #7B7E86)',
                                    fontSize: '0.8em'
                                  }}>
                                    ID: {user.id}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Colonne Contact */}
                            <td style={{ 
                              padding: '15px 20px',
                              borderBottom: '1px solid var(--border-color, #D9D9D9)',
                              borderLeft: '1px solid var(--border-color, #D9D9D9)'
                            }}>
                              <div style={{ 
                                color: 'var(--body-color, #7B7E86)',
                                fontSize: '0.9em'
                              }}>
                                {user.email}
                              </div>
                            </td>

                            {/* Colonne Téléphone */}
                            <td style={{ 
                              padding: '15px 20px',
                              borderBottom: '1px solid var(--border-color, #D9D9D9)',
                              borderLeft: '1px solid var(--border-color, #D9D9D9)'
                            }}>
                              <div style={{ 
                                color: user.telephone ? 'var(--title-color, #373E43)' : 'var(--body-color, #7B7E86)',
                                fontSize: '0.9em',
                                fontStyle: user.telephone ? 'normal' : 'italic'
                              }}>
                                {user.telephone || 'Non renseigné'}
                              </div>
                            </td>

                            {/* Colonne Date d'inscription */}
                            <td style={{ 
                              padding: '15px 20px',
                              borderBottom: '1px solid var(--border-color, #D9D9D9)',
                              borderLeft: '1px solid var(--border-color, #D9D9D9)'
                            }}>
                              <div style={{ 
                                color: 'var(--theme-color, #C57642)',
                                fontSize: '0.85em',
                                fontWeight: '500'
                              }}>
                                {formatDate(user.date_inscription)}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Message */}
                {message && (
                  <div className={messageClass} style={{ marginTop: '20px' }}>
                    {message}
                  </div>
                )}

                {/* Bouton retour */}
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                  <button
                    onClick={() => navigate('/profile')}
                    style={{ 
                      padding: '12px 30px',
                      background: 'transparent',
                      color: 'var(--theme-color, #C57642)',
                      border: '2px solid var(--theme-color, #C57642)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontFamily: 'var(--title-font, "Jost", sans-serif)',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'var(--theme-color, #C57642)';
                      e.target.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = 'var(--theme-color, #C57642)';
                    }}
                  >
                    Retour au profil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-wrapper footer-layout1" style={{ 
        background: 'var(--smoke-color, #F8F7F4)', 
        padding: '30px 0', 
        textAlign: 'center',
        fontFamily: 'var(--body-font, "Roboto", sans-serif)',
        position: 'relative',
        zIndex: 3
      }}>
        <div className="container-fluid" style={{ padding: '0 40px' }}>
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

export default UsersList;
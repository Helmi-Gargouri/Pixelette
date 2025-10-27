import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';  

const AdminDemands = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_demande');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCurrentRole(token);
  }, [navigate]);

  const fetchCurrentRole = async (token) => {
    try {
      const response = await axios.get(`${API_BASE}utilisateurs/profile/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setCurrentUserRole(response.data.role);
      
      if (response.data.role !== 'admin') {
        // Non-admin : afficher message d'erreur et rediriger
        setMessage('Erreur : Accès réservé aux admins');
        setTimeout(() => navigate('/profile'), 2000);
        return;
      }
      
      // Admin : continuer normalement et charger les demandes
      fetchDemandes(token);
    } catch (error) {
      console.error('Erreur fetchCurrentRole:', error);
      navigate('/login');
    }
  };

  const fetchDemandes = async (token) => {
    try {
      const response = await axios.get(`${API_BASE}demandes/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setDemandes(response.data);
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Impossible de charger les demandes'));
    } finally {
      setLoading(false);
    }
  };

  const filteredDemandes = demandes
    .filter(demande => 
      demande.utilisateur_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.nouveau_role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.raison?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'utilisateur_nom':
          return a.utilisateur_nom?.localeCompare(b.utilisateur_nom);
        case 'date_demande':
          return new Date(b.date_demande) - new Date(a.date_demande);
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
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const handleApprouver = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE}demandes/${id}/approuver/`, {}, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setMessage(response.data.message);
      fetchDemandes(token);  // Refresh
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Échec'));
    } finally {
      setLoading(false);
    }
  };

  const handleRejeter = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE}demandes/${id}/rejeter/`, {}, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setMessage(response.data.message);
      fetchDemandes(token);  // Refresh
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Échec'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div>Chargement des demandes...</div></div>;
  }

  const messageClass = message
    ? (message.toLowerCase().includes('erreur') ? 'message message-error' : 'message message-success')
    : '';

  return (
    <>
      {/* Header (copié de UsersList) */}
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
                  Demandes de Rôle Artiste
                </h2>
              </div>
              {/* Recherche et tri */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, rôle ou raison..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="form-control" 
                  />
                </div>
                <div className="col-md-3">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-control">
                    <option value="date_demande">Date (récente)</option>
                    <option value="utilisateur_nom">Nom</option>
                  </select>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead className="thead-dark">
                    <tr>
                      <th>Nom Utilisateur</th>
                      <th>Rôle Demandé</th>
                      <th>Raison</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDemandes.map((demande) => (
                      <tr key={demande.id}>
                        <td>{demande.utilisateur_nom}</td>
                        <td>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            background: '#28a745',
                            color: 'white', 
                            fontSize: '0.85em' 
                          }}>
                            {demande.nouveau_role.charAt(0).toUpperCase() + demande.nouveau_role.slice(1)}
                          </span>
                        </td>
                        <td>{demande.raison || 'Aucune'}</td>
                        <td>{formatDate(demande.date_demande)}</td>
                        <td>
                          <button 
                            onClick={() => handleApprouver(demande.id)}
                            style={{ 
                              padding: '5px 10px', 
                              background: '#28a745', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px', 
                              marginRight: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            Approuver
                          </button>
                          <button 
                            onClick={() => handleRejeter(demande.id)}
                            style={{ 
                              padding: '5px 10px', 
                              background: '#dc3545', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Rejeter
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredDemandes.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center">Aucune demande en attente</td>
                      </tr>
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
      </section>

      {/* Footer (copié de UsersList) */}
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

export default AdminDemands;
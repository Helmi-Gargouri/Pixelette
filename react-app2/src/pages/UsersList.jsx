import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_inscription');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ prenom: '', nom: '', email: '', telephone: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCurrentRole(token);
    fetchUsers(token);
  }, [navigate]);

  const fetchCurrentRole = async (token) => {
    try {
      const response = await axios.get('http://localhost:8000/api/utilisateurs/profile/', {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setCurrentUserRole(response.data.role);
      if (response.data.role !== 'admin') {
        setMessage('Erreur : Accès réservé aux admins');
        setTimeout(() => navigate('/profile'), 2000);
      }
    } catch (error) {
      navigate('/login');
    }
  };

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

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      prenom: user.prenom || '',
      nom: user.nom || '',
      email: user.email || '',
      telephone: user.telephone || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setEditForm({ prenom: '', nom: '', email: '', telephone: '' });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`http://localhost:8000/api/utilisateurs/${selectedUser.id}/`, editForm, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setMessage('Utilisateur mis à jour !');
      fetchUsers(token);
      closeModal();
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Échec mise à jour'));
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Confirmer suppression ?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/utilisateurs/${userId}/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setMessage('Utilisateur supprimé !');
      fetchUsers(token);
    } catch (error) {
      setMessage('Erreur : ' + (error.response?.data?.error || 'Échec suppression'));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // ✅ FILTRAGE + TRI ajoutés ici
  const filteredUsers = users
    .filter((user) => {
      const search = searchTerm.toLowerCase();
      return (
        user.prenom.toLowerCase().includes(search) ||
        user.nom.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'prenom') {
        return a.prenom.localeCompare(b.prenom);
      } else {
        return new Date(b.date_inscription) - new Date(a.date_inscription);
      }
    });

  const messageClass = message
    ? (message.toLowerCase().includes('erreur') ? 'message message-error' : 'message message-success')
    : '';

  const renderModal = () => (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' 
    }}>
      <div style={{ 
        background: 'white', padding: '30px', borderRadius: '10px', maxWidth: '500px', width: '90%' 
      }}>
        <h3 style={{ color: 'var(--theme-color, #C57642)', textAlign: 'center' }}>Modifier Utilisateur</h3>
        <form onSubmit={handleUpdateUser}>
          <div className="mb-3">
            <label>Prénom</label>
            <input type="text" name="prenom" value={editForm.prenom} onChange={handleEditChange} className="form-control" required />
          </div>
          <div className="mb-3">
            <label>Nom</label>
            <input type="text" name="nom" value={editForm.nom} onChange={handleEditChange} className="form-control" required />
          </div>
          <div className="mb-3">
            <label>Email</label>
            <input type="email" name="email" value={editForm.email} onChange={handleEditChange} className="form-control" required />
          </div>
          <div className="mb-3">
            <label>Téléphone (optionnel)</label>
            <input type="tel" name="telephone" value={editForm.telephone} onChange={handleEditChange} className="form-control" />
          </div>
          <div className="d-flex justify-content-between">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading-screen"><div>Chargement des utilisateurs...</div></div>;
  }

  return (
    <>
      <header className="nav-header header-layout1">
        <div className="menu-area">
          <div className="container">
            <div className="row align-items-center justify-content-between">
              <div className="col-auto">
                <div className="header-logo">
                  <a href="/"><img src="/assets/img/logo.svg" alt="Artvista" style={{ maxHeight: '50px' }} /></a>
                </div>
              </div>
              <div className="col-auto">
                <button onClick={handleLogout} style={{ color: 'var(--theme-color, #C57642)', background: 'none', border: 'none', fontSize: '16px' }}>Déconnexion</button>
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
                <h2 style={{ color: 'var(--theme-color, #C57642)' }}>Gestion des Utilisateurs</h2>
              </div>
              <div className="row mb-4">
                <div className="col-md-6">
                  <input type="text" placeholder="Rechercher par prénom, nom ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-control" />
                </div>
                <div className="col-md-3">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-control">
                    <option value="date_inscription">Date d'inscription (récente)</option>
                    <option value="prenom">Prénom</option>
                  </select>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead className="thead-dark">
                    <tr>
                      <th>Prénom</th>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Date Inscription</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.prenom}</td>
                        <td>{user.nom}</td>
                        <td>{user.email}</td>
                        <td>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', background: user.role === 'admin' ? '#dc3545' : user.role === 'artiste' ? '#28a745' : '#6c757d', color: 'white', fontSize: '0.85em' }}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td>{formatDate(user.date_inscription)}</td>
                        <td>
                          <button onClick={() => openEditModal(user)} style={{ padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', marginRight: '5px' }}>Modifier</button>
                          <button onClick={() => handleDeleteUser(user.id)} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Supprimer</button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center">Aucun utilisateur trouvé</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {message && <div className={messageClass} style={{ marginTop: '20px' }}>{message}</div>}

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

      {showModal && renderModal()}

      <footer className="footer-wrapper footer-layout1" style={{ background: 'var(--smoke-color, #F8F7F4)', padding: '30px 0', textAlign: 'center' }}>
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

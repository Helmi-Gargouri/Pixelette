import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../../../context/AuthContext.jsx';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  SquarePen,
  Trash2,
  X,
  Save,
  AlertTriangle,
  SquareUserRound,
} from 'lucide-react';

const UserGrid = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ prenom: '', nom: '', email: '', telephone: '', role: '' });
  const [addForm, setAddForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    password: '',
    password_confirm: '',
    role: 'user',
  });
  const [addErrors, setAddErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const usersPerPage = 8;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user || user.role !== 'admin') {
      toast.error('Accès refusé: Admin requis');
      navigate('/login');
      return;
    }
    fetchUsers();
  }, [authLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

const fetchUsers = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    console.log('📤 Envoi requête utilisateurs avec token:', token); // Log du token

    if (!token) {
      throw new Error('Aucun token trouvé dans localStorage');
    }

    const response = await axios.get(`http://localhost:8000/api/utilisateurs/`, {
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    console.log('📌 Utilisateurs récupérés:', response.data);
    setUsers(response.data);
  } catch (err) {
    console.error('❌ Fetch users error:', err);
    console.error('❌ Détails erreur:', err.response?.data);
    toast.error('Erreur chargement utilisateurs: ' + (err.response?.data?.detail || err.message));
  } finally {
    setLoading(false);
  }
};

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      user.nom?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const indexOfLastItem = currentPage * usersPerPage;
  const indexOfFirstItem = indexOfLastItem - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-danger/10 text-danger', label: 'Admin' },
      artiste: { bg: 'bg-warning/10 text-warning', label: 'Artiste' },
      user: { bg: 'bg-success/10 text-success', label: 'User' },
    };
    const badge = badges[role] || { bg: 'bg-default-200 text-default-600', label: role };
    return (
      <span className={`py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium rounded ${badge.bg}`}>
        {badge.label}
      </span>
    );
  };

  const getAvatar = (user) =>
    user.image ? (
      <img src={user.image} alt={user.prenom} className="rounded-full size-16" />
    ) : (
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-default-200 font-semibold text-lg">
        {user.prenom?.charAt(0).toUpperCase() + user.nom?.charAt(0).toUpperCase()}
      </div>
    );

  const openDetails = (user) => {
    console.log('Opening details modal for user:', user);
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const openEdit = (user) => {
    console.log('Opening edit modal for user:', user);
    setSelectedUser(user);
    setEditForm({
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      telephone: user.telephone || '',
      role: user.role,
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const openAdd = () => {
    console.log('Opening add modal');
    setAddForm({
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      password: '',
      password_confirm: '',
      role: 'user',
    });
    setAddErrors({});
    setShowAddModal(true);
  };

  const validateAddForm = () => {
    const errors = {};
    if (addForm.password !== addForm.password_confirm) {
      errors.password_confirm = 'Les mots de passe ne correspondent pas.';
    }
    return errors;
  };

  const validateEditForm = () => {
    return {};
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = validateAddForm();
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/api/utilisateurs/`,
        addForm,
        {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true,
        }
      );
      setUsers([...users, response.data]);
      toast.success('Utilisateur ajouté !');
      setShowAddModal(false);
    } catch (err) {
      console.error('Add user error:', err);
      const errorData = err.response?.data || {};
      setAddErrors({
        email: errorData.email?.[0],
        password: errorData.password?.[0],
        password_confirm: errorData.password_confirm?.[0],
        general: errorData.non_field_errors?.[0] || 'Erreur lors de l\'ajout de l\'utilisateur',
      });
      toast.error(errorData.email?.[0] || errorData.password?.[0] || errorData.password_confirm?.[0] || errorData.non_field_errors?.[0] || 'Erreur lors de l\'ajout de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:8000/api/utilisateurs/${selectedUser.id}/`,
        editForm,
        {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true,
        }
      );
      setUsers(users.map((u) => (u.id === selectedUser.id ? response.data : u)));
      toast.success('Utilisateur mis à jour !');
      setShowEditModal(false);
    } catch (err) {
      console.error('Edit user error:', err);
      const errorData = err.response?.data || {};
      setEditErrors({
        email: errorData.email?.[0],
        general: errorData.non_field_errors?.[0] || 'Erreur lors de la mise à jour de l\'utilisateur',
      });
      toast.error(errorData.email?.[0] || errorData.non_field_errors?.[0] || 'Erreur lors de la mise à jour de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/utilisateurs/${userId}/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true,
      });
      setUsers(users.filter((u) => u.id !== userId));
      toast.success('Utilisateur supprimé !');
    } catch (err) {
      console.error('Delete user error:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin size-8 text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between gap-3 flex-wrap items-center mb-5">
        <div className="md:flex items-center md:space-y-0 space-y-4 gap-3">
          <div className="relative">
            <input
              type="text"
              className="form-input form-input-sm ps-9 focus:ring-primary focus:border-primary transition-all duration-200"
              placeholder="Rechercher par nom, email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute inset-y-0 start-0 flex items-center ps-3">
              <Search className="size-3.5 text-default-500 fill-default-100" />
            </div>
          </div>
          <select
            className="form-input form-input-sm focus:ring-primary focus:border-primary transition-all duration-200"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="artiste">Artiste</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={openAdd}
            className="btn btn-sm bg-primary text-white hover:bg-primary/80 transition-all duration-200"
          >
            <Plus className="size-4 me-1" />
            Ajouter Utilisateur
          </button>
          <button
            type="button"
            className="btn btn-sm size-7.5 bg-default-100 text-default-500 hover:bg-default-150 hover:text-white transition-all duration-200"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
        {currentUsers.map((user) => (
          <div key={user.id} className="card shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="card-body">
              <div className="relative flex items-center justify-center mx-auto text-lg rounded-full size-16 bg-default-100">
                {getAvatar(user)}
                <span className="absolute bg-success border-2 border-white rounded-full size-3 end-0 bottom-1"></span>
              </div>
              <div className="mt-4 text-center text-default-500">
                <h5 className="mb-1 text-base text-default-800 font-semibold">
                  <span className="cursor-pointer hover:text-primary transition-colors duration-200" onClick={() => openDetails(user)}>
                    {user.prenom} {user.nom}
                  </span>
                </h5>
                <p className="mb-3 text-sm">{getRoleBadge(user.role)}</p>
                <p className="text-sm text-default-500">{user.email}</p>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => openDetails(user)}
                  className="btn border-primary text-primary hover:bg-primary hover:text-white flex-grow transition-all duration-200"
                >
                  <Eye size={14} />
                  <span className="align-middle">Voir Détails</span>
                </button>
                <div className="hs-dropdown relative inline-flex">
                  <button
                    type="button"
                    className="hs-dropdown-toggle btn bg-primary size-9 text-white hover:bg-primary/80 transition-all duration-200"
                    aria-haspopup="menu"
                    aria-expanded="false"
                    aria-label="Dropdown"
                    hs-dropdown-placement="bottom-end"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                  <div className="hs-dropdown-menu bg-white shadow-lg rounded-lg mt-1">
                    <button
                      onClick={() => openDetails(user)}
                      className="flex items-center gap-1.5 py-1.5 font-medium px-3 text-default-500 hover:bg-default-150 rounded w-full text-left"
                    >
                      <Eye className="size-3" />
                      Aperçu
                    </button>
                    <button
                      onClick={() => openEdit(user)}
                      className="flex items-center gap-1.5 py-1.5 font-medium px-3 text-default-500 hover:bg-default-150 rounded w-full text-left"
                    >
                      <SquarePen className="size-3" />
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="flex items-center gap-1.5 py-1.5 font-medium px-3 text-danger hover:bg-danger/10 rounded w-full text-left"
                    >
                      <Trash2 className="size-3" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {currentUsers.length === 0 && (
          <div className="col-span-full text-center py-20">
            <SquareUserRound className="size-16 text-default-300 mx-auto mb-4" />
            <p className="text-default-500">
              {search || roleFilter ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap md:justify-between justify-center items-center md:gap-0 gap-4 my-5 text-default-500">
        <p className="text-default-500 text-sm">
          Affichage <b>{indexOfFirstItem + 1}</b> à <b>{Math.min(indexOfLastItem, filteredUsers.length)}</b> sur{' '}
          <b>{filteredUsers.length}</b> résultats
        </p>
        <nav className="flex items-center gap-2" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10 transition-all duration-200"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4 me-1" /> Précédent
          </button>
          {[...Array(Math.min(totalPages, 3))].map((_, idx) => {
            const page = idx + 1;
            return (
              <button
                key={page}
                type="button"
                className={`btn size-7.5 ${
                  currentPage === page
                    ? 'bg-primary text-white'
                    : 'bg-transparent border border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10'
                } transition-all duration-200`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            );
          })}
          <button
            type="button"
            className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10 transition-all duration-200"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Suivant
            <ChevronRight className="size-4 ms-1" />
          </button>
        </nav>
      </div>

      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h6 className="font-semibold text-lg text-default-800 mb-4">Détails de l'utilisateur</h6>
            <div className="space-y-3 text-sm text-default-600">
              <p className="flex justify-between">
                <strong>ID:</strong> <span>{selectedUser.id}</span>
              </p>
              <p className="flex justify-between">
                <strong>Nom:</strong> <span>{selectedUser.prenom} {selectedUser.nom}</span>
              </p>
              <p className="flex justify-between">
                <strong>Email:</strong> <span>{selectedUser.email}</span>
              </p>
              <p className="flex justify-between">
                <strong>Téléphone:</strong> <span>{selectedUser.telephone || 'N/A'}</span>
              </p>
              <p className="flex justify-between">
                <strong>Rôle:</strong> <span>{getRoleBadge(selectedUser.role)}</span>
              </p>
              <p className="flex justify-between">
                <strong>2FA Activé:</strong> <span>{selectedUser.two_factor_enabled ? 'Oui' : 'Non'}</span>
              </p>
              <p className="flex justify-between">
                <strong>Date d'inscription:</strong>{' '}
                <span>{new Date(selectedUser.date_inscription).toLocaleDateString('fr-FR')}</span>
              </p>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn bg-default-200 text-default-600 flex-1 hover:bg-default-300 transition-all duration-200 rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h6 className="font-semibold text-lg text-default-800 mb-4">Modifier l'utilisateur</h6>
            {editErrors.general && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger text-sm p-3 rounded-lg mb-4">
                <AlertTriangle size={16} />
                <span>{editErrors.general}</span>
              </div>
            )}
            {editErrors.email && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger text-sm p-3 rounded-lg mb-4">
                <AlertTriangle size={16} />
                <span>{editErrors.email}</span>
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Prénom</label>
                <input
                  type="text"
                  value={editForm.prenom}
                  onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Entrez le prénom"
                  autoFocus
                />
              </div>
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Nom</label>
                <input
                  type="text"
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Entrez le nom"
                />
              </div>
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Entrez l'email"
                />
              </div>
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Téléphone</label>
                <input
                  type="text"
                  value={editForm.telephone}
                  onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Entrez le téléphone"
                />
              </div>
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Rôle</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                >
                  <option value="user">User</option>
                  <option value="artiste">Artiste</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  type="submit"
                  className="btn bg-success text-white flex-1 hover:bg-success/80 transition-all duration-200 rounded-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin size-4 mr-2" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Sauvegarder
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn bg-default-200 text-default-600 flex-1 hover:bg-default-300 transition-all duration-200 rounded-lg"
                  disabled={isSubmitting}
                >
                  <X size={16} /> Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h6 className="font-semibold text-lg text-default-800 mb-4">Ajouter un utilisateur</h6>
            {addErrors.general && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger text-sm p-3 rounded-lg mb-4">
                <AlertTriangle size={16} />
                <span>{addErrors.general}</span>
              </div>
            )}
            {addErrors.email && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger text-sm p-3 rounded-lg mb-4">
                <AlertTriangle size={16} />
                <span>{addErrors.email}</span>
              </div>
            )}
            {addErrors.password && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger text-sm p-3 rounded-lg mb-4">
                <AlertTriangle size={16} />
                <span>{addErrors.password}</span>
              </div>
            )}
            {addErrors.password_confirm && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger text-sm p-3 rounded-lg mb-4">
                <AlertTriangle size={16} />
                <span>{addErrors.password_confirm}</span>
              </div>
            )}
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Prénom</label>
                <input
                  type="text"
                  value={addForm.prenom}
                  onChange={(e) => setAddForm({ ...addForm, prenom: e.target.value })}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Entrez le prénom"
                  autoFocus
                />
              </div>
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Nom</label>
                <input
                  type="text"
                  value={addForm.nom}
                  onChange={(e) => setAddForm({ ...addForm, nom: e.target.value })}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Entrez le nom"
                />
              </div>
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Entrez l'email"
                />
              </div>
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Téléphone</label>
                <input
                  type="text"
                  value={addForm.telephone}
                  onChange={(e) => setAddForm({ ...addForm, telephone: e.target.value })}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Entrez le téléphone"
                />
              </div>
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Entrez le mot de passe"
                />
              </div>
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={addForm.password_confirm}
                  onChange={(e) => {
                    console.log('password_confirm changed:', e.target.value);
                    setAddForm({ ...addForm, password_confirm: e.target.value });
                  }}
                  onClick={() => console.log('password_confirm clicked')}
                  onFocus={() => console.log('password_confirm focused')}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Confirmez le mot de passe"
                  style={{ pointerEvents: 'auto', zIndex: 10, opacity: 1 }}
                />
              </div>
              <div className="relative">
                <label className="block text-sm text-default-500 mb-1">Rôle</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full border border-default-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                >
                  <option value="user">User</option>
                  <option value="artiste">Artiste</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  type="submit"
                  className="btn bg-success text-white flex-1 hover:bg-success/80 transition-all duration-200 rounded-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin size-4 mr-2" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn bg-default-200 text-default-600 flex-1 hover:bg-default-300 transition-all duration-200 rounded-lg"
                  disabled={isSubmitting}
                >
                  <X size={16} /> Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UserGrid;
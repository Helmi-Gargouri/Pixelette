import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  LuChevronLeft, LuChevronRight, LuEllipsis, LuEye, LuLoader, LuPlus, LuSearch, LuSlidersHorizontal, 
  LuSquarePen, LuTrash2, LuShieldCheck, LuPalette, LuSquareUserRound, LuDownload, LuX, LuSave 
} from 'react-icons/lu';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ prenom: '', nom: '', telephone: '', role: '' });
  const navigate = useNavigate();
  const usersPerPage = 10;

  useEffect(() => {
    // RBAC Guard
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      toast.error('Connexion requise');
      navigate('/basic-login');
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== 'admin') {
      toast.error('Accès refusé: Admin requis');
      navigate('/basic-login');
      return;
    }
    fetchUsers();
  }, []);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/utilisateurs/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error('Erreur chargement users');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      user.nom?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = 
      !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Pagination
  const indexOfLastItem = currentPage * usersPerPage;
  const indexOfFirstItem = indexOfLastItem - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-danger/10 text-danger', label: 'Admin' },
      artiste: { bg: 'bg-warning/10 text-warning', label: 'Artiste' },
      user: { bg: 'bg-success/10 text-success', label: 'User' }
    };
    const badge = badges[role] || { bg: 'bg-default-200 text-default-600', label: role };
    return (
      <span className={`py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium rounded ${badge.bg}`}>
        {badge.label}
      </span>
    );
  };

  const getAvatar = (user) => user.image ? (
    <img src={user.image} alt={user.prenom} className="w-10 h-10 rounded-full" />
  ) : (
    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-default-200 font-semibold">
      {user.prenom?.charAt(0).toUpperCase() + user.nom?.charAt(0).toUpperCase()}
    </div>
  );

  const openDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setEditForm({ prenom: user.prenom, nom: user.nom, telephone: user.telephone || '', role: user.role });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm('Confirmer modifications ?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:8000/api/utilisateurs/${selectedUser.id}/`, editForm, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      toast.success('User mis à jour !');
      fetchUsers();
      setShowEditModal(false);
    } catch (err) {
      toast.error('Erreur mise à jour');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/utilisateurs/${userId}/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      toast.success('User supprimé !');
      fetchUsers();
    } catch (err) {
      toast.error('Erreur suppression');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><LuLoader className="animate-spin size-8" /></div>;

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="card-title">Users List</h6>
        <Link to="/basic-register" className="btn btn-sm bg-primary text-white">
          <LuPlus className="size-4 me-1" />
          Add user
        </Link>
      </div>

      <div className="card-header">
        <div className="md:flex items-center md:space-y-0 space-y-4 gap-3">
          <div className="relative">
            <input
              type="text"
              className="form-input form-input-sm ps-9"
              placeholder="Search for name,email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute inset-y-0 start-0 flex items-center ps-3">
              <LuSearch className="size-3.5 flex items-center text-default-500 fill-default-100" />
            </div>
          </div>

          <select className="form-input form-input-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">select role</option>
            <option value="admin">Admin</option>
            <option value="artiste">Artiste</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <button type="button" className="btn btn-sm bg-transparent border border-dashed border-primary text-primary hover:bg-primary/10">
            <LuDownload className="size-4" />
            Import
          </button>
          <button type="button" className="btn btn-sm size-7.5 bg-default-100 text-default-500 hover:bg-default-150 hover:text-white">
            <LuSlidersHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-default-200">
                <thead className="bg-default-150">
                  <tr className="text-sm font-normal text-default-700 whitespace-nowrap">
                    <th className="ps-4 text-start">
                      <input id="checkbox-all" type="checkbox" className="form-checkbox" />
                    </th>
                    <th className="px-3.5 py-3 text-start">User ID</th>
                    <th className="px-3.5 py-3 text-start">Name</th>
                    <th className="px-3.5 py-3 text-start">Role</th>
                    <th className="px-3.5 py-3 text-start">Email</th>
                    <th className="px-3.5 py-3 text-start">Phone Number</th>
                    <th className="px-3.5 py-3 text-start">Joining Date</th>
                    <th className="px-3.5 py-3 text-start">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map(user => (
                    <tr key={user.id} className="text-default-800 font-normal text-sm whitespace-nowrap">
                      <td className="py-3 ps-4">
                        <input type="checkbox" className="form-checkbox" />
                      </td>
                      <td className="px-3.5 py-3 text-primary">#{user.id}</td>
                      <td className="flex py-3 px-3.5 items-center gap-3">
                        {getAvatar(user)}
                        <div>
                          <h6 className="mb-1.5 font-semibold">
                            <span className="text-default-800 cursor-pointer" onClick={() => openDetails(user)}>
                              {user.prenom} {user.nom}
                            </span>
                          </h6>
                          <p className="text-default-500">Member</p>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">{getRoleBadge(user.role)}</td>
                      <td className="py-3 px-3.5">{user.email}</td>
                      <td className="py-3 px-3.5">{user.telephone || 'N/A'}</td>
                      <td className="py-3 px-3.5">{new Date(user.date_inscription).toLocaleDateString('fr-FR')}</td>
                      <td className="px-3.5 py-3">
                        <div className="hs-dropdown relative inline-flex">
                          <button type="button" className="hs-dropdown-toggle btn size-7.5 bg-default-200 hover:bg-default-600 text-default-500">
                            <LuEllipsis className="size-4" />
                          </button>
                          <div className="hs-dropdown-menu" role="menu">
                            <button onClick={() => openDetails(user)} className="flex items-center gap-1.5 py-1.5 px-3 text-default-500 hover:bg-default-150 rounded">
                              <LuEye className="size-3" /> Details
                            </button>
                            <button onClick={() => openEdit(user)} className="flex items-center gap-1.5 py-1.5 px-3 text-default-500 hover:bg-default-150 rounded">
                              <LuSquarePen className="size-3" /> Edit
                            </button>
                            <button onClick={() => deleteUser(user.id)} className="flex items-center gap-1.5 py-1.5 px-3 text-danger hover:bg-danger/10 rounded">
                              <LuTrash2 className="size-3" /> Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {currentUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-20">
                        <LuSquareUserRound className="size-16 text-default-300 mx-auto mb-4" />
                        <p className="text-default-500">
                          {search || roleFilter ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="card-footer">
          <p className="text-default-500 text-sm">
            Showing <b>{indexOfFirstItem + 1}</b> to <b>{Math.min(indexOfLastItem, filteredUsers.length)}</b> of <b>{filteredUsers.length}</b> Results
          </p>
          <nav className="flex items-center gap-2" aria-label="Pagination">
            <button 
              type="button" 
              className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <LuChevronLeft className="size-4 me-1" /> Prev
            </button>

            {[...Array(Math.min(totalPages, 3))].map((_, idx) => {
              const page = idx + 1;
              return (
                <button 
                  key={page}
                  type="button" 
                  className={`btn size-7.5 ${currentPage === page ? 'bg-primary text-white' : 'bg-transparent border border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10'}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}

            <button 
              type="button" 
              className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <LuChevronRight className="size-4 ms-1" />
            </button>
          </nav>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h6 className="font-semibold mb-3">Détails User</h6>
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {selectedUser.id}</p>
              <p><strong>Nom:</strong> {selectedUser.prenom} {selectedUser.nom}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Téléphone:</strong> {selectedUser.telephone || 'N/A'}</p>
              <p><strong>Rôle:</strong> {getRoleBadge(selectedUser.role)}</p>
              <p><strong>Date Inscription:</strong> {new Date(selectedUser.date_inscription).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowDetailsModal(false)} className="btn bg-default-200 text-default-600 flex-1">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h6 className="font-semibold mb-3">Modifier User</h6>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-default-700 mb-1">Prénom</label>
                <input
                  value={editForm.prenom}
                  onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-default-700 mb-1">Nom</label>
                <input
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-default-700 mb-1">Téléphone</label>
                <input
                  value={editForm.telephone}
                  onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-default-700 mb-1">Rôle</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="form-input w-full"
                >
                  <option value="user">User</option>
                  <option value="artiste">Artiste</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn bg-success text-white flex-1">
                  <LuSave size={16} className="mr-2" /> Sauvegarder
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn bg-default-200 text-default-600 flex-1">
                  <LuX size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
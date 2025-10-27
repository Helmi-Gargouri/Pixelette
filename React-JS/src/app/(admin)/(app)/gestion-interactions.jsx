import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Loader,
  Search,
  SlidersHorizontal,
  Calendar,
  BarChart3,
  CheckCircle2,
  XCircle,
  Download,
  Ellipsis,
  Eye,
  Trash2,
  Plus,
  Filter,
  MessageSquare,
  Heart,
  Share2
} from 'lucide-react';

const GestionInteractions = () => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();
  const interactionsPerPage = 10;
 const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  useEffect(() => {
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
    fetchInteractions();
    fetchStatistics();
  }, [currentPage, search, typeFilter]);

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: interactionsPerPage,
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter })
      });

      const response = await axios.get(
        `${API_BASE}/interactions/?${params}`,
        {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true
        }
      );

      const data = response.data.results || response.data;
      console.log('Données interactions:', data); // Debug
      setInteractions(data);
      setTotal(response.data.count || data.length);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des interactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/interactions/statistics/`,
        {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true
        }
      );
      setStatistics(response.data);
    } catch (error) {
      console.error('Erreur statistiques:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette interaction ?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/interactions/${id}/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      toast.success('Interaction supprimée !');
      fetchInteractions();
      fetchStatistics();
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error('Aucune interaction sélectionnée');
      return;
    }
    
    if (!window.confirm(`Supprimer ${selectedItems.length} interaction(s) ?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/interactions/bulk_delete/`, {
        data: { ids: selectedItems },
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      });
      toast.success(`${selectedItems.length} interaction(s) supprimée(s) !`);
      setSelectedItems([]);
      fetchInteractions();
      fetchStatistics();
    } catch (error) {
      toast.error('Erreur suppression groupée');
    }
  };

  const toggleSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedItems(prev => 
      prev.length === interactions.length 
        ? []
        : interactions.map(item => item.id)
    );
  };

  const getTypeBadge = (type) => {
    console.log('Type reçu:', type); // Debug
    const badges = {
      like: <span className="py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium bg-success/10 text-success rounded">
        <Heart className="size-3" />
        Like
      </span>,
      commentaire: <span className="py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium bg-info/10 text-info rounded">
        <MessageSquare className="size-3" />
        Commentaire
      </span>,
      partage: <span className="py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium bg-warning/10 text-warning rounded">
        <Share2 className="size-3" />
        Partage
      </span>
    };
    return badges[type] || <span className="py-0.5 px-2.5 inline-flex items-center text-xs font-medium bg-gray-100 text-gray-800 rounded">{type || 'Non défini'}</span>;
  };

  const totalPages = Math.ceil(total / interactionsPerPage);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin size-8" />
      </div>
    );

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h6 className="card-title">Gestion des Interactions</h6>
        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="btn btn-sm bg-danger text-white flex items-center gap-1"
            >
              <Trash2 className="size-4" />
              Supprimer ({selectedItems.length})
            </button>
          )}
          <button 
            onClick={() => setShowStats(!showStats)}
            className="btn btn-sm bg-primary text-white flex items-center gap-1"
          >
            <BarChart3 className="size-4" />
            Statistiques
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {showStats && statistics && (
        <div className="card-header">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-default-600">Total Interactions</p>
                  <p className="text-2xl font-bold text-primary">{statistics.total_interactions}</p>
                </div>
                <BarChart3 className="size-8 text-primary" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-default-600">Likes</p>
                  <p className="text-2xl font-bold text-success">{statistics.by_type?.like || 0}</p>
                </div>
                <Heart className="size-8 text-success" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-info/10 border border-info/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-default-600">Commentaires</p>
                  <p className="text-2xl font-bold text-info">{statistics.by_type?.commentaire || 0}</p>
                </div>
                <MessageSquare className="size-8 text-info" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-default-600">Partages</p>
                  <p className="text-2xl font-bold text-warning">{statistics.by_type?.partage || 0}</p>
                </div>
                <Share2 className="size-8 text-warning" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card-header flex flex-wrap gap-3 justify-between items-center">
        <div className="relative">
          <input
            type="text"
            className="form-input form-input-sm ps-9"
            placeholder="Rechercher utilisateur, oeuvre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute inset-y-0 start-0 flex items-center ps-3">
            <Search className="size-3.5 text-default-500" />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            className="form-select form-select-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="like">Likes</option>
            <option value="commentaire">Commentaires</option>
            <option value="partage">Partages</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-default-200">
            <thead className="bg-default-150">
              <tr className="text-sm font-normal text-default-700 whitespace-nowrap">
                <th className="px-3.5 py-3 text-start">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={selectedItems.length === interactions.length && interactions.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-3.5 py-3 text-start">Type</th>
                <th className="px-3.5 py-3 text-start">Utilisateur</th>
                <th className="px-3.5 py-3 text-start">Oeuvre</th>
                <th className="px-3.5 py-3 text-start">Plateforme</th>
                <th className="px-3.5 py-3 text-start">Date</th>
                <th className="px-3.5 py-3 text-start">Actions</th>
              </tr>
            </thead>
            <tbody>
              {interactions.map((interaction) => (
                <tr
                  key={interaction.id}
                  className="text-default-800 font-normal text-sm whitespace-nowrap"
                >
                  <td className="px-3.5 py-3">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectedItems.includes(interaction.id)}
                      onChange={() => toggleSelection(interaction.id)}
                    />
                  </td>
                  <td className="px-3.5 py-3">{getTypeBadge(interaction.type)}</td>
                  <td className="px-3.5 py-3">{interaction.utilisateur_nom}</td>
                  <td className="px-3.5 py-3 max-w-xs truncate">{interaction.oeuvre_titre}</td>
                  <td className="px-3.5 py-3 max-w-xs">
                    {interaction.type === 'commentaire' ? (
                      <div className="truncate" title={interaction.contenu}>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-blue-500" />
                          {interaction.contenu || 'Contenu vide'}
                        </span>
                      </div>
                    ) : (
                      interaction.plateforme_partage || '-'
                    )}
                  </td>
                  <td className="px-3.5 py-3">
                    {new Date(interaction.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="hs-dropdown relative inline-flex">
                      <button
                        type="button"
                        className="hs-dropdown-toggle btn size-7.5 bg-default-200 hover:bg-default-600 text-default-500"
                      >
                        <Ellipsis className="size-4" />
                      </button>
                      <div className="hs-dropdown-menu" role="menu">
                        <button
                          onClick={() => handleDelete(interaction.id)}
                          className="flex items-center gap-1.5 py-1.5 px-3 text-danger hover:bg-default-150 rounded"
                        >
                          <Trash2 className="size-3" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-4 py-3">
            <div className="text-sm text-default-600">
              Page {currentPage} sur {totalPages} ({total} interactions)
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-sm bg-default-200 hover:bg-default-300 disabled:opacity-50"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-sm bg-default-200 hover:bg-default-300 disabled:opacity-50"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionInteractions;
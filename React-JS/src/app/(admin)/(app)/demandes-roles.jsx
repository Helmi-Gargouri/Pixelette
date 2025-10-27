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
  SquarePen,
  CheckCircle2,
  XCircle,
  Download,
  Ellipsis,
  Eye,
  Trash2,
  Plus
} from 'lucide-react';

const DemandesRoles = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const demandesPerPage = 10;
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
    fetchDemandes();
  }, [currentPage, search, statutFilter]);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: currentPage });
      if (search) params.append('search', search);
      if (statutFilter) params.append('statut', statutFilter);
      const response = await axios.get(
        `${API_BASE}demandes/?${params.toString()}`,
        {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true
        }
      );
      setDemandes(response.data.results || response.data);
      setTotal(response.data.count || response.data.length);
    } catch (err) {
      console.error('Fetch demandes error:', err);
      toast.error('Erreur chargement demandes');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    const badges = {
      pending: { bg: 'bg-warning/10 text-warning', label: 'En attente', icon: Loader },
      approved: { bg: 'bg-success/10 text-success', label: 'Approuvée', icon: CheckCircle2 },
      rejected: { bg: 'bg-danger/10 text-danger', label: 'Rejetée', icon: XCircle }
    };
    const badge = badges[statut] || { bg: 'bg-default-200 text-default-600', label: statut, icon: Calendar };
    const Icon = badge.icon;
    return (
      <span
        className={`py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium rounded ${badge.bg}`}
      >
        <Icon className="size-3" />
        {badge.label}
      </span>
    );
  };

  const handleApprouver = async (id) => {
    if (!window.confirm('Approuver cette demande ?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE}demandes/${id}/approuver/`,
        {},
        { headers: { Authorization: `Token ${token}` }, withCredentials: true }
      );
      toast.success('Demande approuvée !');
      fetchDemandes();
    } catch (err) {
      toast.error('Erreur approbation');
    }
  };

  const handleRejeter = async (id) => {
    if (!window.confirm('Rejeter cette demande ?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE}demandes/${id}/rejeter/`,
        {},
        { headers: { Authorization: `Token ${token}` }, withCredentials: true }
      );
      toast.success('Demande rejetée !');
      fetchDemandes();
    } catch (err) {
      toast.error('Erreur rejet');
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin size-8" />
      </div>
    );

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h6 className="card-title">Demandes de Rôle Artiste</h6>
        <Link to="/profile" className="btn btn-sm bg-primary text-white flex items-center gap-1">
          <Plus className="size-4" />
          Retour Profil
        </Link>
      </div>

      <div className="card-header flex flex-wrap gap-3 justify-between items-center">
        <div className="relative">
          <input
            type="text"
            className="form-input form-input-sm ps-9"
            placeholder="Rechercher nom, raison"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute inset-y-0 start-0 flex items-center ps-3">
            <Search className="size-3.5 text-default-500" />
          </div>
        </div>

        <select
          className="form-input form-input-sm"
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
        >
          <option value="">Tous statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvée</option>
          <option value="rejected">Rejetée</option>
        </select>

        <div className="flex gap-2 items-center">
          <button
            type="button"
            className="btn btn-sm bg-transparent border border-dashed border-primary text-primary hover:bg-primary/10"
          >
            <Download className="size-4" />
            Exporter
          </button>
          <button
            type="button"
            className="btn btn-sm size-7.5 bg-default-100 text-default-500 hover:bg-default-150 hover:text-white"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-default-200">
            <thead className="bg-default-150">
              <tr className="text-sm font-normal text-default-700 whitespace-nowrap">
                <th className="px-3.5 py-3 text-start">Nom Utilisateur</th>
                <th className="px-3.5 py-3 text-start">Rôle Demandé</th>
                <th className="px-3.5 py-3 text-start">Raison</th>
                <th className="px-3.5 py-3 text-start">Date</th>
                <th className="px-3.5 py-3 text-start">Statut</th>
                <th className="px-3.5 py-3 text-start">Actions</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((demande) => (
                <tr
                  key={demande.id}
                  className="text-default-800 font-normal text-sm whitespace-nowrap"
                >
                  <td className="px-3.5 py-3">{demande.utilisateur_nom}</td>
                  <td className="px-3.5 py-3">
                    <span className="py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium bg-warning/10 text-warning rounded">
                      Artiste
                    </span>
                  </td>
                  <td className="px-3.5 py-3 max-w-xs truncate">
                    {demande.raison || 'Aucune'}
                  </td>
                  <td className="px-3.5 py-3">
                    {new Date(demande.date_demande).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-3.5 py-3">{getStatutBadge(demande.statut)}</td>
                  <td className="px-3.5 py-3">
                    <div className="hs-dropdown relative inline-flex">
                      <button
                        type="button"
                        className="hs-dropdown-toggle btn size-7.5 bg-default-200 hover:bg-default-600 text-default-500"
                      >
                        <Ellipsis className="size-4" />
                      </button>
                      <div className="hs-dropdown-menu" role="menu">
                        {demande.statut === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprouver(demande.id)}
                              className="flex items-center gap-1.5 py-1.5 px-3 text-default-500 hover:bg-default-150 rounded"
                            >
                              <SquarePen className="size-3" /> Approuver
                            </button>
                            <button
                              onClick={() => handleRejeter(demande.id)}
                              className="flex items-center gap-1.5 py-1.5 px-3 text-danger hover:bg-danger/10 rounded"
                            >
                              <Trash2 className="size-3" /> Rejeter
                            </button>
                          </>
                        )}

                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-footer flex justify-between items-center">
          <p className="text-default-500 text-sm">
            Affichage <b>1</b> à <b>{demandes.length}</b> sur <b>{total}</b> résultats
          </p>
          <nav className="flex items-center gap-2" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10 disabled:opacity-50"
            >
              <ChevronLeft className="size-4 me-1" /> Précédent
            </button>
            <button className="btn size-7.5 bg-primary text-white">1</button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage * demandesPerPage >= total}
              className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10 disabled:opacity-50"
            >
              Suivant <ChevronRight className="size-4 ms-1" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default DemandesRoles;

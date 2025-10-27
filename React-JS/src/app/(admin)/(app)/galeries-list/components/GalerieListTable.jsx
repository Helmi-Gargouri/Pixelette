import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  LuChevronLeft, LuChevronRight, LuCircleCheck, LuCircleX,
  LuDownload, LuEllipsis, LuEye, LuLoader, LuPlus, 
  LuSearch, LuSlidersHorizontal, LuSquarePen, LuTrash2,
  LuLock, LuGlobe, LuImages, LuPalette
} from 'react-icons/lu';
import { useAuth } from '@/context/AuthContext';
import GalerieAddModal from './GalerieAddModal';
import GalerieDetailsModal from './GalerieDetailsModal';
import GalerieEditModal from './GalerieEditModal';
import ConfirmDeleteModal from '../../../../../components/ConfirmDeleteModal';
import { exportToExcel, formatGaleriesForExport } from '../../../../../utils/exportExcel';

const GalerieListTable = () => {
  const { user } = useAuth();
  const [galeries, setGaleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // States pour les modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGalerie, setSelectedGalerie] = useState(null);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  useEffect(() => {
    fetchGaleries();
  }, []);

  const fetchGaleries = async () => {
    try {

       const response = await axios.get(`${API_BASE}galeries/`, {
        withCredentials: true
      });
      setGaleries(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des galeries:', error);
      setLoading(false);
    }
  };

  const handleDeleteClick = (galerie) => {
    setSelectedGalerie(galerie);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedGalerie) return;

    try {
      await axios.delete(`${API_BASE}galeries/${selectedGalerie.id}/`, {
        withCredentials: true
      });
      setGaleries(galeries.filter(g => g.id !== selectedGalerie.id));
      setShowDeleteModal(false);
      setSelectedGalerie(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la galerie');
    }
  };

  const handleViewDetails = async (galerie) => {
    // Charger les détails complets avec les œuvres
    try {
      const response = await axios.get(`${API_BASE}galeries/${galerie.id}/`, {
        withCredentials: true
      });
      setSelectedGalerie(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      setSelectedGalerie(galerie);
      setShowDetailsModal(true);
    }
  };

  const handleEdit = (galerie) => {
    setSelectedGalerie(galerie);
    setShowEditModal(true);
  };

  const handleExport = async () => {
    try {
      // Charger les détails complets de chaque galerie avec les œuvres
      const galeriesWithDetails = await Promise.all(
        filteredGaleries.map(async (galerie) => {
          try {
            const response = await axios.get(`${API_BASE}galeries/${galerie.id}/`, {
              withCredentials: true
            });
            return response.data;
          } catch (error) {
            console.error(`Erreur lors du chargement de la galerie ${galerie.id}:`, error);
            return galerie; // Retourne la galerie sans détails en cas d'erreur
          }
        })
      );

      const userName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email : 'Administrateur';
      const { data: formattedData, metadata } = formatGaleriesForExport(galeriesWithDetails, userName);
      const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const time = new Date().toLocaleTimeString('fr-FR').replace(/:/g, '-');
      exportToExcel(formattedData, `galeries_${date}_${time}.xlsx`, metadata);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des galeries');
    }
  };

  // Filtrage
  const filteredGaleries = galeries.filter(galerie => {
    const matchesSearch = 
      galerie.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (galerie.description && galerie.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (galerie.theme && galerie.theme.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      filterStatus === '' ||
      (filterStatus === 'publique' && !galerie.privee) ||
      (filterStatus === 'privee' && galerie.privee);
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGaleries = filteredGaleries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGaleries.length / itemsPerPage);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-default-600">Chargement des galeries...</p>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      <GalerieAddModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchGaleries}
      />

      <GalerieDetailsModal
        show={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedGalerie(null);
        }}
        galerie={selectedGalerie}
      />

      <GalerieEditModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGalerie(null);
        }}
        galerie={selectedGalerie}
        onSuccess={fetchGaleries}
      />

      <ConfirmDeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGalerie(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la galerie"
        itemName={selectedGalerie?.nom}
        message={`Êtes-vous sûr de vouloir supprimer la galerie "${selectedGalerie?.nom}" ? Toutes les œuvres associées seront également supprimées.`}
      />

      <div className="card">
        <div className="card-header">
          <h6 className="card-title">Liste des Galeries</h6>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-sm bg-primary text-white"
          >
            <LuPlus className="size-4 me-1" />
            Nouvelle Galerie
          </button>
        </div>

      <div className="card-header">
        <div className="md:flex items-center md:space-y-0 space-y-4 gap-3">
          <div className="relative">
            <input 
              type="text" 
              className="form-input form-input-sm ps-9" 
              placeholder="Rechercher par nom, thème..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 start-0 flex items-center ps-3">
              <LuSearch className="size-3.5 flex items-center text-default-500 fill-default-100" />
            </div>
          </div>

          <select 
            className="form-input form-input-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Toutes</option>
            <option value="publique">Publiques</option>
            <option value="privee">Privées</option>
          </select>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <button 
            type="button" 
            className="btn btn-sm bg-transparent border border-dashed border-primary text-primary hover:bg-primary/10"
            onClick={handleExport}
          >
            <LuDownload className="size-4" />
            Exporter
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
                    <th className="px-3.5 py-3 text-start">ID</th>
                    <th className="px-3.5 py-3 text-start">Nom</th>
                    <th className="px-3.5 py-3 text-start">Thème</th>
                    <th className="px-3.5 py-3 text-start">Œuvres</th>
                    <th className="px-3.5 py-3 text-start">Date Création</th>
                    <th className="px-3.5 py-3 text-start">Visibilité</th>
                    <th className="px-3.5 py-3 text-start">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentGaleries.map(galerie => (
                    <tr key={galerie.id} className="text-default-800 font-normal text-sm whitespace-nowrap">
                      <td className="py-3 ps-4">
                        <input type="checkbox" className="form-checkbox" />
                      </td>
                      <td className="px-3.5 py-3 text-primary">#{galerie.id}</td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center rounded bg-primary/10">
                            <LuPalette className="size-5 text-primary" />
                          </div>
                          <div>
                            <h6 className="mb-0.5 font-semibold">
                              <Link to={`/admin/galeries/${galerie.id}`} className="text-default-800 hover:text-primary">
                                {galerie.nom}
                              </Link>
                            </h6>
                            {galerie.description && (
                              <p className="text-xs text-default-500 truncate max-w-xs">
                                {galerie.description.substring(0, 50)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        {galerie.theme ? (
                          <span className="py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium bg-info/10 text-info rounded">
                            {galerie.theme}
                          </span>
                        ) : (
                          <span className="text-default-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium bg-default-100 text-default-600 rounded">
                          <LuImages className="size-3" />
                          {galerie.oeuvres_count || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        {new Date(galerie.date_creation).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-3.5 py-3">
                        {!galerie.privee ? (
                          <span className="py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium bg-success/10 text-success rounded">
                            <LuGlobe className="size-3" />
                            Publique
                          </span>
                        ) : (
                          <span className="py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium bg-warning/10 text-warning rounded">
                            <LuLock className="size-3" />
                            Privée
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="hs-dropdown relative inline-flex">
                          <button 
                            type="button" 
                            className="hs-dropdown-toggle btn size-7.5 bg-default-200 hover:bg-default-600 text-default-500"
                          >
                            <LuEllipsis className="size-4" />
                          </button>
                          <div className="hs-dropdown-menu" role="menu">
                            <button 
                              onClick={() => handleViewDetails(galerie)}
                              className="flex items-center gap-1.5 py-1.5 px-3 text-default-500 hover:bg-default-150 rounded w-full text-left"
                            >
                              <LuEye className="size-3" /> Voir Détails
                            </button>
                            <button 
                              onClick={() => handleEdit(galerie)}
                              className="flex items-center gap-1.5 py-1.5 px-3 text-default-500 hover:bg-default-150 rounded w-full text-left"
                            >
                              <LuSquarePen className="size-3" /> Modifier
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(galerie)}
                              className="flex items-center gap-1.5 py-1.5 px-3 text-default-500 hover:bg-default-150 rounded w-full text-left"
                            >
                              <LuTrash2 className="size-3" /> Supprimer
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {currentGaleries.length === 0 && (
                <div className="text-center py-20">
                  <LuPalette className="size-16 text-default-300 mx-auto mb-4" />
                  <p className="text-default-500">
                    {searchTerm || filterStatus ? 'Aucune galerie trouvée' : 'Aucune galerie disponible'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card-footer">
          <p className="text-default-500 text-sm">
            Affichage de <b>{indexOfFirstItem + 1}</b> à <b>{Math.min(indexOfLastItem, filteredGaleries.length)}</b> sur <b>{filteredGaleries.length}</b> résultats
          </p>
          <nav className="flex items-center gap-2" aria-label="Pagination">
            <button 
              type="button" 
              className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary hover:border-primary/10"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <LuChevronLeft className="size-4 me-1" /> Préc
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
              Suiv
              <LuChevronRight className="size-4 ms-1" />
            </button>
          </nav>
        </div>
      </div>
    </div>
    </>
  );
};

export default GalerieListTable;


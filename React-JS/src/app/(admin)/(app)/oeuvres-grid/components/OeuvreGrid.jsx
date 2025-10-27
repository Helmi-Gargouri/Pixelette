import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  LuChevronLeft, LuChevronRight, LuEllipsis, LuEye, 
  LuPlus, LuSearch, LuSlidersHorizontal, LuSquarePen, LuTrash2,
  LuImage, LuCalendar, LuUser
} from 'react-icons/lu';
import OeuvreAddModal from './OeuvreAddModal';
import OeuvreDetailsModal from './OeuvreDetailsModal';
import OeuvreEditModal from './OeuvreEditModal';
import ConfirmDeleteModal from '../../../../../components/ConfirmDeleteModal';

const OeuvreGrid = () => {
  const [oeuvres, setOeuvres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  // States pour les modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOeuvre, setSelectedOeuvre] = useState(null);

  useEffect(() => {
    fetchOeuvres();
  }, []);

  const fetchOeuvres = async () => {
    try {
      const response = await axios.get(`${API_BASE}oeuvres/`, {
        withCredentials: true
      });
      setOeuvres(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des œuvres:', error);
      setLoading(false);
    }
  };

  const handleDeleteClick = (oeuvre) => {
    setSelectedOeuvre(oeuvre);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOeuvre) return;

    try {
      await axios.delete(`${API_BASE}oeuvres/${selectedOeuvre.id}/`, {
        withCredentials: true
      });
      setOeuvres(oeuvres.filter(o => o.id !== selectedOeuvre.id));
      setShowDeleteModal(false);
      setSelectedOeuvre(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'œuvre');
    }
  };

  const handleViewDetails = async (oeuvre) => {
    setSelectedOeuvre(oeuvre);
    setShowDetailsModal(true);
  };

  const handleEdit = (oeuvre) => {
    setSelectedOeuvre(oeuvre);
    setShowEditModal(true);
  };

  // Filtrage
  const filteredOeuvres = oeuvres.filter(oeuvre =>
    oeuvre.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (oeuvre.description && oeuvre.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOeuvres = filteredOeuvres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOeuvres.length / itemsPerPage);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-default-600">Chargement des œuvres...</p>
      </div>
    );
  }

  return <>
      <div className="flex justify-between gap-3 flex-wrap items-center mb-5">
        <div className="relative">
          <input 
            type="text" 
            className="form-input form-input-sm ps-9" 
            placeholder="Rechercher une œuvre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 start-4 flex items-center">
            <LuSearch className="size-3.5 flex items-center text-default-500" />
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-sm bg-primary text-white"
          >
            <LuPlus className="size-4 me-1" />
            Ajouter une Œuvre
          </button>

          <button type="button" className="btn size-7.5 bg-default-500 text-white hover:bg-default-600">
            <LuSlidersHorizontal className="size-4" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <OeuvreAddModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchOeuvres}
      />

      <OeuvreDetailsModal
        show={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOeuvre(null);
        }}
        oeuvre={selectedOeuvre}
      />

      <OeuvreEditModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOeuvre(null);
        }}
        oeuvre={selectedOeuvre}
        onSuccess={fetchOeuvres}
      />

      <ConfirmDeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedOeuvre(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'œuvre"
        itemName={selectedOeuvre?.titre}
        message={`Êtes-vous sûr de vouloir supprimer "${selectedOeuvre?.titre}" ?`}
      />

      <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
        {currentOeuvres.map(oeuvre => (
          <div key={oeuvre.id} className="card">
            <div className="card-body">
              <div className="relative flex items-center justify-center mx-auto rounded-lg overflow-hidden mb-4" style={{ height: '200px' }}>
                {oeuvre.image ? (
                  <img 
                    src={oeuvre.image} 
                    alt={oeuvre.titre} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-default-100">
                    <LuImage className="size-16 text-default-400" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <h5 className="mb-1 text-base text-default-800 font-semibold truncate">
                  {oeuvre.titre}
                </h5>
                {oeuvre.artiste_nom && (
                  <p className="mb-2 text-sm text-default-500 flex items-center justify-center gap-1">
                    <LuUser className="size-3.5" />
                    {oeuvre.artiste_nom}
                  </p>
                )}
                {oeuvre.description && (
                  <p className="text-sm text-default-500 line-clamp-2 mb-3">
                    {oeuvre.description}
                  </p>
                )}
                <p className="text-xs text-default-400 flex items-center justify-center gap-1">
                  <LuCalendar className="size-3" />
                  {new Date(oeuvre.date_creation).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="flex gap-2 mt-5">
                <button 
                  onClick={() => handleViewDetails(oeuvre)}
                  className="btn border-primary text-primary hover:bg-primary hover:text-white flex-grow"
                >
                  <LuEye size={14} />
                  <span className="align-middle">Voir Détails</span>
                </button>

                <div className="hs-dropdown relative inline-flex">
                  <button 
                    type="button" 
                    className="hs-dropdown-toggle btn bg-primary size-9 text-white"
                  >
                    <LuEllipsis className="size-4" />
                  </button>
                  <div className="hs-dropdown-menu" role="menu">
                    <button 
                      className="flex items-center gap-1.5 py-1.5 font-medium px-3 text-default-500 hover:bg-default-150 rounded w-full text-left" 
                      onClick={() => handleViewDetails(oeuvre)}
                    >
                      <LuEye className="size-3" />
                      Voir
                    </button>
                    <button 
                      className="flex items-center gap-1.5 py-1.5 font-medium px-3 text-default-500 hover:bg-default-150 rounded w-full text-left" 
                      onClick={() => handleEdit(oeuvre)}
                    >
                      <LuSquarePen className="size-3" />
                      Modifier
                    </button>
                    <button 
                      className="flex items-center gap-1.5 py-1.5 font-medium px-3 text-default-500 hover:bg-default-150 rounded w-full text-left" 
                      onClick={() => handleDeleteClick(oeuvre)}
                    >
                      <LuTrash2 className="size-3" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentOeuvres.length === 0 && (
        <div className="text-center py-20">
          <LuImage className="size-16 text-default-300 mx-auto mb-4" />
          <p className="text-default-500">
            {searchTerm ? 'Aucune œuvre trouvée' : 'Aucune œuvre disponible'}
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap md:justify-between justify-center items-center md:gap-0 gap-4 my-5 text-default-500">
        <p className="text-default-500 text-sm">
          Affichage de <b>{indexOfFirstItem + 1}</b> à <b>{Math.min(indexOfLastItem, filteredOeuvres.length)}</b> sur <b>{filteredOeuvres.length}</b> résultats
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
    </>;
};

export default OeuvreGrid;


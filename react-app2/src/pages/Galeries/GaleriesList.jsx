import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'

const GaleriesList = () => {
  const [galeries, setGaleries] = useState([])
  const [filteredGaleries, setFilteredGaleries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' })
  const [confirmModal, setConfirmModal] = useState({ show: false, galerieId: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPrivee, setFilterPrivee] = useState('all')
  const [filterTheme, setFilterTheme] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [currentSlides, setCurrentSlides] = useState({})
  const { user, isAuthenticated } = useAuth()
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  useEffect(() => {
    fetchGaleries()
  }, [])

  const fetchGaleries = async () => {
    try {
      const response = await axios.get(`${API_BASE}galeries/`, {
        withCredentials: true
      })
      // Filtrer uniquement les galeries publiques
      const galeriesPubliques = response.data.filter(galerie => !galerie.privee)
      setGaleries(galeriesPubliques)
      setFilteredGaleries(galeriesPubliques)
      setLoading(false)
    } catch (err) {
      setError('Erreur lors du chargement des galeries')
      setLoading(false)
    }
  }

  // Récupérer tous les thèmes uniques
  const allThemes = [...new Set(galeries.map(g => g.theme).filter(Boolean))]

  // Filtrage et tri
  useEffect(() => {
    let result = [...galeries]

    if (searchTerm) {
      result = result.filter(galerie => 
        galerie.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        galerie.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        galerie.theme?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterPrivee !== 'all') {
      result = result.filter(galerie => 
        filterPrivee === 'public' ? !galerie.privee : galerie.privee
      )
    }

    if (filterTheme !== 'all') {
      result = result.filter(galerie => galerie.theme === filterTheme)
    }

    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.date_creation) - new Date(b.date_creation))
        break
      case 'name':
        result.sort((a, b) => a.nom.localeCompare(b.nom))
        break
      case 'oeuvres':
        result.sort((a, b) => (b.oeuvres_count || 0) - (a.oeuvres_count || 0))
        break
      default:
        break
    }

    setFilteredGaleries(result)
  }, [searchTerm, filterPrivee, filterTheme, sortBy, galeries])

  const handleDeleteClick = (id) => {
    setConfirmModal({ show: true, galerieId: id })
  }

  const handleDeleteConfirm = async () => {
    const id = confirmModal.galerieId
    setConfirmModal({ show: false, galerieId: null })

    try {
      await axios.delete(`http://localhost:8000/api/galeries/${id}/`, {
        withCredentials: true
      })
      setGaleries(galeries.filter(galerie => galerie.id !== id))
      setModal({ 
        show: true, 
        title: 'Succès !', 
        message: 'Galerie supprimée avec succès', 
        type: 'success' 
      })
    } catch (err) {
      setModal({ 
        show: true, 
        title: 'Erreur', 
        message: 'Erreur lors de la suppression', 
        type: 'error' 
      })
    }
  }

  const nextSlide = (galerieId, maxLength) => {
    setCurrentSlides(prev => ({
      ...prev,
      [galerieId]: ((prev[galerieId] || 0) + 1) % maxLength
    }))
  }

  const prevSlide = (galerieId, maxLength) => {
    setCurrentSlides(prev => ({
      ...prev,
      [galerieId]: ((prev[galerieId] || 0) - 1 + maxLength) % maxLength
    }))
  }

  if (loading) {
    return (
      <div className="preloader">
        <div className="preloader-inner">
          <img src="/assets/img/logo/logo.png" alt="Artvista" style={{ maxHeight: '80px' }} />
          <span className="loader"></span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Modal
        show={modal.show}
        onClose={() => setModal({ ...modal, show: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
      
      <ConfirmModal
        show={confirmModal.show}
        onClose={() => setConfirmModal({ show: false, galerieId: null })}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette galerie ? Cette action est irréversible."
      />

      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Mes Galeries</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">MES GALERIES</li>
          </ul>
        </div>
      </div>

      {/* Galeries Area */}
      <div className="space">
        <div className="container">
          {/* Barre de recherche et filtres */}
          <div style={{ background: '#F8F7F4', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
            <div className="row align-items-center g-2">
              <div className="col-lg-4 col-md-12">
                <div className="input-group" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: '44px' }}>
                  <span className="input-group-text" style={{ 
                    background: '#fff', 
                    border: 'none', 
                    borderRadius: '10px 0 0 10px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="fas fa-search" style={{ color: 'var(--theme-color)', fontSize: '1rem' }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher une galerie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      border: 'none',
                      padding: '0 12px',
                      fontSize: '14px',
                      background: '#fff',
                      height: '100%',
                      lineHeight: '44px'
                    }}
                  />
                  {searchTerm && (
                    <button
                      className="btn"
                      onClick={() => setSearchTerm('')}
                      style={{ 
                        border: 'none',
                        background: '#fff',
                        borderRadius: '0 10px 10px 0',
                        color: '#7B7E86',
                        padding: '0 12px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-lg-2 col-md-4">
                <select
                  className="form-select"
                  value={filterPrivee}
                  onChange={(e) => setFilterPrivee(e.target.value)}
                  style={{ 
                    border: 'none',
                    padding: '11px 12px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    background: '#fff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    height: '44px'
                  }}
                >
                  <option value="all">Toutes</option>
                  <option value="public">Publiques</option>
                  <option value="private">Privées</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-4">
                <select
                  className="form-select"
                  value={filterTheme}
                  onChange={(e) => setFilterTheme(e.target.value)}
                  style={{ 
                    border: 'none',
                    padding: '11px 12px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    background: '#fff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    height: '44px'
                  }}
                >
                  <option value="all">Tous thèmes</option>
                  {allThemes.map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>
              <div className="col-lg-2 col-md-4">
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ 
                    border: 'none',
                    padding: '11px 12px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    background: '#fff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    height: '44px'
                  }}
                >
                  <option value="recent">Récentes</option>
                  <option value="oldest">Anciennes</option>
                  <option value="name">Nom A-Z</option>
                  <option value="oeuvres">Nb oeuvres</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-12">
                {isAuthenticated && (user?.role === 'artiste' || user?.role === 'admin') && (
                  <Link to="/mes-galeries" className="btn w-100" style={{ padding: '0 15px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-folder me-2"></i>Mes Galeries
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* État vide */}
          {filteredGaleries.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-images fa-4x text-muted mb-4"></i>
              <h3 className="text-muted mb-3">
                {searchTerm || filterPrivee !== 'all' || filterTheme !== 'all' ? 
                  'Aucune galerie trouvée' : 
                  'Aucune galerie disponible'
                }
              </h3>
              <p className="text-muted mb-4">
                {searchTerm || filterPrivee !== 'all' || filterTheme !== 'all' ? 
                  'Essayez avec d\'autres critères de recherche' : 
                  'Commencez par créer votre première galerie !'
                }
              </p>
              {!searchTerm && filterPrivee === 'all' && filterTheme === 'all' && 
               isAuthenticated && (user?.role === 'artiste' || user?.role === 'admin') && (
                <Link to="/galeries/create" className="btn btn-primary">
                  <i className="fas fa-plus me-2"></i>
                  Créer ma première galerie
                </Link>
              )}
            </div>
          )}

          {/* Liste de toutes les galeries avec slider pour chaque */}
          {filteredGaleries.length > 0 && filteredGaleries.map((galerie) => {
            const currentSlideIndex = currentSlides[galerie.id] || 0
            const oeuvresList = galerie.oeuvres_list || []
            const hasOeuvres = oeuvresList.length > 0
            const currentOeuvre = hasOeuvres ? oeuvresList[currentSlideIndex] : null

            return (
              <div key={galerie.id} style={{ marginBottom: '60px' }}>
                {/* Galerie hero style avec titre sur l'image */}
                <div className="hero-wrapper hero-3" style={{ marginBottom: '0', paddingBottom: '40px' }}>
                  <div className="container">
                    <div className="hero-style3">
                      <h1 className="hero-title">
                        {galerie.nom}
                      </h1>
                      <h1 className="hero-title style2">
                        {galerie.theme || 'Collection d\'Art'}
                      </h1>
                      
                      <div className="hero-thumb3-1">
                        {currentOeuvre?.image ? (
                          <img 
                            src={currentOeuvre.image} 
                            alt={currentOeuvre.titre}
                            style={{ 
                              width: '100%', 
                              height: 'auto',
                              borderRadius: '10px'
                            }}
                          />
                        ) : (
                          <img 
                            src="/assets/img/hero/hero_3_1.png" 
                            alt="Galerie d'art"
                          />
                        )}
                        
                        <Link 
                          to={`/galeries/${galerie.id}`}
                          className="btn gsap-magnetic"
                        >
                          Explorer
                        </Link>
                        
                        <div className="event-vanue-details">
                          <span>Créée le {new Date(galerie.date_creation).toLocaleDateString('fr-FR')}</span>
                          <span>{galerie.theme || 'Thème varié'}</span>
                          <span>{galerie.oeuvres_count || 0} œuvre(s)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Controls du slider pour cette galerie */}
                  {hasOeuvres && oeuvresList.length > 1 && (
                    <div className="container">
                      <div className="hero-slider1-controller-wrap">
                        <div className="slides-numbers">
                          <span className="active">{(currentSlideIndex + 1).toString().padStart(2, '0')}</span>
                          <span> / {oeuvresList.length.toString().padStart(2, '0')}</span>
                        </div>
                        <div className="icon-box">
                          <button onClick={() => prevSlide(galerie.id, oeuvresList.length)} className="icon-btn">
                            <svg width="24" height="14" viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6.74198 0L0 7L6.74198 14L7.87513 12.8234L3.06758 7.83189L24 7.83189V6.168L3.06773 6.168L7.87513 1.17658L6.74198 0Z" fill="currentColor"/>
                            </svg>
                          </button>
                          <button onClick={() => nextSlide(galerie.id, oeuvresList.length)} className="icon-btn">
                            <svg width="24" height="14" viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.258 14L24 7L17.258 0L16.1249 1.17658L20.9324 6.16811L2.45808e-07 6.16811V7.832L20.9323 7.832L16.1249 12.8234L17.258 14Z" fill="currentColor"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default GaleriesList
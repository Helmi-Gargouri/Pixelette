import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'

const MesOeuvres = () => {
  const [oeuvres, setOeuvres] = useState([])
  const [filteredOeuvres, setFilteredOeuvres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' })
  const [confirmModal, setConfirmModal] = useState({ show: false, oeuvreId: null })
  const [predictingId, setPredictingId] = useState(null)
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Rediriger si l'utilisateur n'est pas artiste ou admin
    if (!isAuthenticated) {
      navigate('/login')
    } else if (user && user.role !== 'artiste' && user.role !== 'admin') {
      navigate('/oeuvres')
    } else if (user) {
      fetchOeuvres()
    }
  }, [isAuthenticated, user, navigate])

  const fetchOeuvres = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/oeuvres/', {
        withCredentials: true
      })
      // Filtrer uniquement les oeuvres de l'utilisateur connecté
      const mesOeuvres = response.data.filter(oeuvre => oeuvre.auteur === user?.id)
      setOeuvres(mesOeuvres)
      setFilteredOeuvres(mesOeuvres)
      setLoading(false)
    } catch (err) {
      console.error('Erreur lors du chargement des oeuvres:', err)
      setError('Erreur lors du chargement des oeuvres')
      setLoading(false)
    }
  }

  // Filtrage et tri
  useEffect(() => {
    let result = [...oeuvres]

    // Recherche par titre ou description
    if (searchTerm) {
      result = result.filter(oeuvre => 
        oeuvre.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        oeuvre.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Tri
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.date_creation) - new Date(b.date_creation))
        break
      case 'title':
        result.sort((a, b) => a.titre.localeCompare(b.titre))
        break
      default:
        break
    }

    setFilteredOeuvres(result)
  }, [searchTerm, sortBy, oeuvres])

  const handleDeleteClick = (id) => {
    setConfirmModal({ show: true, oeuvreId: id })
  }

  const handleDeleteConfirm = async () => {
    const id = confirmModal.oeuvreId
    setConfirmModal({ show: false, oeuvreId: null })

    try {
      await axios.delete(`http://localhost:8000/api/oeuvres/${id}/`, {
        withCredentials: true
      })
      setOeuvres(oeuvres.filter(oeuvre => oeuvre.id !== id))
      setModal({ 
        show: true, 
        title: 'Succès !', 
        message: 'Oeuvre supprimée avec succès', 
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

  const handlePredictClick = async (oeuvre) => {
    setPredictingId(oeuvre.id)
    try {
      const response = await axios.post(
        `http://localhost:8000/api/oeuvres/${oeuvre.id}/predict_popularity/`,
        {},
        { withCredentials: true }
      )

      const data = response.data || {}
      const tips = data.tips || []
      const aiAdvice = data.ai_advice || ''

      let message = ''
      if (data.predicted_views !== undefined) {
        message += `Vues prévues : ${data.predicted_views}`
      }
      if (data.confidence !== undefined) {
        message += `\nConfiance : ${data.confidence}`
      }
      if (tips.length) {
        message += `\n\nConseils :\n- ${tips.join('\n- ')}`
      }
      if (aiAdvice) {
        message += `\n\nConseil IA :\n${aiAdvice}`
      }

      setModal({ show: true, title: `Prédiction — ${oeuvre.titre}`, message: message, type: 'success' })
    } catch (err) {
      console.error('Prediction error', err)
      setModal({ show: true, title: 'Erreur de prédiction', message: 'Impossible de prédire la popularité pour le moment.', type: 'error' })
    } finally {
      setPredictingId(null)
    }
  }

  // Fonction pour distribuer les oeuvres en deux colonnes de manière équilibrée
  const distributeOeuvres = (oeuvres) => {
    const leftColumn = []
    const rightColumn = []
    
    oeuvres.forEach((oeuvre, index) => {
      // Alterner entre gauche et droite
      if (index % 2 === 0) {
        leftColumn.push(oeuvre)
      } else {
        rightColumn.push(oeuvre)
      }
    })
    
    return { leftColumn, rightColumn }
  }

  if (loading) {
    return (
      <div className="preloader">
        <div className="preloader-inner">
          <img src="/assets/img/logo-white.svg" alt="Artvista" />
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
        onClose={() => setConfirmModal({ show: false, oeuvreId: null })}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette oeuvre ? Cette action est irréversible."
      />

      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Mes Oeuvres</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">MES OEUVRES</li>
          </ul>
        </div>
      </div>

      {/* Portfolio Area */}
      <div className="portfolio-standard-area space overflow-hidden">
        <div className="container">
          {/* Barre de recherche et filtres */}
          <div style={{ background: '#F8F7F4', padding: '25px', borderRadius: '15px', marginBottom: '30px' }}>
            <div className="row align-items-center">
              <div className="col-lg-5 col-md-12 mb-3 mb-lg-0">
                <div className="input-group" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <span className="input-group-text" style={{ 
                    background: '#fff', 
                    border: 'none', 
                    borderRadius: '10px 0 0 10px',
                    padding: '12px 15px'
                  }}>
                    <i className="fas fa-search" style={{ color: 'var(--theme-color)', fontSize: '1.1rem' }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher par titre ou description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      border: 'none',
                      padding: '12px 15px',
                      fontSize: '15px',
                      background: '#fff'
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
                        color: '#7B7E86'
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-lg-3 col-md-8 mb-3 mb-lg-0">
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ 
                    border: 'none',
                    padding: '12px 15px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    background: '#fff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="recent"> Plus récentes</option>
                  <option value="oldest"> Plus anciennes</option>
                  <option value="title"> Titre (A-Z)</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6 mb-3 mb-lg-0">
                <Link to="/oeuvres/create" className="btn w-100" style={{ padding: '12px' }}>
                  <i className="fas fa-plus me-2"></i>Nouvelle oeuvre
                </Link>
              </div>
              <div className="col-lg-2 col-md-6">
                <Link to="/oeuvres/ai-generator" className="btn w-100" style={{ 
                  padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}>
                  <i className="fas fa-magic me-2"></i>Générer IA
                </Link>
              </div>
            </div>
          </div>

          {/* Résultats de recherche */}
          {searchTerm && (
            <div className="mb-4" style={{ 
              padding: '12px 20px', 
              background: '#fff', 
              borderRadius: '10px',
              border: '1px solid #e0e0e0',
              display: 'inline-block'
            }}>
              <i className="fas fa-info-circle me-2" style={{ color: 'var(--theme-color)' }}></i>
              <strong>{filteredOeuvres.length}</strong> résultat{filteredOeuvres.length !== 1 ? 's' : ''} pour <strong>"{searchTerm}"</strong>
            </div>
          )}

          {error && (
            <div className="alert alert-danger text-center mb-4" role="alert">
              {error}
            </div>
          )}

          {filteredOeuvres.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h3>{searchTerm ? 'Aucun résultat trouvé' : 'Aucune oeuvre disponible'}</h3>
              <p>{searchTerm ? 'Essayez avec d\'autres mots-clés' : 'Commencez par créer votre première oeuvre !'}</p>
              {!searchTerm && (
                <div className="d-flex gap-2 justify-content-center mt-3">
                  <Link to="/oeuvres/create" className="btn">
                    <i className="fas fa-plus me-2"></i>
                    Créer ma première oeuvre
                  </Link>
                  <Link to="/oeuvres/ai-generator" className="btn" style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}>
                    <i className="fas fa-magic me-2"></i>
                    Générer avec l'IA
                  </Link>
                </div>
              )}
            </div>
          ) : (
            (() => {
              const { leftColumn, rightColumn } = distributeOeuvres(filteredOeuvres)
              
              return (
                <div className="row gx-4">
                  {/* Colonne de gauche */}
                  <div className="col-lg-6 col-md-6 col-12">
                    {leftColumn.map((oeuvre) => (
                      <div key={oeuvre.id} style={{ marginBottom: '30px' }}>
                        <Link to={`/oeuvres/${oeuvre.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div className="portfolio-card-4" style={{ cursor: 'pointer' }}>
                            <div className="portfolio-thumb">
                              {oeuvre.image ? (
                                <img 
                                  src={oeuvre.image.startsWith('http') 
                                    ? oeuvre.image 
                                    : `http://localhost:8000${oeuvre.image}`
                                  } 
                                  alt={oeuvre.titre}
                                  style={{ 
                                    width: '100%', 
                                    height: 'auto',
                                    display: 'block',
                                    borderRadius: '10px'
                                  }}
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = '/assets/img/portfolio/portfolio_page1_3.png'
                                  }}
                                />
                              ) : (
                                <img 
                                  src="/assets/img/portfolio/portfolio_page1_3.png" 
                                  alt={oeuvre.titre}
                                  style={{ 
                                    width: '100%', 
                                    height: 'auto',
                                    display: 'block',
                                    borderRadius: '10px'
                                  }}
                                />
                              )}
                            </div>
                            <div className="portfolio-details">
                              <span className="portfilio-card-subtitle">Culture Canvas</span>
                              <h3 className="portfilio-card-title">
                                {oeuvre.titre}
                              </h3>
                              {oeuvre.description && (
                                <p className="portfolio-description" style={{ 
                                  color: '#666', 
                                  fontSize: '0.95rem',
                                  marginTop: '15px',
                                  lineHeight: '1.8'
                                }}>
                                  {oeuvre.description.substring(0, 300)}
                                  {oeuvre.description.length > 300 ? '...' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                        {/* Boutons d'action sous l'image */}
                        <div className="d-flex gap-2 mt-2">
                          <Link 
                            to={`/oeuvres/${oeuvre.id}/edit`} 
                            className="btn btn-sm flex-fill"
                            style={{ 
                              backgroundColor: '#6c757d',
                              borderColor: '#6c757d',
                              color: '#fff'
                            }}
                          >
                            <i className="fas fa-edit me-1"></i>
                            Modifier
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handlePredictClick(oeuvre)
                            }}
                            className="btn btn-sm flex-fill"
                            style={{
                              backgroundColor: '#0d6efd',
                              borderColor: '#0d6efd',
                              color: '#fff'
                            }}
                            disabled={predictingId === oeuvre.id}
                          >
                            <i className="fas fa-chart-line me-1"></i>
                            {predictingId === oeuvre.id ? 'Prédiction...' : 'Prédire popularité'}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.preventDefault()
                              handleDeleteClick(oeuvre.id)
                            }}
                            className="btn btn-sm flex-fill"
                            style={{ 
                              backgroundColor: '#dc3545',
                              borderColor: '#dc3545',
                              color: '#fff'
                            }}
                          >
                            <i className="fas fa-trash me-1"></i>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Colonne de droite */}
                  <div className="col-lg-6 col-md-6 col-12">
                    {rightColumn.map((oeuvre) => (
                      <div key={oeuvre.id} style={{ marginBottom: '30px' }}>
                        <Link to={`/oeuvres/${oeuvre.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div className="portfolio-card-4" style={{ cursor: 'pointer' }}>
                            <div className="portfolio-thumb">
                              {oeuvre.image ? (
                                <img 
                                  src={oeuvre.image.startsWith('http') 
                                    ? oeuvre.image 
                                    : `http://localhost:8000${oeuvre.image}`
                                  } 
                                  alt={oeuvre.titre}
                                  style={{ 
                                    width: '100%', 
                                    height: 'auto',
                                    display: 'block',
                                    borderRadius: '10px'
                                  }}
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = '/assets/img/portfolio/portfolio_page1_3.png'
                                  }}
                                />
                              ) : (
                                <img 
                                  src="/assets/img/portfolio/portfolio_page1_3.png" 
                                  alt={oeuvre.titre}
                                  style={{ 
                                    width: '100%', 
                                    height: 'auto',
                                    display: 'block',
                                    borderRadius: '10px'
                                  }}
                                />
                              )}
                            </div>
                            <div className="portfolio-details">
                              <span className="portfilio-card-subtitle">Culture Canvas</span>
                              <h3 className="portfilio-card-title">
                                {oeuvre.titre}
                              </h3>
                              {oeuvre.description && (
                                <p className="portfolio-description" style={{ 
                                  color: '#666', 
                                  fontSize: '0.95rem',
                                  marginTop: '15px',
                                  lineHeight: '1.8'
                                }}>
                                  {oeuvre.description.substring(0, 300)}
                                  {oeuvre.description.length > 300 ? '...' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                        {/* Boutons d'action sous l'image */}
                        <div className="d-flex gap-2 mt-2">
                          <Link 
                            to={`/oeuvres/${oeuvre.id}/edit`} 
                            className="btn btn-sm flex-fill"
                            style={{ 
                              backgroundColor: '#6c757d',
                              borderColor: '#6c757d',
                              color: '#fff'
                            }}
                          >
                            <i className="fas fa-edit me-1"></i>
                            Modifier
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handlePredictClick(oeuvre)
                            }}
                            className="btn btn-sm flex-fill"
                            style={{
                              backgroundColor: '#0d6efd',
                              borderColor: '#0d6efd',
                              color: '#fff'
                            }}
                            disabled={predictingId === oeuvre.id}
                          >
                            <i className="fas fa-chart-line me-1"></i>
                            {predictingId === oeuvre.id ? 'Prédiction...' : 'Prédire popularité'}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.preventDefault()
                              handleDeleteClick(oeuvre.id)
                            }}
                            className="btn btn-sm flex-fill"
                            style={{ 
                              backgroundColor: '#dc3545',
                              borderColor: '#dc3545',
                              color: '#fff'
                            }}
                          >
                            <i className="fas fa-trash me-1"></i>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()
          )}
        </div>
      </div>
    </>
  )
}

export default MesOeuvres


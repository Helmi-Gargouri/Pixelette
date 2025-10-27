import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const OeuvresList = () => {
  const [oeuvres, setOeuvres] = useState([])
  const [filteredOeuvres, setFilteredOeuvres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [showShareMenu, setShowShareMenu] = useState(null)
  const { user, isAuthenticated } = useAuth()
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const MEDIA_BASE = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8000';
  useEffect(() => {
    fetchOeuvres()
  }, [])

  const fetchOeuvres = async () => {
    try {
      const response = await axios.get(`${API_BASE}/oeuvres/`, {
        withCredentials: true
      })
      // Afficher toutes les oeuvres (elles sont toutes publiques)
      setOeuvres(response.data)
      setFilteredOeuvres(response.data)
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

  // Fonction de partage
  const handleShare = (platform, oeuvre, event) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (platform !== 'copy') {
    axios.post(`${API_BASE}/partages/`, { 
      oeuvre_id: oeuvre.id, 
      plateforme: platform 
    }, { withCredentials: true }).catch(() => {})
   }
   
    const currentUrl = `${window.location.origin}/oeuvres/${oeuvre.id}`
    const shareTitle = oeuvre.titre
    const shareDescription = oeuvre.description ? oeuvre.description.substring(0, 200) : 'Découvrez cette œuvre sur Pixelette'
    const encodedUrl = encodeURIComponent(currentUrl)
    const encodedTitle = encodeURIComponent(shareTitle)
    const encodedDescription = encodeURIComponent(shareDescription)
    
    let url = ''
    
    switch (platform) {
      case 'facebook':
        // Facebook avec paramètres enrichis
        url = `https://www.facebook.com/sharer.php?u=${encodedUrl}&quote=${encodedTitle}&description=${encodedDescription}`
        break
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=Pixelette`
        break
      case 'linkedin':
        // LinkedIn avec titre et résumé
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}&source=Pixelette`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedTitle}%20-%20${encodedUrl}`
        break
      case 'copy':
        navigator.clipboard.writeText(currentUrl)
        setShowShareMenu(null)
        return
      default:
        return
    }
    
    // Ouvrir dans une popup centrée
    const width = 600
    const height = 600
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2
    window.open(url, '_blank', `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`)
    setShowShareMenu(null)
  }

  const toggleShareMenu = (oeuvreId, event) => {
    event.preventDefault()
    event.stopPropagation()
    setShowShareMenu(showShareMenu === oeuvreId ? null : oeuvreId)
    }

  if (loading) {
    return (
      <div className="preloader">
        <div className="preloader-inner">
          <img src="/assets/img/logo/logo.png" alt="Pixelette" style={{ maxHeight: '80px' }} />
          <span className="loader"></span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Oeuvres</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">OEUVRES</li>
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
                {isAuthenticated && (user?.role === 'artiste' || user?.role === 'admin') && (
                  <Link to="/mes-oeuvres" className="btn w-100" style={{ padding: '12px' }}>
                    <i className="fas fa-folder me-2"></i>Mes Oeuvres
                  </Link>
                )}
              </div>
                 <div className="col-lg-2 col-md-6">
                <Link to="/recommendations" className="btn w-100" style={{ padding: '12px' }}>
                  <i className="fas fa-lightbulb me-2"></i>Recommendations

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
              <p>{searchTerm ? 'Essayez avec d\'autres mots-clés' : 'Les oeuvres seront bientôt affichées ici.'}</p>
            </div>
           ) : (
            (() => {
              const { leftColumn, rightColumn } = distributeOeuvres(filteredOeuvres)
              
              return (
                <div className="row gx-4">
                  {/* Colonne de gauche */}
                  <div className="col-lg-6 col-md-6 col-12">
                    {leftColumn.map((oeuvre) => (
                      <div key={oeuvre.id} style={{ marginBottom: '30px', position: 'relative' }}>
                        <Link to={`/oeuvres/${oeuvre.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div className="portfolio-card-4" style={{ cursor: 'pointer' }}>
                            <div className="portfolio-thumb" style={{ position: 'relative' }}>
                       {oeuvre.image ? (
                         <img 
                        src={oeuvre.image.startsWith('http') 
  ? oeuvre.image 
  : `${MEDIA_BASE}${oeuvre.image}`
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
                              
                              {/* Bouton de partage en overlay */}
                              <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }}>
                                <button
                                  onClick={(e) => toggleShareMenu(oeuvre.id, e)}
                                  className="btn btn-sm"
                                  style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    color: 'var(--theme-color)'
                                  }}
                                  title="Partager"
                                >
                                  <i className="fas fa-share-alt"></i>
                                </button>
                                
                                {/* Menu de partage */}
                                {showShareMenu === oeuvre.id && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '50px',
                                    right: '0',
                                    backgroundColor: '#fff',
                                    borderRadius: '10px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                    padding: '10px',
                                    minWidth: '180px',
                                    zIndex: 1000
                                  }}>
                                    <button
                                      onClick={(e) => handleShare('facebook', oeuvre, e)}
                                      style={{
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: '#1877F2'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <i className="fab fa-facebook-f"></i>Facebook
                                    </button>
                                    <button
                                      onClick={(e) => handleShare('twitter', oeuvre, e)}
                                      style={{
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: '#1DA1F2'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <i className="fab fa-twitter"></i>Twitter
                                    </button>
                                    <button
                                      onClick={(e) => handleShare('linkedin', oeuvre, e)}
                                      style={{
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: '#0A66C2'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <i className="fab fa-linkedin-in"></i>LinkedIn
                                    </button>
                                    <button
                                      onClick={(e) => handleShare('whatsapp', oeuvre, e)}
                                      style={{
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: '#25D366'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <i className="fab fa-whatsapp"></i>WhatsApp
                                    </button>
                                    <hr style={{ margin: '5px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
                                    <button
                                      onClick={(e) => handleShare('copy', oeuvre, e)}
                           style={{ 
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: '#6c757d'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <i className="fas fa-link"></i>Copier le lien
                                    </button>
                         </div>
                       )}
                              </div>
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
                      </div>
                    ))}
                  </div>

                  {/* Colonne de droite */}
                  <div className="col-lg-6 col-md-6 col-12">
                    {rightColumn.map((oeuvre) => (
                      <div key={oeuvre.id} style={{ marginBottom: '30px', position: 'relative' }}>
                        <Link to={`/oeuvres/${oeuvre.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div className="portfolio-card-4" style={{ cursor: 'pointer' }}>
                            <div className="portfolio-thumb" style={{ position: 'relative' }}>
                              {oeuvre.image ? (
                                <img 
                              
                                  src={oeuvre.image.startsWith('http') 
  ? oeuvre.image 
  : `${MEDIA_BASE}${oeuvre.image}`
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
                              
                              {/* Bouton de partage en overlay */}
                              <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }}>
                                <button
                                  onClick={(e) => toggleShareMenu(oeuvre.id, e)}
                               className="btn btn-sm"
                               style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    color: 'var(--theme-color)'
                                  }}
                                  title="Partager"
                                >
                                  <i className="fas fa-share-alt"></i>
                                </button>
                                
                                {/* Menu de partage */}
                                {showShareMenu === oeuvre.id && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '50px',
                                    right: '0',
                                    backgroundColor: '#fff',
                                    borderRadius: '10px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                    padding: '10px',
                                    minWidth: '180px',
                                    zIndex: 1000
                                  }}>
                                    <button
                                      onClick={(e) => handleShare('facebook', oeuvre, e)}
                                      style={{
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: '#1877F2'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <i className="fab fa-facebook-f"></i>Facebook
                                    </button>
                                    <button
                                      onClick={(e) => handleShare('twitter', oeuvre, e)}
                                      style={{
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: '#1DA1F2'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <i className="fab fa-twitter"></i>Twitter
                                    </button>
                                    <button
                                      onClick={(e) => handleShare('linkedin', oeuvre, e)}
                                      style={{
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: '#0A66C2'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <i className="fab fa-linkedin-in"></i>LinkedIn
                                    </button>
                             <button 
                                      onClick={(e) => handleShare('whatsapp', oeuvre, e)}
                                      style={{
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: '#25D366'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <i className="fab fa-whatsapp"></i>WhatsApp
                                    </button>
                                    <hr style={{ margin: '5px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
                                    <button
                                      onClick={(e) => handleShare('copy', oeuvre, e)}
                               style={{ 
                                        width: '100%',
                                        padding: '10px 15px',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: '#6c757d'
                                      }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <i className="fas fa-link"></i>Copier le lien
                             </button>
                           </div>
                         )}
                       </div>
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

export default OeuvresList


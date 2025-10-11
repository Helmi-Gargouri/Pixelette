import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

const OeuvreDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [oeuvre, setOeuvre] = useState(null)
  const [auteur, setAuteur] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' })
  const [confirmModal, setConfirmModal] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [showCopySuccess, setShowCopySuccess] = useState(false)

  useEffect(() => {
    fetchOeuvre()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchOeuvre = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/oeuvres/${id}/`, {
        withCredentials: true
      })
      setOeuvre(response.data)
      
      // Fetch auteur details
      if (response.data.auteur) {
        const auteurResponse = await axios.get(
          `http://localhost:8000/api/utilisateurs/${response.data.auteur}/`,
          { withCredentials: true }
        )
        setAuteur(auteurResponse.data)
      }
      
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError('Erreur lors du chargement de l\'oeuvre')
      setLoading(false)
    }
  }

  const handleDeleteClick = () => {
    setConfirmModal(true)
  }

  const handleDeleteConfirm = async () => {
    setConfirmModal(false)

    try {
      await axios.delete(`http://localhost:8000/api/oeuvres/${id}/`, {
        withCredentials: true
      })
      setModal({ 
        show: true, 
        title: 'Succès !', 
        message: 'Oeuvre supprimée avec succès', 
        type: 'success' 
      })
    } catch (err) {
      console.error(err)
      setModal({ 
        show: true, 
        title: 'Erreur', 
        message: 'Erreur lors de la suppression', 
        type: 'error' 
      })
    }
  }

  const handleModalClose = () => {
    setModal({ ...modal, show: false })
    if (modal.type === 'success') {
      // Déterminer si l'utilisateur est propriétaire pour la redirection
      const isOwner = isAuthenticated && user?.id === oeuvre?.auteur
      navigate(isOwner ? '/mes-oeuvres' : '/oeuvres')
    }
  }

  // Fonctions de partage sur les réseaux sociaux
  const currentUrl = window.location.href
  const shareTitle = oeuvre?.titre || 'Découvrez cette œuvre'
  const shareDescription = oeuvre?.description || 'Une magnifique œuvre sur Pixelette'
  
  const handleShare = (platform) => {
    let url = ''
    const encodedUrl = encodeURIComponent(currentUrl)
    const encodedTitle = encodeURIComponent(shareTitle)
    const encodedDescription = encodeURIComponent(shareDescription)
    
    switch (platform) {
      case 'facebook':
        // Facebook Dialog avec tous les paramètres
        url = `https://www.facebook.com/dialog/share?app_id=YOUR_APP_ID&display=popup&href=${encodedUrl}&quote=${encodedTitle}`
        // Alternative plus simple qui fonctionne mieux
        url = `https://www.facebook.com/sharer.php?u=${encodedUrl}&quote=${encodedTitle}&description=${encodedDescription}`
        break
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=Pixelette`
        break
      case 'linkedin':
        // LinkedIn Share avec titre et résumé
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}&source=Pixelette`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedTitle}%20-%20${encodedUrl}`
        break
      case 'pinterest':
        const imageUrl = oeuvre?.image ? 
          (oeuvre.image.startsWith('http') ? oeuvre.image : `${window.location.origin}${oeuvre.image}`) : 
          ''
        url = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(imageUrl)}&description=${encodedTitle}%20-%20${encodedDescription}`
        break
      default:
        return
    }
    
    // Ouvrir dans une popup avec des dimensions optimales
    const width = 600
    const height = 600
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2
    window.open(url, '_blank', `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`)
  }
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setShowCopySuccess(true)
      setTimeout(() => setShowCopySuccess(false), 2000)
    })
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

  if (error || !oeuvre) {
    return (
      <>
        <Modal
          show={modal.show}
          onClose={handleModalClose}
          title={modal.title}
          message={modal.message}
          type={modal.type}
        />
        <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
          <div className="container">
            <div className="breadcumb-content">
              <h1 className="breadcumb-title">Erreur</h1>
            </div>
          </div>
        </div>
        <div className="space">
          <div className="container">
            <div className="text-center">
              <h3>{error || 'Oeuvre non trouvée'}</h3>
              <Link to={backLink} className="btn mt-3">{backLabel}</Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  const canEdit = isAuthenticated && (user?.id === oeuvre.auteur || user?.role === 'admin')
  
  // Déterminer le lien de retour selon si l'utilisateur est propriétaire
  const isOwner = isAuthenticated && user?.id === oeuvre?.auteur
  const backLink = isOwner ? '/mes-oeuvres' : '/oeuvres'
  const backLabel = isOwner ? 'Retour à mes oeuvres' : 'Retour aux oeuvres'

  return (
    <>
      <Modal
        show={modal.show}
        onClose={handleModalClose}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
      
      <ConfirmModal
        show={confirmModal}
        onClose={() => setConfirmModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette oeuvre ? Cette action est irréversible."
      />
      
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Détails de l'Oeuvre</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li><Link to="/oeuvres">OEUVRES</Link></li>
            <li className="active">DÉTAILS</li>
          </ul>
        </div>
      </div>

      {/* Portfolio Details Area */}
      <section className="portfolio-details-page space">
        <div className="container">
          <div className="row">
            <div className="col-xl-12">
              {/* Contrôles de visualisation */}
              <div className="d-flex justify-content-center gap-2 mb-3">
                <button 
                  className="btn btn-sm"
                  onClick={() => setRotation(prev => prev - 90)}
                  title="Rotation antihoraire"
                >
                  <i className="fas fa-undo"></i>
                </button>
                <button 
                  className="btn btn-sm"
                  onClick={() => setRotation(prev => prev + 90)}
                  title="Rotation horaire"
                >
                  <i className="fas fa-redo"></i>
                </button>
                <button 
                  className="btn btn-sm"
                  onClick={() => setRotation(0)}
                  title="Réinitialiser"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>

              <div className="portfolio-img" style={{ 
                position: 'relative', 
                borderRadius: '10px', 
                overflow: 'hidden',
                background: '#f0f0f0'
              }}>
               {oeuvre.image ? (
                  <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={4}
                    centerOnInit={true}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <>
                        {/* Contrôles de zoom */}
                        <div style={{
                          position: 'absolute',
                          top: '20px',
                          right: '20px',
                          zIndex: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          <button 
                            onClick={() => zoomIn()}
                            className="btn btn-sm"
                            style={{ 
                              backgroundColor: 'rgba(0,0,0,0.7)', 
                              borderColor: 'transparent', 
                              color: '#fff',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              padding: 0
                            }}
                            title="Zoom avant"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                          <button 
                            onClick={() => zoomOut()}
                            className="btn btn-sm"
                            style={{ 
                              backgroundColor: 'rgba(0,0,0,0.7)', 
                              borderColor: 'transparent', 
                              color: '#fff',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              padding: 0
                            }}
                            title="Zoom arrière"
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <button 
                            onClick={() => resetTransform()}
                            className="btn btn-sm"
                            style={{ 
                              backgroundColor: 'rgba(0,0,0,0.7)', 
                              borderColor: 'transparent', 
                              color: '#fff',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              padding: 0
                            }}
                            title="Réinitialiser zoom"
                          >
                            <i className="fas fa-compress"></i>
                          </button>
                        </div>

                        <TransformComponent
                          wrapperStyle={{
                            width: '100%',
                            height: '600px',
                            borderRadius: '10px'
                          }}
                          contentStyle={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <img 
                            src={oeuvre.image.startsWith('http') 
                              ? oeuvre.image 
                              : `http://localhost:8000${oeuvre.image}`
                            } 
                     alt={oeuvre.titre}
                            style={{ 
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              transform: `rotate(${rotation}deg)`,
                              transition: 'transform 0.3s ease',
                              cursor: 'grab'
                            }}
                     onError={(e) => {
                              e.target.onerror = null
                              e.target.src = '/assets/img/portfolio/portfolio_page1_3.png'
                     }}
                   />
                        </TransformComponent>
                      </>
                    )}
                  </TransformWrapper>
               ) : (
                <div 
                    className="w-100 d-flex align-items-center justify-content-center"
                    style={{ 
                      height: '400px', 
                      background: '#f0f0f0',
                      borderRadius: '10px'
                    }}
                >
                  <i className="fas fa-image fa-5x text-muted"></i>
                </div>
              )}
              </div>

              {/* Légende des contrôles */}
              <div className="text-center mt-3">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Utilisez la molette de la souris ou les boutons pour zoomer • Cliquez et glissez pour déplacer
                </small>
              </div>
                </div>

            <div className="col-xl-8">
              <div className="portfolio-details-wrap mt-40">
                <h2 className="fw-semibold mb-20">{oeuvre.titre}</h2>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#666' }}>
                    {oeuvre.description}
                  </p>

                {/* Actions pour l'auteur/admin */}
                 {canEdit && (
                  <>
                    <h3 className="fw-semibold mt-40 mb-20">Actions</h3>
                    <div className="d-flex gap-3">
                     <Link 
                       to={`/oeuvres/${id}/edit`} 
                       className="btn"
                       style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', color: '#fff' }}
                     >
                       <i className="fas fa-edit me-2"></i>
                        Modifier cette oeuvre
                     </Link>
                     <button 
                       onClick={handleDeleteClick} 
                       className="btn"
                        style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}
                     >
                       <i className="fas fa-trash me-2"></i>
                       Supprimer
                     </button>
                   </div>
                  </>
                 )}
              </div>
            </div>

            <div className="col-xl-4 sidebar-widget-area mt-50">
              <aside className="sidebar-sticky-area sidebar-area">
                <div className="widget widget-project-details">
                  <h3 className="widget_title">Informations sur l'Oeuvre</h3>
                  <ul>
                {auteur && (
                      <li>
                        <div className="icon"><i className="fas fa-user"></i></div>
                    <div className="media-body">
                          <span className="title">Artiste:</span>
                          <h6>{auteur.prenom} {auteur.nom}</h6>
                           </div>
                      </li>
                    )}
                    <li>
                      <div className="icon"><i className="fas fa-layer-group"></i></div>
                      <div className="media-body">
                        <span className="title">Catégorie:</span>
                        <h6>Oeuvre d'Art</h6>
                         </div>
                    </li>
                    <li>
                      <div className="icon"><i className="fas fa-calendar-alt"></i></div>
                      <div className="media-body">
                        <span className="title">Date de création:</span>
                        <h6>
                      {new Date(oeuvre.date_creation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                            year: 'numeric'
                      })}
                        </h6>
                      </div>
                    </li>
                    {auteur && auteur.email && (
                      <li>
                        <div className="icon"><i className="fas fa-envelope"></i></div>
                        <div className="media-body">
                          <span className="title">Contact:</span>
                          <h6>{auteur.email}</h6>
                        </div>
                    </li>
                    )}
                  </ul>

                  {/* Bouton retour */}
                  <div className="mt-4">
                    <Link to={backLink} className="btn w-100">
                      <i className="fas fa-arrow-left me-2"></i>
                      {backLabel}
                    </Link>
                  </div>
                </div>

                {/* Section de partage social */}
                <div className="widget widget-project-details mt-4">
                  <h3 className="widget_title">Partager cette œuvre</h3>
                  <div style={{ padding: '20px' }}>
                    {/* Boutons de réseaux sociaux */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '10px', 
                      flexWrap: 'wrap',
                      marginBottom: '15px'
                    }}>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="btn btn-sm"
                        style={{ 
                          backgroundColor: '#1877F2', 
                          borderColor: '#1877F2', 
                          color: '#fff',
                          flex: '1',
                          minWidth: '45%',
                          padding: '10px'
                        }}
                        title="Partager sur Facebook"
                      >
                        <i className="fab fa-facebook-f me-2"></i>Facebook
                      </button>
                      
                      <button
                        onClick={() => handleShare('twitter')}
                        className="btn btn-sm"
                        style={{ 
                          backgroundColor: '#1DA1F2', 
                          borderColor: '#1DA1F2', 
                          color: '#fff',
                          flex: '1',
                          minWidth: '45%',
                          padding: '10px'
                        }}
                        title="Partager sur Twitter"
                      >
                        <i className="fab fa-twitter me-2"></i>Twitter
                      </button>
                      
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="btn btn-sm"
                        style={{ 
                          backgroundColor: '#0A66C2', 
                          borderColor: '#0A66C2', 
                          color: '#fff',
                          flex: '1',
                          minWidth: '45%',
                          padding: '10px'
                        }}
                        title="Partager sur LinkedIn"
                      >
                        <i className="fab fa-linkedin-in me-2"></i>LinkedIn
                      </button>
                      
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="btn btn-sm"
                        style={{ 
                          backgroundColor: '#25D366', 
                          borderColor: '#25D366', 
                          color: '#fff',
                          flex: '1',
                          minWidth: '45%',
                          padding: '10px'
                        }}
                        title="Partager sur WhatsApp"
                      >
                        <i className="fab fa-whatsapp me-2"></i>WhatsApp
                      </button>
                      
                      <button
                        onClick={() => handleShare('pinterest')}
                        className="btn btn-sm"
                        style={{ 
                          backgroundColor: '#E60023', 
                          borderColor: '#E60023', 
                          color: '#fff',
                          flex: '1',
                          minWidth: '100%',
                          padding: '10px'
                        }}
                        title="Partager sur Pinterest"
                      >
                        <i className="fab fa-pinterest-p me-2"></i>Pinterest
                      </button>
                    </div>

                    {/* Bouton copier le lien */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={handleCopyLink}
                        className="btn btn-sm w-100"
                        style={{ 
                          backgroundColor: '#6c757d', 
                          borderColor: '#6c757d', 
                          color: '#fff',
                          padding: '10px'
                        }}
                        title="Copier le lien"
                      >
                        <i className="fas fa-link me-2"></i>Copier le lien
                      </button>
                      
                      {showCopySuccess && (
                        <div style={{
                          position: 'absolute',
                          top: '-40px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#28a745',
                          color: '#fff',
                          padding: '8px 15px',
                          borderRadius: '5px',
                          fontSize: '0.9rem',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          animation: 'fadeIn 0.3s'
                        }}>
                          <i className="fas fa-check me-2"></i>Lien copié !
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default OeuvreDetails


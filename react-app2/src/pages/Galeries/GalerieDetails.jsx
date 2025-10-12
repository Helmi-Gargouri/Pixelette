import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'
import OeuvreModal from '../../components/OeuvreModal'
import InviteModal from '../../components/InviteModal'
import SpotifyModal from '../../components/SpotifyModal'
import ColorPaletteModal from '../../components/ColorPaletteModal'

const GalerieDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [galerie, setGalerie] = useState(null)
  const [proprietaire, setProprietaire] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' })
  const [confirmModal, setConfirmModal] = useState(false)
  const [oeuvreModal, setOeuvreModal] = useState({ show: false, oeuvre: null })
  const [inviteModal, setInviteModal] = useState(false)
  const [spotifyModal, setSpotifyModal] = useState({ show: false, playlist: null, loading: false })
  const [paletteModal, setPaletteModal] = useState({ show: false, data: null, loading: false })

  useEffect(() => {
    fetchGalerie()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchGalerie = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/galeries/${id}/`, {
        withCredentials: true
      })
      setGalerie(response.data)
      setError(null)
      
      if (response.data.proprietaire) {
        const propResponse = await axios.get(
          `http://localhost:8000/api/utilisateurs/${response.data.proprietaire}/`,
          { withCredentials: true }
        )
        setProprietaire(propResponse.data)
      }

      setLoading(false)
    } catch (err) {
      console.error('Erreur détaillée:', err.response || err)
      const errorMessage = err.response?.data?.error || 'Erreur lors du chargement de la galerie'
      setError(errorMessage)
      setLoading(false)
    }
  }

  const handleDeleteClick = () => {
    setConfirmModal(true)
  }

  const handleDeleteConfirm = async () => {
    setConfirmModal(false)

    try {
      await axios.delete(`http://localhost:8000/api/galeries/${id}/`, {
        withCredentials: true
      })
      setModal({ 
        show: true, 
        title: 'Succès !', 
        message: 'Galerie supprimée avec succès', 
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
    // Ne redirige PAS après succès de création de playlist Spotify
    // Redirection uniquement pour suppression de galerie
    if (modal.type === 'success' && modal.title === 'Succès !' && modal.message.includes('supprimée')) {
      navigate(canEdit ? '/mes-galeries' : '/galeries')
    }
  }

  const handleGenerateSpotifyPlaylist = async () => {
    setSpotifyModal({ show: true, playlist: null, loading: true, created: false })

    try {
      const response = await axios.get(
        `http://localhost:8000/api/galeries/${id}/generate_spotify_playlist/`,
        { withCredentials: true }
      )
      
      if (response.data.success) {
        setSpotifyModal({ show: true, playlist: response.data, loading: false, created: false })
      } else {
        setSpotifyModal({ show: false, playlist: null, loading: false, created: false })
        setModal({
          show: true,
          title: 'Erreur',
          message: response.data.error || 'Impossible de générer la playlist',
          type: 'error'
        })
      }
    } catch (err) {
      console.error(err)
      setSpotifyModal({ show: false, playlist: null, loading: false, created: false })
      
      setModal({
        show: true,
        title: 'Configuration Spotify requise',
        message: err.response?.data?.error || 'Erreur lors de la génération de la playlist',
        type: 'error'
      })
    }
  }

  const handleCreatePlaylistInSpotify = async () => {
    if (!spotifyModal.playlist || !spotifyModal.playlist.tracks) {
      return
    }

    try {
      // Obtient l'URL d'autorisation Spotify
      const authResponse = await axios.get(
        `http://localhost:8000/api/spotify/auth-url/?galerie_id=${id}`,
        { withCredentials: true }
      )

      // Stocke les track URIs dans le localStorage pour les récupérer après OAuth
      const trackUris = spotifyModal.playlist.tracks.map(t => t.uri)
      localStorage.setItem('spotify_pending_tracks', JSON.stringify(trackUris))
      localStorage.setItem('spotify_pending_galerie_id', id)

      // Redirige vers Spotify pour l'autorisation
      window.location.href = authResponse.data.auth_url
    } catch (err) {
      console.error(err)
      setModal({
        show: true,
        title: 'Erreur',
        message: 'Impossible de se connecter à Spotify',
        type: 'error'
      })
    }
  }

  // Vérifie si on revient du callback Spotify avec un token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const spotifyToken = urlParams.get('spotify_token')
    
    if (spotifyToken) {
      const trackUris = JSON.parse(localStorage.getItem('spotify_pending_tracks') || '[]')
      const galerieId = localStorage.getItem('spotify_pending_galerie_id')
      
      if (trackUris.length > 0 && galerieId === id) {
        createPlaylistWithToken(spotifyToken, trackUris)
      }
      
      // Nettoie le localStorage et l'URL
      localStorage.removeItem('spotify_pending_tracks')
      localStorage.removeItem('spotify_pending_galerie_id')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createPlaylistWithToken = async (accessToken, trackUris) => {
    try {
      setSpotifyModal({ show: true, playlist: null, loading: true, created: false })
      
      const response = await axios.post(
        'http://localhost:8000/api/spotify/create-playlist/',
        {
          access_token: accessToken,
          galerie_id: id,
          track_uris: trackUris
        },
        { withCredentials: true }
      )

      if (response.data.success) {
        setSpotifyModal({ 
          show: true, 
          playlist: { ...response.data, playlistUrl: response.data.playlist_url }, 
          loading: false,
          created: true 
        })
        
        // Ne pas afficher le modal général, le modal Spotify affiche déjà le succès
      }
    } catch (err) {
      console.error(err)
      setSpotifyModal({ show: false, playlist: null, loading: false, created: false })
      setModal({
        show: true,
        title: 'Erreur',
        message: 'Erreur lors de la création de la playlist',
        type: 'error'
      })
    }
  }

  const handleAnalyzePalette = async () => {
    setPaletteModal({ show: true, data: null, loading: true })

    try {
      const response = await axios.get(
        `http://localhost:8000/api/galeries/${id}/palette/`,
        { withCredentials: true }
      )
      
      setPaletteModal({ show: true, data: response.data, loading: false })
    } catch (err) {
      console.error(err)
      setPaletteModal({ show: false, data: null, loading: false })
      setModal({
        show: true,
        title: 'Erreur',
        message: err.response?.data?.error || 'Erreur lors de l\'analyse de la palette',
        type: 'error'
      })
    }
  }

  if (loading) {
    return (
      <div className="preloader">
        <div className="preloader-inner">
          <span className="loader"></span>
        </div>
      </div>
    )
  }

  if (error || !galerie) {
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
              <h3>{error || 'Galerie non trouvée'}</h3>
              <Link to="/galeries" className="btn mt-3">Retour aux galeries</Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  const canEdit = isAuthenticated && (user?.id === galerie.proprietaire || user?.role === 'admin')

  return (
    <>
      <style>
        {`
          .breadcumb-wrapper[data-bg-src] {
            background-image: url('/assets/img/bg/breadcrumb-bg.png');
            background-size: cover;
            background-position: center;
            position: relative;
            z-index: 10;
          }

          .portfolio-card-5 {
            position: relative;
            overflow: hidden;
            border-radius: 15px;
            margin-bottom: 60px;
          }

          .portfolio-thumb {
            position: relative;
            overflow: hidden;
            border-radius: 15px;
          }

          .portfolio-thumb img {
            width: 100%;
            height: 500px;
            object-fit: cover;
            transition: all 0.5s ease;
            border-radius: 15px;
          }

          .portfolio-card-5:hover .portfolio-thumb img {
            transform: scale(1.05);
          }

          .portfolio-details {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
            padding: 40px 30px 30px;
            color: white;
            transform: translateY(100%);
            transition: all 0.5s ease;
            border-radius: 0 0 15px 15px;
          }

          .portfolio-card-5:hover .portfolio-details {
            transform: translateY(0);
          }

          .portfilio-card-subtitle {
            font-size: 14px;
            font-weight: 500;
            color: #ffd700;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
            display: block;
          }

          .portfilio-card-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 0;
          }

          .portfilio-card-title a {
            color: white;
            text-decoration: none;
          }

          .portfilio-card-title a:hover {
            color: #ffd700;
          }

          .gallery-header {
            text-align: center;
            margin-bottom: 60px;
            position: relative;
            z-index: 1;
          }

          .gallery-title {
            font-size: 3.5rem;
            font-weight: 800;
            color: #333;
            margin-bottom: 30px;
          }

          .gallery-meta-container {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin-bottom: 25px;
            flex-wrap: wrap;
          }

          .gallery-meta-badge {
            font-size: 0.95rem;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .gallery-description-box {
            background: #f8f9fa;
            padding: 40px;
            border-radius: 15px;
            margin-bottom: 60px;
            text-align: center;
          }

          .gallery-description {
            font-size: 1.2rem;
            line-height: 1.8;
            color: #666;
            font-style: italic;
            margin: 0;
          }

          .empty-gallery {
            text-align: center;
            padding: 80px 20px;
            background: #f8f9fa;
            border-radius: 15px;
            border: 2px dashed #dee2e6;
          }

          .empty-gallery i {
            font-size: 4rem;
            color: #6c757d;
            margin-bottom: 20px;
          }

          .gallery-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 40px;
            flex-wrap: wrap;
          }

          .action-btn {
            padding: 12px 25px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .action-btn.primary {
            background: #667eea;
            color: white;
            border: none;
          }

          .action-btn.secondary {
            background: #6c757d;
            color: white;
            border: none;
          }

          .action-btn.danger {
            background: #dc3545;
            color: white;
            border: none;
          }

          .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }

          @media (max-width: 768px) {
            .gallery-title {
              font-size: 2.5rem;
            }

            .gallery-meta-container {
              flex-direction: column;
              gap: 15px;
            }

            .portfolio-thumb img {
              height: 400px;
            }

            .portfolio-details {
              padding: 20px 15px 15px;
            }

            .portfilio-card-title {
              font-size: 20px;
            }

            .gallery-actions {
              flex-direction: column;
              align-items: center;
            }

            .action-btn {
              width: 200px;
              justify-content: center;
            }
          }
        `}
      </style>

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
        message="Êtes-vous sûr de vouloir supprimer cette galerie ? Cette action est irréversible."
      />
      
      <OeuvreModal
        show={oeuvreModal.show}
        onClose={() => setOeuvreModal({ show: false, oeuvre: null })}
        oeuvre={oeuvreModal.oeuvre}
        auteur={proprietaire}
      />
      
      <InviteModal
        show={inviteModal}
        onClose={() => setInviteModal(false)}
        galerieId={id}
        galerieName={galerie?.nom || ''}
      />

      <SpotifyModal
        show={spotifyModal.show}
        onClose={() => setSpotifyModal({ show: false, playlist: null, loading: false, created: false })}
        playlist={spotifyModal.playlist}
        loading={spotifyModal.loading}
        created={spotifyModal.created}
        onCreatePlaylist={handleCreatePlaylistInSpotify}
      />

      <ColorPaletteModal
        show={paletteModal.show}
        onClose={() => setPaletteModal({ show: false, data: null, loading: false })}
        paletteData={paletteModal.data}
        loading={paletteModal.loading}
      />

      {/* Breadcrumb identique à project-2.html */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Détails de la Galerie</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">ACCUEIL</Link></li>
            <li><Link to="/galeries">GALERIES</Link></li>
            <li className="active">{galerie.nom}</li>
          </ul>
        </div>
      </div>

      {/* Portfolio Area avec design de project-2.html */}
      <div className="portfolio-standard-area space overflow-hidden">
        <div className="container">
          {/* Header de la galerie */}
          <div className="gallery-header">
            <h1 className="gallery-title">{galerie.nom}</h1>

            {/* Badges bien positionnés au centre */}
            <div className="gallery-meta-container">
              <span className={`gallery-meta-badge ${galerie.privee ? 'bg-warning text-dark' : 'bg-success text-white'}`}>
                <i className={`fas ${galerie.privee ? 'fa-lock' : 'fa-globe'}`}></i>
                {galerie.privee ? 'Privée' : 'Publique'}
              </span>
              
              {galerie.theme && (
                <span className="gallery-meta-badge bg-info text-white">
                  <i className="fas fa-tag"></i>
                  {galerie.theme}
                </span>
              )}
              
              <span className="gallery-meta-badge bg-secondary text-white">
                <i className="fas fa-images"></i>
                {galerie.oeuvres_count || 0} œuvre{galerie.oeuvres_count !== 1 ? 's' : ''}
              </span>
            </div>

            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: 0 }}>
              Créée le {new Date(galerie.date_creation).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
              {proprietaire && (
                <span> par <strong>{proprietaire.prenom} {proprietaire.nom}</strong></span>
              )}
            </p>
          </div>

          {/* Description */}
          {galerie.description && (
            <div className="gallery-description-box">
              <p className="gallery-description">
                "{galerie.description}"
              </p>
            </div>
          )}

          {/* Oeuvres avec design portfolio on hover */}
          {galerie.oeuvres_list && galerie.oeuvres_list.length > 0 ? (
            <div className="row gx-60 gy-60 justify-content-center">
              {galerie.oeuvres_list.map((oeuvre) => (
                <div key={oeuvre.id} className="col-lg-6">
                  <div className="portfolio-card-5">
                    <div className="portfolio-thumb">
                      {oeuvre.image ? (
                        <img
                          src={oeuvre.image}
                          alt={oeuvre.titre}
                          onClick={() => setOeuvreModal({ show: true, oeuvre })}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <div 
                          className="d-flex align-items-center justify-content-center"
                          style={{
                            width: '100%',
                            height: '500px',
                            background: '#f0f0f0',
                            cursor: 'pointer'
                          }}
                          onClick={() => setOeuvreModal({ show: true, oeuvre })}
                        >
                          <i className="fas fa-image fa-4x text-muted"></i>
                        </div>
                      )}
                    </div>
                    <div className="portfolio-details">
                      <span className="portfilio-card-subtitle">
                        {galerie.theme || 'Art'}
                      </span>
                      <h3 className="portfilio-card-title">
                        <a 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setOeuvreModal({ show: true, oeuvre })
                          }}
                        >
                          {oeuvre.titre}
                        </a>
                      </h3>
                      {oeuvre.description && (
                        <p style={{ 
                          color: '#ccc', 
                          marginTop: '10px',
                          fontSize: '0.9rem',
                          lineHeight: '1.4'
                        }}>
                          {oeuvre.description.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-gallery">
              <i className="fas fa-images"></i>
              <h3 className="text-muted mb-3">Cette galerie ne contient aucune œuvre</h3>
              <p className="text-muted mb-4">
                {canEdit 
                  ? "Commencez par ajouter des œuvres à votre galerie !" 
                  : "Cette galerie n'a pas encore d'œuvres exposées."
                }
              </p>
              {canEdit && (
                <Link to={`/galeries/${id}/oeuvres`} className="btn btn-primary">
                  
                  + Ajouter des œuvres
                </Link>
              )}
            </div>
          )}

          {/* Spotify Button - Available for everyone */}
          <div className="gallery-actions" style={{ marginTop: canEdit ? '20px' : '40px' }}>
            <button
              onClick={handleGenerateSpotifyPlaylist}
              className="btn"
              style={{ 
                backgroundColor: '#1db954', 
                borderColor: '#1db954', 
                color: '#fff'
              }}
              title="Générer une playlist Spotify basée sur le thème de cette galerie"
            >
              <i className="fab fa-spotify me-2"></i>
              Générer une Playlist Spotify
            </button>
          </div>

          {/* Actions - Owner Only */}
          {canEdit && (
            <div className="gallery-actions">
              <button
                onClick={handleAnalyzePalette}
                className="btn"
                style={{ 
                  backgroundColor: '#667eea', 
                  borderColor: '#667eea', 
                  color: '#fff'
                }}
                title="Analyser la palette de couleurs de cette galerie"
              >
                <i className="fas fa-palette me-2"></i>
                Analyser la Palette
              </button>
              
              <Link 
                to={`/galeries/${id}/oeuvres`} 
                className="btn"
              >
                <i className="fas fa-cog me-2"></i>
                Gérer les œuvres
              </Link>
              
              {galerie.privee && (
                <button
                  onClick={() => setInviteModal(true)}
                  className="btn"
                  style={{ backgroundColor: '#17a2b8', borderColor: '#17a2b8', color: '#fff' }}
                  title="Inviter des utilisateurs à cette galerie privée"
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Inviter
                </button>
              )}
              
              <Link
                to={`/galeries/${id}/edit`}
                className="btn"
                style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', color: '#fff' }}
              >
                <i className="fas fa-edit me-2"></i>
                Modifier la galerie
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
          )}
        </div>
      </div>
    </>
  )
}

export default GalerieDetails
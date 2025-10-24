import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const SpotifyModal = ({ show, onClose, playlist, loading, created, onCreatePlaylist }) => {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [show])

  if (!show) return null

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999999
      }}
      onClick={onClose}
    >
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          borderRadius: '10px',
          padding: '30px',
          maxWidth: '900px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          zIndex: 10000000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '25px',
          paddingBottom: '15px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <h2 style={{ 
            color: '#333',
            fontSize: '1.8rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: 0
          }}>
            <i className="fab fa-spotify" style={{ color: '#1db954' }}></i>
            Playlist Spotify
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: '#f0f0f0',
              border: 'none',
              color: '#333',
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.target.style.background = '#e0e0e0'}
            onMouseOut={(e) => e.target.style.background = '#f0f0f0'}
          >
            ×
          </button>
        </div>

        {/* Contenu */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#1db954' }}></i>
            <p style={{ color: '#333', marginTop: '20px', fontSize: '1.1rem' }}>
              {created ? 'Création de la playlist...' : 'Génération des recommandations...'}
            </p>
          </div>
        ) : created ? (
          <>
            <div style={{
              background: '#e8f5e9',
              border: '1px solid #4caf50',
              color: '#2e7d32',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <i className="fas fa-check-circle" style={{ fontSize: '3rem', marginBottom: '15px' }}></i>
              <h3>Playlist créée avec succès !</h3>
              <p>Votre playlist "{playlist?.playlist_name}" a été ajoutée à votre bibliothèque Spotify</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <a 
                href={playlist?.playlistUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn"
                style={{
                  background: '#1db954',
                  color: 'white',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '200px',
                  justifyContent: 'center'
                }}
              >
                <i className="fab fa-spotify"></i>
                Ouvrir dans Spotify
              </a>
            </div>
          </>
        ) : playlist ? (
          <>
            <div style={{
              background: '#f9f9f9',
              padding: '18px',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#333',
              border: '1px solid #f0f0f0'
            }}>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                <strong style={{ color: '#1db954' }}>Playlist:</strong> {playlist.playlist_name}
              </p>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                <strong style={{ color: '#1db954' }}>Thème:</strong> {playlist.theme}
              </p>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                <strong style={{ color: '#1db954' }}>Genres:</strong> {playlist.genres_used?.join(', ')}
              </p>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                <strong style={{ color: '#1db954' }}>Nombre de titres:</strong> {playlist.tracks_count || 0}
              </p>
            </div>

            <div style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto' }}>
              {playlist.tracks && playlist.tracks.map((track, index) => (
                <div 
                  key={track.id || index} 
                  style={{
                    background: '#f9f9f9',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    border: '1px solid #f0f0f0',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f0f0f0'
                    e.currentTarget.style.borderColor = '#e0e0e0'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f9f9f9'
                    e.currentTarget.style.borderColor = '#f0f0f0'
                  }}
                >
                  {track.image && (
                    <img 
                      src={track.image} 
                      alt={track.name} 
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: '#333',
                      fontWeight: '600',
                      marginBottom: '3px',
                      fontSize: '0.95rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {index + 1}. {track.name}
                    </div>
                    <div style={{
                      color: '#666',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {track.artist}
                    </div>
                  </div>
                  <a 
                    href={track.external_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      background: '#1db954',
                      color: 'white',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      flexShrink: 0,
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#1ed760'}
                    onMouseOut={(e) => e.target.style.background = '#1db954'}
                  >
                    <i className="fab fa-spotify"></i> Écouter
                  </a>
                </div>
              ))}
            </div>

            <button 
              onClick={onCreatePlaylist}
              className="btn"
              style={{
                background: '#1db954',
                color: 'white',
                border: 'none',
                width: '100%',
                marginTop: '15px',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="fab fa-spotify"></i>
              Créer cette Playlist dans mon Spotify
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Aucune playlist disponible</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default SpotifyModal


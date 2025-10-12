import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const ColorPaletteModal = ({ show, onClose, paletteData, loading }) => {
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
          maxWidth: '800px',
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
            <i className="fas fa-palette" style={{ color: '#667eea' }}></i>
            Analyse de Palette de Couleurs
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
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#667eea' }}></i>
            <p style={{ color: '#333', marginTop: '20px', fontSize: '1.1rem' }}>
              Analyse des couleurs en cours...
            </p>
          </div>
        ) : paletteData && paletteData.dominant_colors ? (
          <>
            {/* Couleurs dominantes */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                fontSize: '1.3rem', 
                fontWeight: '600', 
                color: '#333', 
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-fill-drip" style={{ color: '#667eea' }}></i>
                Couleurs Dominantes
              </h3>
              <div style={{ 
                display: 'flex', 
                gap: '15px', 
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {paletteData.dominant_colors.map((color, index) => (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <div 
                      style={{
                        width: '100px',
                        height: '100px',
                        backgroundColor: color.hex,
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        marginBottom: '10px',
                        border: '3px solid #fff',
                        cursor: 'pointer',
                        transition: 'transform 0.3s'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      title={`${color.hex} - ${(color.percent * 100).toFixed(1)}%`}
                    />
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>
                      {color.hex}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {(color.percent * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Harmonies */}
            {paletteData.harmonies && (
              <div>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '600', 
                  color: '#333', 
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fas fa-swatchbook" style={{ color: '#667eea' }}></i>
                  Harmonies Suggérées
                </h3>

                {/* Harmonie Analogique */}
                {paletteData.harmonies.analogique && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      fontSize: '1.1rem', 
                      color: '#555', 
                      marginBottom: '10px',
                      fontWeight: '500'
                    }}>
                       Analogique
                    </h4>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {paletteData.harmonies.analogique.map((color, index) => (
                        <div 
                          key={index}
                          style={{
                            flex: 1,
                            height: '60px',
                            backgroundColor: color,
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: index === 0 ? '#fff' : '#333',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            border: '2px solid #fff'
                          }}
                        >
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Harmonie Complémentaire */}
                {paletteData.harmonies.complementaire && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      fontSize: '1.1rem', 
                      color: '#555', 
                      marginBottom: '10px',
                      fontWeight: '500'
                    }}>
                       Complémentaire
                    </h4>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {paletteData.harmonies.complementaire.map((color, index) => (
                        <div 
                          key={index}
                          style={{
                            flex: 1,
                            height: '60px',
                            backgroundColor: color,
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            border: '2px solid #fff'
                          }}
                        >
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Harmonie Triadique */}
                {paletteData.harmonies.triadique && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      fontSize: '1.1rem', 
                      color: '#555', 
                      marginBottom: '10px',
                      fontWeight: '500'
                    }}>
                     Triadique
                    </h4>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {paletteData.harmonies.triadique.map((color, index) => (
                        <div 
                          key={index}
                          style={{
                            flex: 1,
                            height: '60px',
                            backgroundColor: color,
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            border: '2px solid #fff'
                          }}
                        >
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div style={{
              background: '#f9f9f9',
              padding: '15px',
              borderRadius: '8px',
              marginTop: '20px',
              fontSize: '0.9rem',
              color: '#666',
              border: '1px solid #f0f0f0'
            }}>
              <i className="fas fa-info-circle me-2" style={{ color: '#667eea' }}></i>
              Ces harmonies sont générées automatiquement à partir des couleurs dominantes de vos œuvres. 
              Utilisez-les pour créer des galeries visuellement cohérentes.
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <i className="fas fa-images" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '15px' }}></i>
            <p>Aucune donnée de palette disponible</p>
            <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
              Assurez-vous que la galerie contient des œuvres avec des images.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default ColorPaletteModal


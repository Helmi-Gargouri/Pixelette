import { createPortal } from 'react-dom'

const PredictionModal = ({ show, onClose, oeuvre, data }) => {
  if (!show) return null

  const predicted = data?.predicted_views
  const confidence = data?.confidence
  const tips = data?.tips || []
  const aiAdvice = data?.ai_advice
const MEDIA_BASE = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8000';
  // Calculate confidence level for styling
  const getConfidenceLevel = (conf) => {
    if (conf >= 80) return { level: 'Élevée', color: '#10b981', bg: '#dcfce7' }
    if (conf >= 60) return { level: 'Modérée', color: '#f59e0b', bg: '#fef3c7' }
    return { level: 'Faible', color: '#ef4444', bg: '#fecaca' }
  }

  const confidenceInfo = confidence !== undefined ? getConfidenceLevel(confidence) : null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(800px, 100%)',
          background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '8px' 
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px'
              }}>
                🔮
              </div>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}>
                  Analyse de Popularité
                </h3>
                <div style={{ 
                  color: '#64748b', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Prédiction basée sur l'IA
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              border: 'none', 
              background: '#f1f5f9',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#64748b',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#e2e8f0'
              e.target.style.color = '#475569'
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#f1f5f9'
              e.target.style.color = '#64748b'
            }}
          >
            ✕
          </button>
        </div>

        {/* Artwork Info */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {oeuvre?.image && (
              <img 
               src={oeuvre.image.startsWith('http') 
                    ? oeuvre.image 
                    : `${MEDIA_BASE}${oeuvre.image}`
                  }
                alt={oeuvre.titre}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: '3px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            )}
            <div>
              <h4 style={{ 
                margin: '0 0 4px 0', 
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                {oeuvre?.titre || 'Œuvre sans titre'}
              </h4>
              <div style={{ 
                color: '#64748b', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🎨</span>
                <span>{oeuvre?.auteur || 'Artiste inconnu'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '16px', 
          marginBottom: '28px' 
        }}>
          {/* Predicted Views */}
          <div style={{ 
            padding: '24px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ 
                fontSize: '14px', 
                opacity: 0.9,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>👁️</span>
                Vues prévues
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '800',
                marginBottom: '4px'
              }}>
                {predicted !== undefined ? predicted.toLocaleString() : '—'}
              </div>
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.8
              }}>
                Estimation à 30 jours
              </div>
            </div>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }}></div>
          </div>

          {/* Confidence Score */}
          <div style={{ 
            padding: '24px',
            borderRadius: '16px',
            background: confidenceInfo?.bg || '#f8fafc',
            border: `2px solid ${confidenceInfo?.color || '#e2e8f0'}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ 
                fontSize: '14px', 
                color: confidenceInfo?.color || '#64748b',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600'
              }}>
                <span>📊</span>
                Niveau de confiance
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '800',
                color: confidenceInfo?.color || '#1e293b',
                marginBottom: '4px'
              }}>
                {confidence !== undefined ? `${confidence}%` : '—'}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: confidenceInfo?.color || '#64748b',
                fontWeight: '600'
              }}>
                {confidenceInfo?.level || 'Non disponible'}
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        {tips.length > 0 && (
          <div style={{ 
            marginBottom: '24px',
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h4 style={{ 
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: 'white'
              }}>💡</span>
              Conseils d'optimisation
            </h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {tips.map((tip, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f1f5f9'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f8fafc'
                    e.currentTarget.style.borderColor = '#f1f5f9'
                  }}
                >
                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '8px',
                    minWidth: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ 
                    color: '#374151',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    flex: 1
                  }}>
                    {tip}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Advice */}
        {aiAdvice && (
          <div style={{ 
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #fef7cd 0%, #fef3c7 100%)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #f59e0b'
          }}>
            <h4 style={{ 
              margin: '0 0 12px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: 'white'
              }}>🤖</span>
              Analyse IA Avancée
            </h4>
            <div style={{ 
              color: '#92400e',
              fontSize: '14px',
              lineHeight: '1.7',
              background: 'rgba(255,255,255,0.5)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              {aiAdvice}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px', 
          marginTop: '8px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '12px 24px',
              border: '1px solid #d1d5db',
              background: 'white',
              borderRadius: '10px',
              color: '#374151',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f9fafb'
              e.target.style.borderColor = '#9ca3af'
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white'
              e.target.style.borderColor = '#d1d5db'
            }}
          >
            Fermer
          </button>
          <button 
            onClick={() => {
              // Add functionality to save prediction or take action
              onClose()
            }}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            Appliquer les conseils
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PredictionModal
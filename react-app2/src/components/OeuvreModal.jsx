import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const OeuvreModal = ({ show, onClose, oeuvre, auteur }) => {
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

  if (!show || !oeuvre) return null

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
          borderRadius: '20px',
          maxWidth: '800px',
          width: '90%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 10000000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        {oeuvre.image ? (
          <div style={{ 
            position: 'relative',
            background: '#f0f0f0',
            borderRadius: '20px 20px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            maxHeight: '500px'
          }}>
            <img 
              src={oeuvre.image} 
              alt={oeuvre.titre}
              style={{ 
                width: '100%', 
                height: 'auto',
                maxHeight: '500px',
                objectFit: 'contain',
                borderRadius: '20px 20px 0 0'
              }}
            />
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.8)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.6)'}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        ) : (
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{ 
              height: '300px', 
              background: '#f0f0f0',
              borderRadius: '20px 20px 0 0',
              position: 'relative'
            }}
          >
            <i className="fas fa-image fa-5x text-muted"></i>
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(0,0,0,0.3)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '35px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '15px', color: '#333' }}>
            {oeuvre.titre}
          </h2>
          
          <div className="mb-3">
            <span style={{ color: '#999', fontSize: '0.95rem' }}>
              <i className="far fa-calendar me-2"></i>
              {new Date(oeuvre.date_creation).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            {auteur && (
              <span className="ms-3" style={{ color: '#999', fontSize: '0.95rem' }}>
                <i className="far fa-user me-2"></i>
                Par {auteur.prenom} {auteur.nom}
              </span>
            )}
          </div>

          <div style={{ 
            borderTop: '1px solid #e9ecef',
            paddingTop: '20px',
            marginTop: '20px'
          }}>
            <h5 style={{ marginBottom: '15px', fontSize: '1.1rem', fontWeight: '600' }}>Description</h5>
            <p style={{ 
              fontSize: '1.05rem', 
              lineHeight: '1.8', 
              color: '#666',
              marginBottom: '20px'
            }}>
              {oeuvre.description}
            </p>
          </div>

          {/* Bouton voir les détails */}
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <a 
              href={`/oeuvres/${oeuvre.id}`}
              className="btn"
              style={{
                padding: '12px 30px',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '10px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onClick={() => {
                window.location.href = `/oeuvres/${oeuvre.id}`
              }}
            >
              <i className="fas fa-eye"></i>
              Voir les détails complets
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default OeuvreModal

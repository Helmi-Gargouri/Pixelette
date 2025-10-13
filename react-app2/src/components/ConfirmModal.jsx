import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const ConfirmModal = ({ show, onClose, onConfirm, title, message }) => {
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
          maxWidth: '450px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 10000000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '20px' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '3.5rem', color: '#ff6b6b' }}></i>
        </div>
        <h3 style={{ marginBottom: '15px', fontSize: '1.5rem', fontWeight: '600' }}>{title}</h3>
        <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={onClose}
            className="btn btn-outline-secondary"
            style={{ minWidth: '120px' }}
          >
            Annuler
          </button>
          <button 
            onClick={onConfirm}
            className="btn"
            style={{ 
              minWidth: '120px',
              backgroundColor: '#8b0000',
              borderColor: '#8b0000'
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmModal

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const Modal = ({ show, onClose, title, message, type = 'success' }) => {
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

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#28a745' }}></i>
      case 'error':
        return <i className="fas fa-times-circle" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
      case 'warning':
        return <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#ffc107' }}></i>
      default:
        return <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#28a745' }}></i>
    }
  }

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
          maxWidth: '400px',
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
          {getIcon()}
        </div>
        <h3 style={{ marginBottom: '10px', fontSize: '1.5rem' }}>{title}</h3>
        <p style={{ color: '#666', marginBottom: '25px' }}>{message}</p>
        <button 
          onClick={onClose}
          className="btn"
          style={{ minWidth: '120px' }}
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  )
}

export default Modal

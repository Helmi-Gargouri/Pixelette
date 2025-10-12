import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'

const InviteModal = ({ show, onClose, galerieId, galerieName }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState({ show: false, text: '', type: 'success' })

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
      fetchUsers()
    } else {
      document.body.style.overflow = 'unset'
      setSelectedUser(null)
      setSearchTerm('')
      setMessage({ show: false, text: '', type: 'success' })
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [show])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/utilisateurs/', {
        withCredentials: true
      })
      setUsers(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err)
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendInvite = async () => {
    if (!selectedUser) return

    setSending(true)
    try {
      await axios.post(
        `http://localhost:8000/api/galeries/${galerieId}/invite/`,
        { user_id: selectedUser.id },
        { withCredentials: true }
      )
      
      setMessage({
        show: true,
        text: `Invitation envoyée à ${selectedUser.prenom} ${selectedUser.nom}`,
        type: 'success'
      })
      
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setMessage({
        show: true,
        text: err.response?.data?.error || 'Erreur lors de l\'envoi de l\'invitation',
        type: 'error'
      })
    } finally {
      setSending(false)
    }
  }

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
          borderRadius: '20px',
          maxWidth: '650px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 10000000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec design moderne */}
        <div style={{
          padding: '35px 40px 30px',
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          borderBottom: '3px solid var(--theme-color, #667eea)',
          position: 'relative'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div className="btn" style={{
              width: '55px',
              height: '55px',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              color: '#fff',
              padding: '0',
              flexShrink: 0
            }}>
              <i className="fas fa-user-plus"></i>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.8rem', 
                fontWeight: '700',
                color: '#333',
                letterSpacing: '-0.5px'
              }}>
                Inviter à la galerie
              </h3>
              <p className="btn" style={{ 
                margin: '5px 0 0 0', 
                fontSize: '1rem',
                fontWeight: '600',
                padding: '5px 15px',
                display: 'inline-block',
                borderRadius: '8px'
              }}>
                {galerieName}
              </p>
            </div>
            
            {/* Bouton fermer */}
            <button
              onClick={onClose}
              style={{
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: '#666',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e0e0e0'
                e.target.style.color = '#333'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f0f0f0'
                e.target.style.color = '#666'
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '35px 40px' }}>
          {/* Message de feedback */}
          {message.show && (
            <div style={{
              padding: '15px 20px',
              borderRadius: '12px',
              marginBottom: '25px',
              background: message.type === 'success' 
                ? '#d4edda' 
                : '#f8d7da',
              color: message.type === 'success' ? '#155724' : '#721c24',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: message.type === 'success' ? '#28a745' : '#dc3545',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <i className={`fas ${message.type === 'success' ? 'fa-check' : 'fa-exclamation'}`}></i>
              </div>
              {message.text}
            </div>
          )}

          {/* Barre de recherche stylisée */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px', 
              fontWeight: '600',
              color: '#333',
              fontSize: '1rem'
            }}>
              <i className="fas fa-search me-2" style={{ color: 'var(--theme-color)' }}></i>
              Rechercher un utilisateur
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Nom, prénom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 20px 14px 50px',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.3s',
                  boxSizing: 'border-box',
                  background: '#f8f9fa'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--theme-color)'
                  e.target.style.background = '#fff'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e9ecef'
                  e.target.style.background = '#f8f9fa'
                }}
              />
              <i className="fas fa-search" style={{
                position: 'absolute',
                left: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999',
                fontSize: '1rem'
              }}></i>
            </div>
          </div>

          {/* Liste des utilisateurs avec design moderne */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px', 
              fontWeight: '600',
              color: '#333',
              fontSize: '1rem'
            }}>
              <i className="fas fa-users me-2" style={{ color: 'var(--theme-color)' }}></i>
              Sélectionner un utilisateur 
              <span style={{ 
                marginLeft: '8px',
                padding: '2px 10px',
                background: 'var(--theme-color)',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {filteredUsers.length}
              </span>
            </label>
            <div style={{
              maxHeight: '320px',
              overflowY: 'auto',
              border: '2px solid #e9ecef',
              borderRadius: '12px',
              background: '#fff'
            }}>
              {loading ? (
                <div style={{ padding: '50px', textAlign: 'center', color: '#999' }}>
                  <i className="fas fa-spinner fa-spin fa-3x mb-3" style={{ color: 'var(--theme-color)' }}></i>
                  <p style={{ marginTop: '15px', fontSize: '1rem' }}>Chargement des utilisateurs...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: '50px', textAlign: 'center', color: '#999' }}>
                  <i className="fas fa-users-slash fa-3x mb-3"></i>
                  <p style={{ marginTop: '15px', fontSize: '1rem', fontWeight: '500' }}>Aucun utilisateur trouvé</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Essayez une autre recherche</p>
                </div>
              ) : (
                filteredUsers.map((user, index) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    style={{
                      padding: '18px 20px',
                      cursor: 'pointer',
                      background: selectedUser?.id === user.id 
                        ? 'var(--theme-color, #667eea)' 
                        : '#fff',
                      color: selectedUser?.id === user.id ? '#fff' : '#333',
                      borderBottom: index === filteredUsers.length - 1 ? 'none' : '1px solid #f0f0f0',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      borderRadius: selectedUser?.id === user.id ? '8px' : '0'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedUser?.id !== user.id) {
                        e.currentTarget.style.background = '#f8f9fa'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedUser?.id !== user.id) {
                        e.currentTarget.style.background = '#fff'
                      }
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: selectedUser?.id === user.id 
                        ? '#fff' 
                        : '#f0f0f0',
                      color: 'var(--theme-color, #667eea)',
                      border: selectedUser?.id === user.id ? '2px solid #fff' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      fontWeight: '700',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)'
                    }}>
                      {user.prenom?.[0]?.toUpperCase()}{user.nom?.[0]?.toUpperCase()}
                    </div>
                    
                    {/* Infos utilisateur */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        marginBottom: '3px',
                        fontSize: '1rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {user.prenom} {user.nom}
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        opacity: selectedUser?.id === user.id ? 0.95 : 0.65,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        <i className="fas fa-envelope me-1" style={{ fontSize: '0.8rem' }}></i>
                        {user.email}
                      </div>
                    </div>
                    
                    {/* Indicateur de sélection */}
                    {selectedUser?.id === user.id && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem'
                      }}>
                        <i className="fas fa-check"></i>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer avec boutons stylisés */}
        <div style={{
          padding: '25px 40px',
          background: 'linear-gradient(to bottom, #fff 0%, #f8f9fa 100%)',
          borderTop: '2px solid #f0f0f0',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderRadius: '0 0 20px 20px'
        }}>
          <button
            onClick={onClose}
            disabled={sending}
            className="btn"
            style={{
              minWidth: '130px',
              padding: '12px 25px',
              background: '#fff',
              border: '2px solid #e9ecef',
              color: '#666',
              fontWeight: '600',
              borderRadius: '10px',
              opacity: sending ? 0.5 : 1,
              cursor: sending ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => !sending && (e.target.style.borderColor = '#ddd')}
            onMouseLeave={(e) => (e.target.style.borderColor = '#e9ecef')}
          >
            <i className="fas fa-times me-2"></i>
            Annuler
          </button>
          <button
            onClick={handleSendInvite}
            disabled={!selectedUser || sending}
            className="btn"
            style={{
              minWidth: '180px',
              padding: '12px 25px',
              fontWeight: '600',
              borderRadius: '10px',
              cursor: !selectedUser || sending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.3s',
              opacity: !selectedUser || sending ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!selectedUser && !sending) return
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = !selectedUser || sending ? 'none' : '0 6px 20px rgba(102, 126, 234, 0.4)'
            }}
          >
            {sending ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                <span>Envoyer l'invitation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default InviteModal

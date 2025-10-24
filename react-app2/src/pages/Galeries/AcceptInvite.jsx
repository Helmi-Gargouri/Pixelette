import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const AcceptInvite = () => {
  const { id, token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    acceptInvitation()
  }, [])

  const acceptInvitation = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/galeries/${id}/accept-invite/${token}/`,
        {},
        { withCredentials: true }
      )
      
      setSuccess(true)
      setLoading(false)
      
      // Rediriger vers la galerie après 2 secondes
      setTimeout(() => {
        navigate(`/galeries/${id}`)
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'acceptation de l\'invitation')
      setLoading(false)
    }
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
            <h1 className="breadcumb-title">Invitation</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="text-center" style={{
                padding: '60px 40px',
                background: '#fff',
                borderRadius: '15px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                {error ? (
                  <>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 30px',
                      boxShadow: '0 10px 30px rgba(238, 90, 111, 0.3)'
                    }}>
                      <i className="fas fa-times" style={{ fontSize: '3rem', color: '#fff' }}></i>
                    </div>
                    <h2 className="mb-3" style={{ fontWeight: '600' }}>Erreur</h2>
                    <p className="text-muted mb-4" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                      {error}
                    </p>
                    <button 
                      onClick={() => navigate('/')} 
                      className="btn"
                      style={{
                        padding: '12px 30px',
                        fontSize: '1rem'
                      }}
                    >
                      <i className="fas fa-home me-2"></i>
                      Retour à l'accueil
                    </button>
                  </>
                ) : success ? (
                  <>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 30px',
                      boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                      animation: 'pulse 2s infinite'
                    }}>
                      <i className="fas fa-check" style={{ fontSize: '3rem', color: '#fff' }}></i>
                    </div>
                    <h2 className="mb-3" style={{ fontWeight: '600' }}>Invitation acceptée !</h2>
                    <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                      Vous avez maintenant accès à cette galerie privée.
                    </p>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#667eea',
                      fontSize: '0.95rem'
                    }}>
                      <i className="fas fa-spinner fa-spin"></i>
                      Redirection vers la galerie...
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  )
}

export default AcceptInvite


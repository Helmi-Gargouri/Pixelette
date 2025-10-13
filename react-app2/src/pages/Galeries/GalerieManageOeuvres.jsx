import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'

const GalerieManageOeuvres = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [galerie, setGalerie] = useState(null)
  const [oeuvresDisponibles, setOeuvresDisponibles] = useState([])
  const [oeuvresSelectionnees, setOeuvresSelectionnees] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      // Fetch galerie
      const galerieResponse = await axios.get(`http://localhost:8000/api/galeries/${id}/`, {
        withCredentials: true
      })
      setGalerie(galerieResponse.data)
      setOeuvresSelectionnees(galerieResponse.data.oeuvres || [])

      // Fetch toutes les oeuvres de l'utilisateur
      const oeuvresResponse = await axios.get('http://localhost:8000/api/oeuvres/', {
        withCredentials: true
      })
      
      // Filtrer pour ne garder que les oeuvres de l'utilisateur
      const mesOeuvres = oeuvresResponse.data.filter(
        oeuvre => oeuvre.auteur === user.id
      )
      setOeuvresDisponibles(mesOeuvres)
      
      setLoading(false)
    } catch (err) {
      console.error(err)
      setModal({ 
        show: true, 
        title: 'Erreur', 
        message: 'Erreur lors du chargement', 
        type: 'error' 
      })
      setTimeout(() => navigate('/mes-galeries'), 2000)
    }
  }

  const handleToggleOeuvre = (oeuvreId) => {
    if (oeuvresSelectionnees.includes(oeuvreId)) {
      setOeuvresSelectionnees(oeuvresSelectionnees.filter(id => id !== oeuvreId))
    } else {
      setOeuvresSelectionnees([...oeuvresSelectionnees, oeuvreId])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`http://localhost:8000/api/galeries/${id}/`, 
        {
          oeuvres: oeuvresSelectionnees
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Token ${token}`
          }
        }
      )
      
      setModal({ 
        show: true, 
        title: 'Succès !', 
        message: 'Oeuvres de la galerie mises à jour !', 
        type: 'success' 
      })
    } catch (err) {
      console.error(err)
      setModal({ 
        show: true, 
        title: 'Erreur', 
        message: 'Erreur lors de la mise à jour', 
        type: 'error' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleModalClose = () => {
    setModal({ ...modal, show: false })
    if (modal.type === 'success') {
      navigate(`/galeries/${id}`)
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

  return (
    <>
      <Modal
        show={modal.show}
        onClose={handleModalClose}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
      
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Gérer les Oeuvres</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">ACCUEIL</Link></li>
            <li><Link to="/galeries">GALERIES</Link></li>
            <li><Link to={`/galeries/${id}`}>{galerie?.nom}</Link></li>
            <li className="active">GÉRER OEUVRES</li>
          </ul>
        </div>
      </div>

      {/* Content */}
      <div className="space">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="contact-form-wrap" style={{ background: '#fff', padding: '40px', borderRadius: '10px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h2 className="mb-2">Gérer les oeuvres de "{galerie?.nom}"</h2>
                    <p className="text-muted mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      Sélectionnez les oeuvres à inclure dans cette galerie
                    </p>
                  </div>
                  <div>
                    <span className="badge bg-primary" style={{ fontSize: '1rem', padding: '8px 15px' }}>
                      {oeuvresSelectionnees.length} oeuvre{oeuvresSelectionnees.length > 1 ? 's' : ''} sélectionnée{oeuvresSelectionnees.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {oeuvresDisponibles.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-palette fa-4x text-muted mb-3"></i>
                    <h4>Aucune oeuvre disponible</h4>
                    <p className="text-muted">Créez d'abord des oeuvres pour les ajouter à cette galerie</p>
                    <Link to="/oeuvres/create" className="btn mt-3">
                      <i className="fas fa-plus me-2"></i>
                      Créer une oeuvre
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="row gy-3">
                      {oeuvresDisponibles.map((oeuvre) => {
                        const isSelected = oeuvresSelectionnees.includes(oeuvre.id)
                        
                        return (
                          <div key={oeuvre.id} className="col-md-6">
                            <div 
                              onClick={() => handleToggleOeuvre(oeuvre.id)}
                              style={{
                                border: isSelected ? '3px solid #667eea' : '2px solid #e9ecef',
                                borderRadius: '10px',
                                padding: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                background: isSelected ? '#f0f4ff' : '#fff',
                                position: 'relative'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#667eea'
                                  e.currentTarget.style.background = '#fafbff'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#e9ecef'
                                  e.currentTarget.style.background = '#fff'
                                }
                              }}
                            >
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '10px',
                                  right: '10px',
                                  background: '#667eea',
                                  color: '#fff',
                                  borderRadius: '50%',
                                  width: '30px',
                                  height: '30px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <i className="fas fa-check"></i>
                                </div>
                              )}
                              
                              <div className="d-flex gap-3 align-items-center">
                                {oeuvre.image ? (
                                  <img 
                                    src={oeuvre.image} 
                                    alt={oeuvre.titre}
                                    style={{ 
                                      width: '80px', 
                                      height: '80px', 
                                      objectFit: 'cover',
                                      borderRadius: '8px'
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="d-flex align-items-center justify-content-center"
                                    style={{ 
                                      width: '80px', 
                                      height: '80px', 
                                      background: '#f0f0f0',
                                      borderRadius: '8px'
                                    }}
                                  >
                                    <i className="fas fa-image fa-2x text-muted"></i>
                                  </div>
                                )}
                                
                                <div style={{ flex: 1 }}>
                                  <h5 className="mb-1" style={{ fontSize: '1.1rem' }}>{oeuvre.titre}</h5>
                                  <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                                    {oeuvre.description?.substring(0, 60)}
                                    {oeuvre.description?.length > 60 ? '...' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-4 d-flex gap-2 align-items-center">
                      <button 
                        onClick={handleSave}
                        className="btn"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Enregistrer ({oeuvresSelectionnees.length} oeuvre{oeuvresSelectionnees.length > 1 ? 's' : ''})
                          </>
                        )}
                      </button>
                      
                      <Link to={`/galeries/${id}`} className="btn btn-sm btn-outline-secondary">
                        Annuler
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default GalerieManageOeuvres


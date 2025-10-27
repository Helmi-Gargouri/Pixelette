import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'

const GalerieCreate = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    theme: '',
    privee: false
  })
  const [errors, setErrors] = useState({})
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' })
  const [allOeuvres, setAllOeuvres] = useState([])
  const [selectedOeuvres, setSelectedOeuvres] = useState([])
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const MEDIA_BASE = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8000';
  useEffect(() => {
    fetchAllOeuvres()
  }, [])

  const fetchAllOeuvres = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}oeuvres/`, {
        withCredentials: true,
        headers: {
          Authorization: `Token ${token}`
        }
      })
      setAllOeuvres(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des œuvres:', error)
    }
  }

  const toggleOeuvre = (oeuvreId) => {
    setSelectedOeuvres(prev => {
      if (prev.includes(oeuvreId)) {
        return prev.filter(id => id !== oeuvreId)
      } else {
        return [...prev, oeuvreId]
      }
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }
    
    setLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_BASE}galeries/`, 
        {
          ...formData,
          proprietaire: user.id,
          oeuvres: selectedOeuvres
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
        message: 'Galerie créée avec succès !', 
        type: 'success' 
      })
    } catch (err) {
      console.error(err)
      if (err.response?.data) {
        setErrors(err.response.data)
        setModal({ 
          show: true, 
          title: 'Erreur', 
          message: 'Erreur de validation', 
          type: 'error' 
        })
      } else {
        setModal({ 
          show: true, 
          title: 'Erreur', 
          message: 'Erreur lors de la création de la galerie', 
          type: 'error' 
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setModal({ ...modal, show: false })
    if (modal.type === 'success') {
      navigate('/mes-galeries')
    }
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
            <h1 className="breadcumb-title">Créer une Galerie</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">ACCUEIL</Link></li>
            <li><Link to="/mes-galeries">MES GALERIES</Link></li>
            <li className="active">CRÉER</li>
          </ul>
        </div>
      </div>

      {/* Form */}
      <div className="space">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="contact-form-wrap" style={{ background: '#fff', padding: '40px', borderRadius: '10px' }}>
                <h2 className="mb-4">Nouvelle Galerie</h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-12 form-group">
                      <label htmlFor="nom" className="form-label">
                        Nom de la galerie <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="text" 
                        className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        placeholder="Entrez le nom de la galerie"
                      />
                      {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                    </div>

                    <div className="col-12 form-group">
                      <label htmlFor="description" className="form-label">
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea 
                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                        id="description"
                        name="description"
                        rows="5"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Décrivez votre galerie..."
                      ></textarea>
                      {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                    </div>

                    <div className="col-12 form-group">
                      <label htmlFor="theme" className="form-label">
                        Thème
                      </label>
                      <input 
                        type="text" 
                        className="form-control"
                        id="theme"
                        name="theme"
                        value={formData.theme}
                        onChange={handleChange}
                        placeholder="Ex: Art moderne, Paysages, Portraits..."
                      />
                      <small className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        Le thème aide à catégoriser votre galerie
                      </small>
                    </div>

                    <div className="col-12 form-group">
                      <div className="form-check">
                        <input 
                          type="checkbox" 
                          className="form-check-input"
                          id="privee"
                          name="privee"
                          checked={formData.privee}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="privee">
                          <i className="fas fa-lock me-2"></i>
                          Galerie privée (uniquement visible par vous)
                        </label>
                      </div>
                    </div>

                    <div className="col-12 form-group">
                      <label className="form-label">
                        <i className="fas fa-images me-2"></i>
                        Sélectionner les œuvres à inclure
                        {selectedOeuvres.length > 0 && (
                          <span className="text-muted ms-2">({selectedOeuvres.length})</span>
                        )}
                      </label>
                      
                      {allOeuvres.length === 0 ? (
                        <div className="alert alert-info">
                          <i className="fas fa-info-circle me-2"></i>
                          Aucune œuvre disponible. Créez d'abord des œuvres pour les ajouter à votre galerie.
                        </div>
                      ) : (
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                          gap: '20px',
                          maxHeight: '450px',
                          overflowY: 'auto',
                          padding: '20px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '10px',
                          background: '#f9f9f9'
                        }}>
                          {allOeuvres.map(oeuvre => (
                            <div 
                              key={oeuvre.id}
                              onClick={() => toggleOeuvre(oeuvre.id)}
                              style={{ 
                                position: 'relative',
                                cursor: 'pointer',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: selectedOeuvres.includes(oeuvre.id) ? '3px solid var(--theme-color)' : '2px solid #ddd',
                                transition: 'all 0.3s ease',
                                boxShadow: selectedOeuvres.includes(oeuvre.id) ? '0 6px 20px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
                                transform: selectedOeuvres.includes(oeuvre.id) ? 'scale(1.02)' : 'scale(1)',
                                background: '#fff'
                              }}
                            >
                              {oeuvre.image ? (
                                <img 
                           src={oeuvre.image.startsWith('http') 
  ? oeuvre.image 
  : `${MEDIA_BASE}${oeuvre.image}`
}
                                  alt={oeuvre.titre}
                                  style={{ 
                                    width: '100%', 
                                    height: '140px', 
                                    objectFit: 'cover',
                                    display: 'block'
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div style={{ 
                                width: '100%', 
                                height: '140px', 
                                background: '#e9ecef',
                                display: oeuvre.image ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <i className="fas fa-image" style={{ fontSize: '2.5rem', color: '#adb5bd' }}></i>
                              </div>
                              
                              {selectedOeuvres.includes(oeuvre.id) && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  background: 'var(--theme-color)',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                }}>
                                  <i className="fas fa-check" style={{ fontSize: '0.9rem' }}></i>
                                </div>
                              )}
                              
                              <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.4) 60%, transparent)',
                                padding: '15px 10px 8px',
                                color: 'white'
                              }}>
                                <p style={{ 
                                  margin: 0, 
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                                }}>
                                  {oeuvre.titre}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="col-12 form-group d-flex gap-2 align-items-center">
                      <button 
                        type="submit" 
                        className="btn"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Création en cours...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Créer la Galerie
                          </>
                        )}
                      </button>
                      
                      <Link to="/mes-galeries" className="btn btn-sm btn-outline-secondary">
                        Annuler
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default GalerieCreate


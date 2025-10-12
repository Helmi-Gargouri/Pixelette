import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'

const GalerieEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    theme: '',
    privee: false
  })
  const [errors, setErrors] = useState({})
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' })

  useEffect(() => {
    fetchGalerie()
  }, [id])

  const fetchGalerie = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/galeries/${id}/`, {
        withCredentials: true
      })
      const galerie = response.data
      
      setFormData({
        nom: galerie.nom,
        description: galerie.description,
        theme: galerie.theme || '',
        privee: galerie.privee
      })
      setLoading(false)
    } catch (err) {
      console.error(err)
      setModal({ 
        show: true, 
        title: 'Erreur', 
        message: 'Erreur lors du chargement de la galerie', 
        type: 'error' 
      })
      setTimeout(() => navigate('/mes-galeries'), 2000)
    }
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
    
    setSaving(true)
    
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8000/api/galeries/${id}/`, 
        {
          ...formData,
          proprietaire: user.id
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
        message: 'Galerie modifiée avec succès !', 
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
          message: 'Erreur lors de la modification de la galerie', 
          type: 'error' 
        })
      }
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
            <h1 className="breadcumb-title">Modifier la Galerie</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">ACCUEIL</Link></li>
            <li><Link to="/mes-galeries">MES GALERIES</Link></li>
            <li className="active">MODIFIER</li>
          </ul>
        </div>
      </div>

      {/* Form */}
      <div className="space">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="contact-form-wrap" style={{ background: '#fff', padding: '40px', borderRadius: '10px' }}>
                <h2 className="mb-4">Modifier la Galerie</h2>
                
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

                    <div className="col-12 form-group d-flex gap-2 align-items-center">
                      <button 
                        type="submit" 
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
                            Enregistrer les modifications
                          </>
                        )}
                      </button>
                      
                      <Link to={`/galeries/${id}`} className="btn btn-sm btn-outline-secondary">
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

export default GalerieEdit


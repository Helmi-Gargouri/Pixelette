import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'

const OeuvreCreate = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    image: null
  })
  const [errors, setErrors] = useState({})
  const [previewImage, setPreviewImage] = useState(null)
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }))
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
      
      // Clear error
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }))
      }
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est requis'
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
      const data = new FormData()
      data.append('titre', formData.titre)
      data.append('description', formData.description)
      data.append('auteur', user.id)
      
      if (formData.image) {
        data.append('image', formData.image)
      }
      
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:8000/api/oeuvres/', data, {
        withCredentials: true,
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setModal({ 
        show: true, 
        title: 'Succès !', 
        message: 'Oeuvre créée avec succès !', 
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
          message: 'Erreur lors de la création de l\'oeuvre', 
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
      navigate('/mes-oeuvres')
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
            <h1 className="breadcumb-title">Créer une Oeuvre</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">ACCUEIL</Link></li>
            <li><Link to="/mes-oeuvres">MES OEUVRES</Link></li>
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
                <h2 className="mb-4">Nouvelle Oeuvre</h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-12 form-group">
                      <label htmlFor="titre" className="form-label">
                        Titre <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="text" 
                        className={`form-control ${errors.titre ? 'is-invalid' : ''}`}
                        id="titre"
                        name="titre"
                        value={formData.titre}
                        onChange={handleChange}
                        placeholder="Entrez le titre de l'oeuvre"
                      />
                      {errors.titre && <div className="invalid-feedback">{errors.titre}</div>}
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
                        placeholder="Décrivez votre oeuvre..."
                      ></textarea>
                      {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                    </div>

                    <div className="col-12 form-group">
                      <label htmlFor="image" className="form-label">
                        Image de l'oeuvre
                      </label>
                      <input 
                        type="file" 
                        className={`form-control ${errors.image ? 'is-invalid' : ''}`}
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      {errors.image && <div className="invalid-feedback">{errors.image}</div>}
                      
                      {previewImage && (
                        <div className="mt-3">
                          <img 
                            src={previewImage} 
                            alt="Aperçu" 
                            className="img-fluid rounded"
                            style={{ maxHeight: '300px' }}
                          />
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
                            Créer l'Oeuvre
                          </>
                        )}
                      </button>
                      
                      <Link to="/mes-oeuvres" style={{ 
                              backgroundColor: '#6c757d',
                              borderColor: '#6c757d',
                              color: '#fff'
                            }} className="btn btn-sm btn-outline-secondary">
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

export default OeuvreCreate


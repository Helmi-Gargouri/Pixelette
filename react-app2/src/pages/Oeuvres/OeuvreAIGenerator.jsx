import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'

const OeuvreAIGenerator = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realiste')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    titre: '',
    description: ''
  })
  const [errors, setErrors] = useState({})
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' })
  const [zoomModal, setZoomModal] = useState(false)
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const styles = [
    { value: 'realiste', label: 'Réaliste', description: 'photo réaliste, haute qualité, détaillé' },
    { value: 'artistique', label: 'Artistique', description: 'peinture artistique, style impressionniste' },
    { value: 'anime', label: 'Anime', description: 'style anime japonais, manga' },
    { value: 'abstrait', label: 'Abstrait', description: 'art abstrait, formes géométriques' },
    { value: '3d', label: '3D Render', description: 'rendu 3D, octane render, ultra réaliste' },
    { value: 'aquarelle', label: 'Aquarelle', description: 'peinture aquarelle, couleurs douces' },
    { value: 'pixel', label: 'Pixel Art', description: 'pixel art, style rétro 8-bit' },
    { value: 'cyberpunk', label: 'Cyberpunk', description: 'cyberpunk, néon, futuriste' },
    { value: 'fantaisie', label: 'Fantaisie', description: 'fantastique, magique, épique' },
    { value: 'minimaliste', label: 'Minimaliste', description: 'design minimaliste, épuré, simple' }
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrors({ prompt: 'Le prompt est requis' })
      return
    }

    setGenerating(true)
    setErrors({})

    try {
      const token = localStorage.getItem('token')
      const selectedStyle = styles.find(s => s.value === style)
      
      const response = await axios.post(
        `${API_BASE}oeuvres/generate_ai_image/`,
        {
          prompt: prompt,
          style: selectedStyle?.description || ''
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      setGeneratedImage(response.data.image)
      // Ne pas afficher de modal après la génération, juste montrer l'image
    } catch (err) {
      console.error('Erreur lors de la génération:', err)
      setModal({
        show: true,
        title: 'Erreur',
        message: err.response?.data?.error || 'Erreur lors de la génération de l\'image',
        type: 'error'
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSaveOeuvre = async () => {
    if (!formData.titre.trim()) {
      setErrors({ titre: 'Le titre est requis' })
      return
    }

    if (!formData.description.trim()) {
      setErrors({ description: 'La description est requise' })
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      // Convertir l'image base64 en Blob
      const base64Response = await fetch(generatedImage)
      const blob = await base64Response.blob()
      
      const data = new FormData()
      data.append('titre', formData.titre)
      data.append('description', formData.description)
      data.append('auteur', user.id)
      data.append('image', blob, 'ai-generated.png')

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
      setModal({
        show: true,
        title: 'Erreur',
        message: 'Erreur lors de la création de l\'oeuvre',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    const shouldRedirect = modal.type === 'success' && !generating && !generatedImage
    setModal({ ...modal, show: false })
    if (shouldRedirect) {
      navigate('/mes-oeuvres')
    }
  }

  const handleReset = () => {
    setGeneratedImage(null)
    setShowForm(false)
    setFormData({ titre: '', description: '' })
    setPrompt('')
    setErrors({})
  }

  const handleDownloadImage = () => {
    if (!generatedImage) return
    
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `ai-generated-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAddOeuvre = () => {
    setShowForm(true)
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
            <h1 className="breadcumb-title">Générateur IA d'Oeuvres</h1>
            <p className="breadcumb-subtitle" style={{ color: '#fff', marginTop: '10px' }}>
              Créez des œuvres d'art uniques grâce à l'intelligence artificielle
            </p>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">ACCUEIL</Link></li>
            <li><Link to="/mes-oeuvres">MES OEUVRES</Link></li>
            <li className="active">GÉNÉRATEUR IA</li>
          </ul>
        </div>
      </div>

      {/* Generator Form */}
      <div className="space">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">

              {!generatedImage ? (
                /* Generator Section */
                <div className="contact-form-wrap" style={{ background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 5px 25px rgba(0,0,0,0.1)' }}>
                  <h2 className="mb-4">
                    <i className="fas fa-palette me-2" style={{ color: 'var(--theme-color)' }}></i>
                    Créer votre Oeuvre
                  </h2>

                  <div className="row">
                    {/* Prompt Input */}
                    <div className="col-12 form-group">
                    <br />
                      <label className="form-label" style={{ fontWeight: '600',fontSize: '1.6rem' }}>
                    
                        Description de l'image <span className="text-danger">*</span>
                      </label>
                      <br />
                      <textarea
                        className={`form-control ${errors.prompt ? 'is-invalid' : ''}`}
                        id="prompt"
                        name="prompt"
                        rows="4"
                        value={prompt}
                        onChange={(e) => {
                          setPrompt(e.target.value)
                          if (errors.prompt) setErrors({ ...errors, prompt: '' })
                        }}
                        placeholder="Ex: Un coucher de soleil sur une plage tropicale, un chat astronaute dans l'espace, un château médiéval dans les nuages..."
                      ></textarea>
                      {errors.prompt && <div className="invalid-feedback">{errors.prompt}</div>}
                      <small className="text-muted">
                         Soyez précis et créatif ! Plus votre description est détaillée, meilleur sera le résultat.
                      </small>
                    </div>

                    {/* Style Selection */}
                    <div className="col-12 form-group">
                    <br />
                      <label className="form-label" style={{ fontWeight: '600',fontSize: '1.6rem' }}>
                        Style artistique
                      </label>
                      <br />
                      <div className="row g-3">
                        {styles.map((styleOption) => (
                          <div key={styleOption.value} className="col-lg-6 col-md-6">
                            <div
                              className={`style-card ${style === styleOption.value ? 'active' : ''}`}
                              onClick={() => setStyle(styleOption.value)}
                              style={{
                                padding: '15px',
                                border: style === styleOption.value ? '2px solid var(--theme-color)' : '2px solid #e0e0e0',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                background: style === styleOption.value ? '#f8f9ff' : '#fff'
                              }}
                            >
                              <h6 className="mb-1" style={{ 
                                color: style === styleOption.value ? 'var(--theme-color)' : '#333',
                                fontWeight: '600'
                              }}>
                                {styleOption.label}
                              </h6>
                              <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                                {styleOption.description}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Generate Button */}
                    <div className="col-12 form-group">
                      <button
                        type="button"
                        className="btn btn-lg w-100"
                        onClick={handleGenerate}
                        disabled={generating}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          padding: '15px'
                        }}
                      >
                        {generating ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Génération en cours... (cela peut prendre 30-60 secondes)
                          </>
                        ) : (
                          <>
                            <i className="fas fa-magic me-2"></i>
                            Générer l'Image
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : !showForm ? (
                /* Preview Section - Image Display */
                <div className="contact-form-wrap" style={{ background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 5px 25px rgba(0,0,0,0.1)' }}>
                  <h2 className="mb-4">
                    <i className="fas fa-check-circle me-2" style={{ color: '#28a745' }}></i>
                    Votre Image IA est Prête !
                  </h2>

                  <div className="row">
                    {/* Generated Image Preview */}
                    <div className="col-12 mb-4">
                      <div style={{ 
                        position: 'relative',
                        border: '3px solid var(--theme-color)',
                        borderRadius: '15px',
                        padding: '10px',
                        background: '#f8f9fa'
                      }}>
                        <img
                          src={generatedImage}
                          alt="Image générée par IA"
                          className="img-fluid rounded"
                          style={{ 
                            width: '100%', 
                            maxHeight: '500px', 
                            objectFit: 'contain',
                            cursor: 'zoom-in'
                          }}
                          onClick={() => setZoomModal(true)}
                        />
                        
                        {/* Action buttons overlay */}
                        <div style={{
                          position: 'absolute',
                          top: '20px',
                          right: '20px',
                          display: 'flex',
                          gap: '10px'
                        }}>
                          <button
                            className="btn btn-sm"
                            onClick={() => setZoomModal(true)}
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '45px',
                              height: '45px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                            title="Zoomer"
                          >
                            <i className="fas fa-search-plus" style={{ color: 'var(--theme-color)' }}></i>
                          </button>
                          
                          <button
                            className="btn btn-sm"
                            onClick={handleDownloadImage}
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '45px',
                              height: '45px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                            title="Télécharger"
                          >
                            <i className="fas fa-download" style={{ color: '#28a745' }}></i>
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-center text-muted mt-2">
                        <i className="fas fa-info-circle me-1"></i>
                        Cliquez sur l'image pour zoomer
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="col-12">
                      <div className="d-flex gap-3 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-lg flex-fill"
                          onClick={handleAddOeuvre}
                          style={{
                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                            border: 'none',
                            padding: '15px'
                          }}
                        >
                          <i className="fas fa-plus-circle me-2"></i>
                          Ajouter cette Œuvre
                        </button>

                        <button
                          type="button"
                          className="btn btn-lg flex-fill"
                          onClick={handleReset}
                          style={{
                            backgroundColor: '#6c757d',
                            borderColor: '#6c757d',
                            padding: '15px'
                          }}
                        >
                          <i className="fas fa-redo me-2"></i>
                          Régénérer une Image
                        </button>
                      </div>
                      
                      <div className="text-center mt-3">
                        <small className="text-muted">
                          Vous aimez cette image ? Ajoutez-la à vos œuvres ou générez-en une nouvelle !
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Form Section - Add to Oeuvres */
                <div className="contact-form-wrap" style={{ background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 5px 25px rgba(0,0,0,0.1)' }}>
                  <h2 className="mb-4">
                    <i className="fas fa-edit me-2" style={{ color: 'var(--theme-color)' }}></i>
                    Finaliser votre Œuvre
                  </h2>

                  <div className="row">
                    {/* Image Preview Small */}
                    <div className="col-12 mb-4">
                      <div style={{ 
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        padding: '10px',
                        background: '#f8f9fa',
                        textAlign: 'center'
                      }}>
                        <img
                          src={generatedImage}
                          alt="Aperçu"
                          className="img-fluid rounded"
                          style={{ maxHeight: '250px', objectFit: 'contain' }}
                        />
                      </div>
                    </div>

                    {/* Title Input */}
                    <div className="col-12 form-group">
                      <label htmlFor="titre" className="form-label">
                        <i className="fas fa-heading me-2"></i>
                        Titre de l'oeuvre <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.titre ? 'is-invalid' : ''}`}
                        id="titre"
                        name="titre"
                        value={formData.titre}
                        onChange={handleChange}
                        placeholder="Donnez un titre à votre création"
                      />
                      {errors.titre && <div className="invalid-feedback">{errors.titre}</div>}
                    </div>

                    {/* Description Input */}
                    <div className="col-12 form-group">
                      <label htmlFor="description" className="form-label">
                        <i className="fas fa-align-left me-2"></i>
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                        id="description"
                        name="description"
                        rows="5"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Décrivez votre oeuvre, son inspiration, les émotions qu'elle évoque..."
                      ></textarea>
                      {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                    </div>

                    {/* Action Buttons */}
                    <div className="col-12 form-group">
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn flex-fill"
                          onClick={handleSaveOeuvre}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save me-2"></i>
                              Enregistrer l'Œuvre
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className="btn"
                          onClick={() => setShowForm(false)}
                          style={{
                            backgroundColor: '#6c757d',
                            borderColor: '#6c757d'
                          }}
                        >
                          <i className="fas fa-arrow-left me-2"></i>
                          Retour
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Zoom Modal */}
      {zoomModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'zoom-out'
          }}
          onClick={() => setZoomModal(false)}
        >
          <div style={{ position: 'relative', maxWidth: '95%', maxHeight: '95%' }}>
            <button
              onClick={() => setZoomModal(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                zIndex: 10000
              }}
            >
              <i className="fas fa-times"></i>
            </button>
            
            <img
              src={generatedImage}
              alt="Image en plein écran"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '10px'
              }}
              onClick={(e) => e.stopPropagation()}
            />
            
            <div style={{
              position: 'absolute',
              bottom: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownloadImage()
                }}
                className="btn"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#333',
                  border: 'none'
                }}
              >
                <i className="fas fa-download me-2"></i>
                Télécharger
              </button>
            </div>
          </div>
        </div>
      )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default OeuvreAIGenerator


import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const ArtistesList = () => {
  const [artistes, setArtistes] = useState([])
  const [filteredArtistes, setFilteredArtistes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [followingArtists, setFollowingArtists] = useState(new Set())
  const [loadingFollow, setLoadingFollow] = useState({})
  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedArtiste, setSelectedArtiste] = useState(null)
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [sendingContact, setSendingContact] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    fetchArtistes()
  }, [])

  const fetchArtistes = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/utilisateurs/artistes/', {
        withCredentials: true
      })
      setArtistes(response.data.artistes)
      setFilteredArtistes(response.data.artistes)
      
      // Mettre à jour les artistes suivis
      if (isAuthenticated) {
        const followed = new Set(
          response.data.artistes
            .filter(a => a.is_followed)
            .map(a => a.id)
        )
        setFollowingArtists(followed)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Erreur lors du chargement des artistes:', err)
      setError('Erreur lors du chargement des artistes')
      setLoading(false)
    }
  }

  // Filtrage et tri
  useEffect(() => {
    let result = [...artistes]

    if (searchTerm) {
      result = result.filter(artiste => 
        artiste.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artiste.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artiste.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.nom.localeCompare(b.nom))
        break
      case 'recent':
        result.sort((a, b) => new Date(b.date_inscription) - new Date(a.date_inscription))
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.date_inscription) - new Date(b.date_inscription))
        break
      case 'popular':
        result.sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0))
        break
      default:
        break
    }

    setFilteredArtistes(result)
  }, [searchTerm, sortBy, artistes])

  // Fonction pour suivre/ne plus suivre un artiste
  const handleFollowToggle = async (artisteId) => {
    if (!isAuthenticated) {
      alert('Vous devez être connecté pour suivre un artiste')
      return
    }

    setLoadingFollow(prev => ({ ...prev, [artisteId]: true }))

    try {
      const isFollowing = followingArtists.has(artisteId)

      if (isFollowing) {
        // Ne plus suivre
        await axios.delete(`http://localhost:8000/api/suivis/${artisteId}/unfollow/`, {
          withCredentials: true
        })
        
        setFollowingArtists(prev => {
          const newSet = new Set(prev)
          newSet.delete(artisteId)
          return newSet
        })

        // Mettre à jour le compteur
        setArtistes(prev => prev.map(a => 
          a.id === artisteId 
            ? { ...a, followers_count: (a.followers_count || 1) - 1 }
            : a
        ))
        setFilteredArtistes(prev => prev.map(a => 
          a.id === artisteId 
            ? { ...a, followers_count: (a.followers_count || 1) - 1 }
            : a
        ))

      } else {
        // Suivre
        await axios.post('http://localhost:8000/api/suivis/', {
          artiste_id: artisteId
        }, {
          withCredentials: true
        })
        
        setFollowingArtists(prev => new Set([...prev, artisteId]))

        // Mettre à jour le compteur
        setArtistes(prev => prev.map(a => 
          a.id === artisteId 
            ? { ...a, followers_count: (a.followers_count || 0) + 1 }
            : a
        ))
        setFilteredArtistes(prev => prev.map(a => 
          a.id === artisteId 
            ? { ...a, followers_count: (a.followers_count || 0) + 1 }
            : a
        ))
      }

    } catch (err) {
      console.error('Erreur lors du suivi:', err)
      alert(err.response?.data?.error || 'Erreur lors de l\'action')
    } finally {
      setLoadingFollow(prev => ({ ...prev, [artisteId]: false }))
    }
  }

  const distributeArtistes = (artistes) => {
    const columns = [[], [], []]
    artistes.forEach((artiste, index) => {
      columns[index % 3].push(artiste)
    })
    return columns
  }

  const openContactModal = (artiste) => {
    if (!isAuthenticated) {
      alert('Vous devez être connecté pour contacter un artiste')
      return
    }
    setSelectedArtiste(artiste)
    setContactSubject(`Question sur vos œuvres`)
    setContactMessage('')
    setShowContactModal(true)
    setContactSuccess(false)
  }

  // ✅ NOUVELLE FONCTION - Envoyer le message
  const handleSendContact = async () => {
    if (!contactMessage.trim()) {
      alert('Veuillez écrire un message')
      return
    }

    setSendingContact(true)
    
    try {
      await axios.post('http://localhost:8000/api/contacts/', {
        artiste_id: selectedArtiste.id,
        sujet: contactSubject,
        message: contactMessage
      }, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        withCredentials: true
      })
      
      setContactSuccess(true)
      setTimeout(() => {
        setShowContactModal(false)
        setContactSubject('')
        setContactMessage('')
        setSelectedArtiste(null)
      }, 2000)
      
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de l\'envoi du message')
    } finally {
      setSendingContact(false)
    }
  }

  const getInitials = (prenom, nom) => {
    return `${prenom?.charAt(0) || ''}${nom?.charAt(0) || ''}`.toUpperCase()
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
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Nos Artistes</h1>
            <p className="breadcumb-text">Découvrez les talents de notre communauté</p>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">ACCUEIL</Link></li>
            <li className="active">ARTISTES</li>
          </ul>
        </div>
      </div>

      <div className="portfolio-standard-area space overflow-hidden">
        <div className="container">
          <div style={{ background: '#F8F7F4', padding: '25px', borderRadius: '15px', marginBottom: '30px' }}>
            <div className="row align-items-center">
              <div className="col-lg-8 col-md-12 mb-3 mb-lg-0">
                <div className="input-group" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <span className="input-group-text" style={{ 
                    background: '#fff', 
                    border: 'none', 
                    borderRadius: '10px 0 0 10px',
                    padding: '12px 15px'
                  }}>
                    <i className="fas fa-search" style={{ color: 'var(--theme-color)', fontSize: '1.1rem' }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher un artiste par nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      border: 'none',
                      padding: '12px 15px',
                      fontSize: '15px',
                      background: '#fff'
                    }}
                  />
                  {searchTerm && (
                    <button
                      className="btn"
                      onClick={() => setSearchTerm('')}
                      style={{ 
                        border: 'none',
                        background: '#fff',
                        borderRadius: '0 10px 10px 0',
                        color: '#7B7E86'
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-lg-4 col-md-12">
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ 
                    border: 'none',
                    padding: '12px 15px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    background: '#fff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="name">📝 Nom (A-Z)</option>
                  <option value="popular">🔥 Plus populaires</option>
                  <option value="recent">🆕 Plus récents</option>
                  <option value="oldest">⏰ Plus anciens</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap">
            <div style={{ 
              padding: '12px 20px', 
              background: '#fff', 
              borderRadius: '10px',
              border: '1px solid #e0e0e0',
              marginBottom: '10px'
            }}>
              <i className="fas fa-palette me-2" style={{ color: 'var(--theme-color)' }}></i>
              <strong>{filteredArtistes.length}</strong> artiste{filteredArtistes.length !== 1 ? 's' : ''} 
              {searchTerm && <span> pour "<strong>{searchTerm}</strong>"</span>}
            </div>
            
            {!isAuthenticated && (
              <div style={{
                padding: '12px 20px',
                background: '#FFF9E6',
                borderRadius: '10px',
                border: '1px solid #FFE5A3',
                marginBottom: '10px'
              }}>
                <i className="fas fa-info-circle me-2" style={{ color: '#FFA500' }}></i>
                <Link to="/login" style={{ color: '#FFA500', textDecoration: 'underline' }}>
                  Connectez-vous
                </Link> pour suivre vos artistes préférés
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-danger text-center mb-4" role="alert">
              {error}
            </div>
          )}

          {filteredArtistes.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-user-slash fa-3x text-muted mb-3"></i>
              <h3>{searchTerm ? 'Aucun artiste trouvé' : 'Aucun artiste disponible'}</h3>
              <p>{searchTerm ? 'Essayez avec d\'autres mots-clés' : 'Les artistes seront bientôt affichés ici.'}</p>
            </div>
          ) : (
            <div className="row gx-4">
              {distributeArtistes(filteredArtistes).map((column, colIndex) => (
                <div key={colIndex} className="col-lg-4 col-md-6 col-12">
                  {column.map((artiste) => {
                    const isFollowing = followingArtists.has(artiste.id)
                    const isLoading = loadingFollow[artiste.id]
                    
                    return (
                      <div 
                        key={artiste.id} 
                        className="artist-card"
                        style={{ 
                          marginBottom: '30px',
                          background: '#fff',
                          borderRadius: '15px',
                          padding: '25px',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)'
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)'
                        }}
                      >
                        <div className="text-center mb-3 position-relative">
                          {artiste.image ? (
                            <img 
                              src={artiste.image.startsWith('http') 
                                ? artiste.image 
                                : `http://localhost:8000${artiste.image}`
                              } 
                              alt={`${artiste.prenom} ${artiste.nom}`}
                              style={{ 
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '4px solid var(--theme-color)',
                                marginBottom: '15px'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextElementSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div 
                            style={{ 
                              width: '120px',
                              height: '120px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--theme-color) 0%, var(--theme-color2) 100%)',
                              display: artiste.image ? 'none' : 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 15px',
                              fontSize: '2.5rem',
                              fontWeight: 'bold',
                              color: '#fff',
                              border: '4px solid #fff',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}
                          >
                            {getInitials(artiste.prenom, artiste.nom)}
                          </div>
                          
                          <span style={{
                            position: 'absolute',
                            top: '0',
                            right: '50%',
                            transform: 'translateX(60px)',
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                            color: '#fff',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(255,165,0,0.3)'
                          }}>
                            <i className="fas fa-palette me-1"></i>Artiste
                          </span>
                        </div>

                        <div className="text-center">
                          <h4 style={{ 
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            color: '#2C3E50',
                            marginBottom: '8px'
                          }}>
                            {artiste.prenom} {artiste.nom}
                          </h4>
                          
                          <p style={{ 
                            color: '#7B7E86',
                            fontSize: '0.9rem',
                            marginBottom: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px'
                          }}>
                            <i className="fas fa-envelope"></i>
                            {artiste.email}
                          </p>

                          {artiste.telephone && (
                            <p style={{ 
                              color: '#7B7E86',
                              fontSize: '0.9rem',
                              marginBottom: '15px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px'
                            }}>
                              <i className="fas fa-phone"></i>
                              {artiste.telephone}
                            </p>
                          )}

                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '20px',
                            marginBottom: '15px',
                            padding: '10px',
                            background: '#F8F9FA',
                            borderRadius: '10px'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--theme-color)' }}>
                                {artiste.followers_count || 0}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#7B7E86' }}>
                                <i className="fas fa-users me-1"></i>Abonnés
                              </div>
                            </div>
                          </div>

                          <p style={{ 
                            color: '#95A5A6',
                            fontSize: '0.85rem',
                            marginBottom: '20px'
                          }}>
                            <i className="fas fa-calendar-alt me-1"></i>
                            Membre depuis {new Date(artiste.date_inscription).toLocaleDateString('fr-FR', {
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>

                          <div className="d-flex gap-2 justify-content-center">
                      
                            
                            {isAuthenticated && user?.id !== artiste.id && (
                              <>
                                <button 
                                  onClick={() => handleFollowToggle(artiste.id)}
                                  disabled={loadingFollow[artiste.id]}
                                  className={`btn btn-sm ${followingArtists.has(artiste.id) ? 'btn-outline' : ''}`}
                                  style={{ 
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    minWidth: '120px',
                                    justifyContent: 'center',
                                    backgroundColor: followingArtists.has(artiste.id) ? 'transparent' : undefined,
                                    border: followingArtists.has(artiste.id) ? '2px solid var(--theme-color)' : undefined,
                                    color: followingArtists.has(artiste.id) ? 'var(--theme-color)' : undefined,
                                    opacity: loadingFollow[artiste.id] ? 0.6 : 1,
                                    cursor: loadingFollow[artiste.id] ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {loadingFollow[artiste.id] ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin"></i>
                                      ...
                                    </>
                                  ) : followingArtists.has(artiste.id) ? (
                                    <>
                                      <i className="fas fa-check"></i>
                                      Suivi
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-user-plus"></i>
                                      Suivre
                                    </>
                                  )}
                                </button>
                                
                                {/* ✅ NOUVEAU BOUTON - Contacter */}
                                <button 
                                  onClick={() => openContactModal(artiste)}
                                  className="btn btn-sm"
                                  style={{ 
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: '#667eea',
                                    borderColor: '#667eea'
                                  }}
                                >
                                  <i className="fas fa-envelope"></i>
                                  Contacter
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ✅ NOUVEAU MODAL - Contact artiste */}
      {showContactModal && selectedArtiste && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '15px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {contactSuccess ? (
              // Message de succès
              <div className="text-center">
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#28a745',
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-check" style={{ fontSize: '2.5rem', color: '#fff' }}></i>
                </div>
                <h3 style={{ color: '#28a745', marginBottom: '15px' }}>Message envoyé !</h3>
                <p style={{ color: '#7B7E86', fontSize: '1rem' }}>
                  {selectedArtiste.prenom} {selectedArtiste.nom} recevra votre message par email.
                </p>
              </div>
            ) : (
              // Formulaire de contact
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="mb-0">
                    <i className="fas fa-envelope me-2" style={{ color: '#667eea' }}></i>
                    Contacter {selectedArtiste.prenom} {selectedArtiste.nom}
                  </h4>
                  <button
                    onClick={() => setShowContactModal(false)}
                    disabled={sendingContact}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#7B7E86'
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{
                  background: '#F8F7F4',
                  padding: '15px',
                  borderRadius: '10px',
                  marginBottom: '25px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  {selectedArtiste.image ? (
                    <img 
                      src={selectedArtiste.image.startsWith('http') 
                        ? selectedArtiste.image 
                        : `http://localhost:8000${selectedArtiste.image}`
                      }
                      alt={`${selectedArtiste.prenom} ${selectedArtiste.nom}`}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--theme-color) 0%, var(--theme-color2) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 'bold'
                    }}>
                      {selectedArtiste.prenom?.charAt(0)}{selectedArtiste.nom?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                      {selectedArtiste.prenom} {selectedArtiste.nom}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#7B7E86' }}>
                      <i className="fas fa-envelope me-1"></i>
                      {selectedArtiste.email}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '600' }}>
                    Sujet
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="Ex: Question sur vos œuvres"
                    style={{
                      borderRadius: '10px',
                      padding: '12px 15px',
                      border: '1px solid #e0e0e0'
                    }}
                    disabled={sendingContact}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" style={{ fontWeight: '600' }}>
                    Message <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <textarea
                    className="form-control"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Écrivez votre message ici..."
                    rows="6"
                    style={{
                      borderRadius: '10px',
                      padding: '12px 15px',
                      border: '1px solid #e0e0e0',
                      resize: 'vertical'
                    }}
                    disabled={sendingContact}
                    required
                  />
                  <div style={{ fontSize: '0.85rem', color: '#7B7E86', marginTop: '5px' }}>
                    {contactMessage.length} / 1000 caractères
                  </div>
                </div>

                <div style={{
                  background: '#FFF9E6',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  marginBottom: '25px',
                  fontSize: '0.85rem',
                  color: '#856404',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '10px'
                }}>
                  <i className="fas fa-info-circle" style={{ marginTop: '2px' }}></i>
                  <div>
                    Votre message sera envoyé par email à l'artiste. 
                    Il pourra vous répondre directement via votre adresse email.
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    onClick={() => setShowContactModal(false)}
                    disabled={sendingContact}
                    className="btn btn-secondary flex-fill"
                    style={{ padding: '12px', borderRadius: '10px' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSendContact}
                    disabled={sendingContact || !contactMessage.trim()}
                    className="btn flex-fill"
                    style={{ 
                      padding: '12px',
                      borderRadius: '10px',
                      background: sendingContact ? '#6c757d' : '#667eea',
                      borderColor: sendingContact ? '#6c757d' : '#667eea',
                      opacity: !contactMessage.trim() ? 0.5 : 1,
                      cursor: !contactMessage.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {sendingContact ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Envoyer le message
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ArtistesList
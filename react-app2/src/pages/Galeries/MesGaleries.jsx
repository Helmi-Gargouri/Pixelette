import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'
import jsPDF from 'jspdf'

const MesGaleries = () => {
  const [galeries, setGaleries] = useState([])
  const [filteredGaleries, setFilteredGaleries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' })
  const [confirmModal, setConfirmModal] = useState({ show: false, galerieId: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPrivee, setFilterPrivee] = useState('all')
  const [filterTheme, setFilterTheme] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [currentSlides, setCurrentSlides] = useState({})
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Rediriger si l'utilisateur n'est pas artiste ou admin
    if (!isAuthenticated) {
      navigate('/login')
    } else if (user && user.role !== 'artiste' && user.role !== 'admin') {
      navigate('/galeries')
    } else if (user) {
      fetchGaleries()
    }
  }, [isAuthenticated, user, navigate])

  const fetchGaleries = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/galeries/', {
        withCredentials: true
      })
      // Filtrer uniquement les galeries de l'utilisateur connecté
      const mesGaleries = response.data.filter(galerie => galerie.proprietaire === user?.id)
      setGaleries(mesGaleries)
      setFilteredGaleries(mesGaleries)
      setLoading(false)
    } catch (err) {
      setError('Erreur lors du chargement des galeries')
      setLoading(false)
    }
  }

  // Récupérer tous les thèmes uniques
  const allThemes = [...new Set(galeries.map(g => g.theme).filter(Boolean))]

  // Filtrage et tri
  useEffect(() => {
    let result = [...galeries]

    if (searchTerm) {
      result = result.filter(galerie => 
        galerie.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        galerie.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        galerie.theme?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterPrivee !== 'all') {
      result = result.filter(galerie => 
        filterPrivee === 'public' ? !galerie.privee : galerie.privee
      )
    }

    if (filterTheme !== 'all') {
      result = result.filter(galerie => galerie.theme === filterTheme)
    }

    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.date_creation) - new Date(b.date_creation))
        break
      case 'name':
        result.sort((a, b) => a.nom.localeCompare(b.nom))
        break
      case 'oeuvres':
        result.sort((a, b) => (b.oeuvres_count || 0) - (a.oeuvres_count || 0))
        break
      default:
        break
    }

    setFilteredGaleries(result)
  }, [searchTerm, filterPrivee, filterTheme, sortBy, galeries])

  const handleDeleteClick = (id) => {
    setConfirmModal({ show: true, galerieId: id })
  }

  const handleDeleteConfirm = async () => {
    const id = confirmModal.galerieId
    setConfirmModal({ show: false, galerieId: null })

    try {
      await axios.delete(`http://localhost:8000/api/galeries/${id}/`, {
        withCredentials: true
      })
      setGaleries(galeries.filter(galerie => galerie.id !== id))
      setModal({ 
        show: true, 
        title: 'Succès !', 
        message: 'Galerie supprimée avec succès', 
        type: 'success' 
      })
    } catch (err) {
      setModal({ 
        show: true, 
        title: 'Erreur', 
        message: 'Erreur lors de la suppression', 
        type: 'error' 
      })
    }
  }

  const nextSlide = (galerieId, maxLength) => {
    setCurrentSlides(prev => ({
      ...prev,
      [galerieId]: ((prev[galerieId] || 0) + 1) % maxLength
    }))
  }

  const prevSlide = (galerieId, maxLength) => {
    setCurrentSlides(prev => ({
      ...prev,
      [galerieId]: ((prev[galerieId] || 0) - 1 + maxLength) % maxLength
    }))
  }

  const generateGaleriePDF = async (galerie) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Couleur primaire du template
      const primaryColor = [102, 126, 234] // #667eea
      const darkColor = [51, 51, 51]
      
      // En-tête avec fond de couleur
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(0, 0, pageWidth, 45, 'F')
      
      // Charger et ajouter le logo
      try {
        const logoImg = new Image()
        logoImg.crossOrigin = 'anonymous'
        
        await new Promise((resolve, reject) => {
          logoImg.onload = () => resolve()
          logoImg.onerror = () => reject(new Error('Erreur chargement logo'))
          logoImg.src = '/assets/img/logo/logoNom.png'
        })
        
        // Ajouter le logo à gauche dans l'en-tête (hauteur agrandie: 35px)
        const logoHeight = 35
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight
        pdf.addImage(logoImg, 'PNG', 15, 7, logoWidth * 0.264583, logoHeight * 0.264583)
      } catch (err) {
        console.warn('Logo non chargé, utilisation du texte')
        // Si le logo ne charge pas, utiliser le texte
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(32)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Pixelette', 20, 22)
        
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.text('Galerie d\'Art Numérique', 20, 35)
      }
      
      // Date d'export en haut à droite
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      const today = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      pdf.text(`Exporté le ${today}`, pageWidth - 60, 25)
      
      // Nom du créateur sous la date
      if (user) {
        pdf.text(`Par ${user.prenom} ${user.nom}`, pageWidth - 60, 32)
      }
      
      let currentY = 60
      
      // Titre de la galerie
      pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2])
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      const titleLines = pdf.splitTextToSize(galerie.nom, pageWidth - 40)
      pdf.text(titleLines, 20, currentY)
      currentY += (titleLines.length * 10) + 5
      
      // Double ligne séparatrice avec couleurs du template
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setLineWidth(1.5)
      pdf.line(20, currentY, pageWidth - 20, currentY)
      
      pdf.setDrawColor(164, 176, 190) // Gris clair du template
      pdf.setLineWidth(0.5)
      pdf.line(20, currentY + 2, pageWidth - 20, currentY + 2)
      currentY += 12
      
      // Encadrés stylisés pour les informations
      const infoY = currentY
      
      // Badge Statut avec fond coloré
      pdf.setFillColor(galerie.privee ? 255 : primaryColor[0], galerie.privee ? 235 : primaryColor[1], galerie.privee ? 200 : primaryColor[2])
      pdf.roundedRect(20, infoY, 35, 14, 3, 3, 'F')
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(galerie.privee ? 150 : 255, galerie.privee ? 100 : 255, galerie.privee ? 0 : 255)
      pdf.text('STATUT', 23, infoY + 5)
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(galerie.privee ? 120 : 255, galerie.privee ? 80 : 255, galerie.privee ? 0 : 255)
      pdf.text(galerie.privee ? 'Privée' : 'Publique', 23, infoY + 11)
      
      // Badge Date
      pdf.setFillColor(248, 248, 252)
      pdf.roundedRect(60, infoY, 50, 14, 3, 3, 'F')
      
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setLineWidth(0.5)
      pdf.roundedRect(60, infoY, 50, 14, 3, 3, 'S')
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.text('CRÉÉE LE', 63, infoY + 5)
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2])
      const dateCreation = new Date(galerie.date_creation).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
      pdf.text(dateCreation, 63, infoY + 11)
      
      // Badge Thème (si existe)
      let nextX = 115
      if (galerie.theme) {
        const themeWidth = Math.min(45, pdf.getTextWidth(galerie.theme) + 10)
        pdf.setFillColor(248, 248, 252)
        pdf.roundedRect(nextX, infoY, themeWidth, 14, 3, 3, 'F')
        
        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.setLineWidth(0.5)
        pdf.roundedRect(nextX, infoY, themeWidth, 14, 3, 3, 'S')
        
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.text('THÈME', nextX + 3, infoY + 5)
        
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2])
        const themeText = galerie.theme.length > 15 ? galerie.theme.substring(0, 15) + '...' : galerie.theme
        pdf.text(themeText, nextX + 3, infoY + 11)
        
        nextX += themeWidth + 5
      }
      
      // Badge Nombre d'œuvres
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.roundedRect(nextX, infoY, 30, 14, 3, 3, 'F')
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('ŒUVRES', nextX + 3, infoY + 5)
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      const oeuvresCount = `${galerie.oeuvres_count || 0}`
      const countWidth = pdf.getTextWidth(oeuvresCount)
      pdf.text(oeuvresCount, nextX + (30 - countWidth) / 2, infoY + 12)
      
      currentY += 22
      
      // Description avec fond stylisé
      if (galerie.description) {
        pdf.setFillColor(248, 248, 252)
        const descLines = pdf.splitTextToSize(galerie.description, pageWidth - 50)
        const descHeight = (descLines.length * 6) + 16
        pdf.roundedRect(20, currentY - 2, pageWidth - 40, descHeight, 3, 3, 'F')
        
        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.3)
        pdf.setLineWidth(0.3)
        pdf.roundedRect(20, currentY - 2, pageWidth - 40, descHeight, 3, 3, 'S')
        
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.text(' Description', 25, currentY + 5)
        currentY += 12
        
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(60, 60, 60)
        pdf.text(descLines, 25, currentY)
        currentY += (descLines.length * 6) + 10
      }
      
      // Liste des œuvres avec en-tête stylisé
      if (galerie.oeuvres_list && galerie.oeuvres_list.length > 0) {
        // Barre colorée à gauche du titre
        pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.rect(20, currentY - 2, 4, 10, 'F')
        
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2])
        pdf.text(' Œuvres de la galerie', 28, currentY + 5)
        currentY += 15
        
        // Double ligne séparatrice décorative
        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.setLineWidth(1)
        pdf.line(20, currentY, pageWidth - 20, currentY)
        
        pdf.setDrawColor(164, 176, 190)
        pdf.setLineWidth(0.3)
        pdf.line(20, currentY + 1.5, pageWidth - 20, currentY + 1.5)
        currentY += 12
        
        // Liste des œuvres avec images
        for (const [index, oeuvre] of galerie.oeuvres_list.entries()) {
          // Vérifier si on a besoin d'une nouvelle page
          if (currentY > pageHeight - 80) {
            pdf.addPage()
            currentY = 20
          }
          
          // Numéro et titre de l'œuvre
          pdf.setFontSize(11)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
          pdf.text(`${index + 1}.`, 20, currentY)
          
          pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2])
          const titleLines = pdf.splitTextToSize(oeuvre.titre, pageWidth - 90)
          pdf.text(titleLines, 28, currentY)
          currentY += (titleLines.length * 6)
          
          // Essayer de charger et ajouter l'image de l'œuvre
          if (oeuvre.image) {
            try {
              const oeuvreImg = new Image()
              oeuvreImg.crossOrigin = 'anonymous'
              
              await new Promise((resolve, reject) => {
                oeuvreImg.onload = () => resolve()
                oeuvreImg.onerror = () => reject(new Error('Erreur chargement image'))
                oeuvreImg.src = oeuvre.image.startsWith('http') ? oeuvre.image : `http://localhost:8000${oeuvre.image}`
              })
              
              // Créer un canvas pour l'image
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              canvas.width = oeuvreImg.width
              canvas.height = oeuvreImg.height
              ctx.drawImage(oeuvreImg, 0, 0)
              
               const imgData = canvas.toDataURL('image/jpeg', 0.85)
               
               // Calculer les dimensions (image plus grande)
               const maxImgWidth = 80
               const maxImgHeight = 60
               
               let imgWidth = oeuvreImg.width * 0.264583 // px to mm
               let imgHeight = oeuvreImg.height * 0.264583
               
               const ratio = Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight)
               imgWidth *= ratio
               imgHeight *= ratio
               
               // Ajouter l'image à gauche avec bordure
               pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
               pdf.setLineWidth(0.5)
               pdf.rect(28, currentY - 1, imgWidth + 2, imgHeight + 2, 'S')
               
               pdf.addImage(imgData, 'JPEG', 29, currentY, imgWidth, imgHeight)
              
               // Description à droite de l'image
               if (oeuvre.description) {
                 pdf.setFontSize(9)
                 pdf.setFont('helvetica', 'normal')
                 pdf.setTextColor(80, 80, 80)
                 const descText = oeuvre.description.length > 250 ? oeuvre.description.substring(0, 250) + '...' : oeuvre.description
                 const descLines = pdf.splitTextToSize(descText, pageWidth - imgWidth - 48)
                 pdf.text(descLines, 32 + imgWidth, currentY + 5)
               }
               
               currentY += Math.max(imgHeight + 2, 15) + 12
              
            } catch (err) {
              console.warn(`Image non chargée pour ${oeuvre.titre}`)
              
              // Si l'image ne charge pas, juste afficher la description
              if (oeuvre.description) {
                pdf.setFontSize(9)
                pdf.setFont('helvetica', 'normal')
                pdf.setTextColor(100, 100, 100)
                const descText = oeuvre.description.length > 150 ? oeuvre.description.substring(0, 150) + '...' : oeuvre.description
                const descLines = pdf.splitTextToSize(descText, pageWidth - 50)
                pdf.text(descLines, 28, currentY)
                currentY += (descLines.length * 5) + 8
              } else {
                currentY += 5
              }
            }
          } else {
            // Pas d'image, juste la description
            if (oeuvre.description) {
              pdf.setFontSize(9)
              pdf.setFont('helvetica', 'normal')
              pdf.setTextColor(100, 100, 100)
              const descText = oeuvre.description.length > 150 ? oeuvre.description.substring(0, 150) + '...' : oeuvre.description
              const descLines = pdf.splitTextToSize(descText, pageWidth - 50)
              pdf.text(descLines, 28, currentY)
              currentY += (descLines.length * 5) + 8
            } else {
              currentY += 5
            }
          }
        }
      }
      
      // Pied de page stylisé
      const footerY = pageHeight - 18
      
      // Ligne décorative au-dessus du pied de page
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.3)
      pdf.setLineWidth(0.5)
      pdf.line(30, footerY, pageWidth - 30, footerY)
      
      // Fond subtil pour le pied de page
      pdf.setFillColor(248, 248, 252)
      pdf.rect(0, footerY + 2, pageWidth, 16, 'F')
      
      // Texte du pied de page
      pdf.setFontSize(8)
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFont('helvetica', 'bold')
      pdf.text('© 2024 Pixelette', pageWidth / 2, footerY + 8, { align: 'center' })
      
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(120, 120, 120)
      pdf.text('Galerie d\'Art Numérique', pageWidth / 2, footerY + 12, { align: 'center' })
      
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'italic')
      pdf.text(`Document généré le ${today}`, pageWidth / 2, footerY + 15, { align: 'center' })
      
      // Télécharger le PDF
      const fileName = `Galerie_${galerie.nom.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`
      pdf.save(fileName)
      
      setModal({
        show: true,
        title: 'Succès !',
        message: 'PDF de la galerie généré avec succès',
        type: 'success'
      })
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      setModal({
        show: true,
        title: 'Erreur',
        message: 'Erreur lors de la génération du PDF',
        type: 'error'
      })
    }
  }

  if (loading) {
    return (
      <div className="preloader">
        <div className="preloader-inner">
          <img src="/assets/img/logo/logo.png" alt="Artvista" style={{ maxHeight: '120px' }} />
          <span className="loader"></span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Modal
        show={modal.show}
        onClose={() => setModal({ ...modal, show: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
      
      <ConfirmModal
        show={confirmModal.show}
        onClose={() => setConfirmModal({ show: false, galerieId: null })}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette galerie ? Cette action est irréversible."
      />

      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Mes Galeries</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">MES GALERIES</li>
          </ul>
        </div>
      </div>

      {/* Galeries Area */}
      <div className="space">
        <div className="container">
          {/* Barre de recherche et filtres */}
          <div style={{ background: '#F8F7F4', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
            <div className="row align-items-center g-2">
              <div className="col-lg-4 col-md-12">
                <div className="input-group" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: '44px' }}>
                  <span className="input-group-text" style={{ 
                    background: '#fff', 
                    border: 'none', 
                    borderRadius: '10px 0 0 10px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <i className="fas fa-search" style={{ color: 'var(--theme-color)', fontSize: '1rem' }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher une galerie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      border: 'none',
                      padding: '0 12px',
                      fontSize: '14px',
                      background: '#fff',
                      height: '100%',
                      lineHeight: '44px'
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
                        color: '#7B7E86',
                        padding: '0 12px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-lg-2 col-md-4">
                <select
                  className="form-select"
                  value={filterPrivee}
                  onChange={(e) => setFilterPrivee(e.target.value)}
                  style={{ 
                    border: 'none',
                    padding: '11px 12px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    background: '#fff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    height: '44px'
                  }}
                >
                  <option value="all">Toutes</option>
                  <option value="public">Publiques</option>
                  <option value="private">Privées</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-4">
                <select
                  className="form-select"
                  value={filterTheme}
                  onChange={(e) => setFilterTheme(e.target.value)}
                  style={{ 
                    border: 'none',
                    padding: '11px 12px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    background: '#fff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    height: '44px'
                  }}
                >
                  <option value="all">Tous thèmes</option>
                  {allThemes.map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>
              <div className="col-lg-2 col-md-4">
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ 
                    border: 'none',
                    padding: '11px 12px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    background: '#fff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    height: '44px'
                  }}
                >
                  <option value="recent">Récentes</option>
                  <option value="oldest">Anciennes</option>
                  <option value="name">Nom A-Z</option>
                  <option value="oeuvres">Nb oeuvres</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-12">
                <Link to="/galeries/create" className="btn w-100" style={{ padding: '0 15px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-plus me-2"></i>Créer
                </Link>
              </div>
            </div>
          </div>

          {/* État vide */}
          {filteredGaleries.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-images fa-4x text-muted mb-4"></i>
              <h3 className="text-muted mb-3">
                {searchTerm || filterPrivee !== 'all' || filterTheme !== 'all' ? 
                  'Aucune galerie trouvée' : 
                  'Aucune galerie disponible'
                }
              </h3>
              <p className="text-muted mb-4">
                {searchTerm || filterPrivee !== 'all' || filterTheme !== 'all' ? 
                  'Essayez avec d\'autres critères de recherche' : 
                  'Commencez par créer votre première galerie !'
                }
              </p>
              {!searchTerm && filterPrivee === 'all' && filterTheme === 'all' && (
                <Link to="/galeries/create" className="btn btn-primary">
                  <i className="fas fa-plus me-2"></i>
                  Créer ma première galerie
                </Link>
              )}
            </div>
          )}

          {/* Liste de toutes les galeries avec slider pour chaque */}
          {filteredGaleries.length > 0 && filteredGaleries.map((galerie) => {
            const currentSlideIndex = currentSlides[galerie.id] || 0
            const oeuvresList = galerie.oeuvres_list || []
            const hasOeuvres = oeuvresList.length > 0
            const currentOeuvre = hasOeuvres ? oeuvresList[currentSlideIndex] : null

            return (
              <div key={galerie.id} style={{ marginBottom: '60px' }}>
                {/* Galerie hero style avec titre sur l'image */}
                <div className="hero-wrapper hero-3" style={{ marginBottom: '0', paddingBottom: '40px' }}>
                  <div className="container">
                    <div className="hero-style3">
                      <h1 className="hero-title">
                        {galerie.nom}
                      </h1>
                      <h1 className="hero-title style2">
                        {galerie.theme || 'Collection d\'Art'}
                      </h1>
                      
                      <div className="hero-thumb3-1">
                        {currentOeuvre?.image ? (
                          <img 
                            src={currentOeuvre.image} 
                            alt={currentOeuvre.titre}
                            style={{ 
                              width: '100%', 
                              height: 'auto',
                              borderRadius: '10px'
                            }}
                          />
                        ) : (
                          <img 
                            src="/assets/img/hero/hero_3_1.png" 
                            alt="Galerie d'art"
                          />
                        )}
                        
                        <Link 
                          to={`/galeries/${galerie.id}`}
                          className="btn gsap-magnetic"
                        >
                          Explorer
                        </Link>
                        
                        <div className="event-vanue-details">
                          <span>Créée le {new Date(galerie.date_creation).toLocaleDateString('fr-FR')}</span>
                          <span>{galerie.theme || 'Thème varié'}</span>
                          <span>{galerie.oeuvres_count || 0} œuvre(s)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Controls du slider pour cette galerie */}
                  {hasOeuvres && oeuvresList.length > 1 && (
                    <div className="container">
                      <div className="hero-slider1-controller-wrap">
                        <div className="slides-numbers">
                          <span className="active">{(currentSlideIndex + 1).toString().padStart(2, '0')}</span>
                          <span> / {oeuvresList.length.toString().padStart(2, '0')}</span>
                        </div>
                        <div className="icon-box">
                          <button onClick={() => prevSlide(galerie.id, oeuvresList.length)} className="icon-btn">
                            <svg width="24" height="14" viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6.74198 0L0 7L6.74198 14L7.87513 12.8234L3.06758 7.83189L24 7.83189V6.168L3.06773 6.168L7.87513 1.17658L6.74198 0Z" fill="currentColor"/>
                            </svg>
                          </button>
                          <button onClick={() => nextSlide(galerie.id, oeuvresList.length)} className="icon-btn">
                            <svg width="24" height="14" viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.258 14L24 7L17.258 0L16.1249 1.17658L20.9324 6.16811L2.45808e-07 6.16811V7.832L20.9323 7.832L16.1249 12.8234L17.258 14Z" fill="currentColor"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Boutons d'action pour la galerie */}
                <div className="text-center mt-3 mb-4">
                  <Link
                    to={`/galeries/${galerie.id}/oeuvres`}
                    className="btn btn-sm me-2"
                  >
                    <i className="fas fa-cog me-1"></i>
                    Gérer les œuvres
                  </Link>
                  <Link
                    to={`/galeries/${galerie.id}/edit`}
                    className="btn btn-sm me-2"
                    style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', color: '#fff' }}
                  >
                    <i className="fas fa-edit me-1"></i>
                    Modifier
                  </Link>
                  <button
                    onClick={() => generateGaleriePDF(galerie)}
                    className="btn btn-sm me-2"
                    style={{ backgroundColor: '#28a745', borderColor: '#28a745', color: '#fff' }}
                  >
                    <i className="fas fa-file-pdf me-1"></i>
                    Exporter PDF
                  </button>
                  <button
                    onClick={() => handleDeleteClick(galerie.id)}
                    className="btn btn-sm"
                    style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}
                  >
                    <i className="fas fa-trash me-1"></i>
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default MesGaleries


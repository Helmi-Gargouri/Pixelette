import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'



const OeuvreDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, token } = useAuth()
  const [oeuvre, setOeuvre] = useState(null)
  const [auteur, setAuteur] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'success' })
  const [confirmModal, setConfirmModal] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  
  // États pour les interactions
  const [interactionStats, setInteractionStats] = useState({
    total_likes: 0,
    total_commentaires: 0,
    total_partages: 0,
    liked: false
  })
  const [comments, setComments] = useState([])
  const [allComments, setAllComments] = useState([]) // Tous les commentaires
  const [visibleComments, setVisibleComments] = useState(3) // Nombre de commentaires visibles
  const [newComment, setNewComment] = useState('')

  const [interactionDetails, setInteractionDetails] = useState({
    likes: [],
    commentaires: [],
    partages: []
  }) // Détails des personnes ayant interagi
  const [hoveredStat, setHoveredStat] = useState(null) // Statistique survolée
  const [loadingInteractions, setLoadingInteractions] = useState({
    like: false,
    comment: false,
    stats: false
  })
  
  // États pour les réponses aux commentaires
  const [replyingTo, setReplyingTo] = useState(null) // ID du commentaire auquel on répond
  const [newReply, setNewReply] = useState('') // Contenu de la réponse
  const [loadingReply, setLoadingReply] = useState(false)
  const [showReplies, setShowReplies] = useState({}) // Pour afficher/masquer les réponses de chaque commentaire

  // États pour la génération IA de commentaires
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [showAISuggestions, setShowAISuggestions] = useState(false)

  // Fonction utilitaire pour faire des requêtes avec authentification
  const makeAuthenticatedRequest = (method, url, data = null) => {
    const config = {
      method,
      url,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    // Ajouter le header Authorization si un token est disponible
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }

    // Ajouter les données si nécessaire
    if (data && (method === 'post' || method === 'put' || method === 'patch')) {
      config.data = data
    }

    return axios(config)
  }
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const MEDIA_BASE = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8000';
  useEffect(() => {
    fetchOeuvre()
    // eslint-disable-next-line react-hooks/exhaustive-deps
     axios.post(`${API_BASE}consultations/`, { 
      oeuvre_id: id 
    }, { withCredentials: true }).catch(() => {})
  }, [id])

  // Charger les interactions après avoir chargé l'œuvre
  useEffect(() => {
    if (oeuvre) {
      fetchInteractionStats()
      checkUserLike()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oeuvre, isAuthenticated, user])

  // Mettre à jour l'affichage des commentaires quand la pagination change
  useEffect(() => {
    if (allComments.length > 0) {
      setComments(allComments.slice(0, visibleComments))
    }
  }, [allComments, visibleComments])



  const fetchOeuvre = async () => {
    try {
      const response = await axios.get(`${API_BASE}oeuvres/${id}/`, {
        withCredentials: true
      })
      setOeuvre(response.data)
      
      // Fetch auteur details
      if (response.data.auteur) {
        const auteurResponse = await axios.get(
          `${API_BASE}utilisateurs/${response.data.auteur}/`,
          { withCredentials: true }
        )
        setAuteur(auteurResponse.data)
      }
      
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError('Erreur lors du chargement de l\'oeuvre')
      setLoading(false)
    }
  }

  // Fonction pour charger les statistiques d'interactions
  const fetchInteractionStats = async () => {
    try {
      setLoadingInteractions(prev => ({ ...prev, stats: true }))
      
      const response = await axios.get(
        `${API_BASE}interactions/stats_by_oeuvre/?oeuvre=${id}`,
        { withCredentials: true }
      )
      
      setInteractionStats({
        total_likes: response.data.total_likes || 0,
        total_commentaires: response.data.total_commentaires || 0,
        total_partages: response.data.total_partages || 0,
        liked: false // À déterminer en fonction de l'utilisateur connecté
      })

      // Charger TOUS les commentaires pour cette œuvre
      await fetchAllComments()

      // Charger les détails des interactions pour les tooltips
      await fetchInteractionDetails()

      setLoadingInteractions(prev => ({ ...prev, stats: false }))
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err)
      setLoadingInteractions(prev => ({ ...prev, stats: false }))
    }
  }

  // Fonction pour récupérer TOUS les commentaires de l'œuvre avec leurs réponses
  const fetchAllComments = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}interactions/comments_with_replies/?oeuvre=${id}`,
        { withCredentials: true }
      )
      
      const commentsData = response.data.comments || []
      console.log(`✅ Chargé ${commentsData.length} commentaires avec réponses pour l'œuvre ${id}:`, commentsData)
      
      setAllComments(commentsData)
      setComments(commentsData.slice(0, visibleComments)) // Afficher seulement les 3 premiers
      
    } catch (err) {
      console.error('Erreur lors du chargement des commentaires avec réponses:', err)
      // Fallback vers l'ancienne méthode si le nouvel endpoint n'est pas disponible
      try {
        const fallbackResponse = await axios.get(
          `${API_BASE}interactions/?oeuvre=${id}&type=commentaire`,
          { withCredentials: true }
        )
        
        const commentaires = fallbackResponse.data.sort((a, b) => new Date(b.date) - new Date(a.date))
        setAllComments(commentaires)
        setComments(commentaires.slice(0, visibleComments))
        console.log(`⚠️ Fallback: Chargé ${commentaires.length} commentaires simples`)
      } catch (fallbackError) {
        console.error('Erreur lors du fallback des commentaires:', fallbackError)
      }
    }
  }



  // Fonction pour récupérer les détails des interactions (pour les tooltips)
  const fetchInteractionDetails = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}interactions/?oeuvre=${id}`,
        { withCredentials: true }
      )
      
      const interactions = response.data
      
      // Grouper par type d'interaction
      const likes = interactions
        .filter(i => i.type === 'like')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10) // Limiter à 10 pour éviter un tooltip trop long
      
      const commentaires = interactions
        .filter(i => i.type === 'commentaire')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
      
      const partages = interactions
        .filter(i => i.type === 'partage')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
      
      setInteractionDetails({
        likes,
        commentaires,
        partages
      })
      
      console.log(`✅ Détails des interactions chargés:`, { likes, commentaires, partages })
    } catch (err) {
      console.error('Erreur lors du chargement des détails des interactions:', err)
    }
  }



  // Fonction pour vérifier si l'utilisateur a déjà liké l'œuvre
  const checkUserLike = async () => {
    if (!isAuthenticated || !user) return

    try {
      const response = await axios.get(
        `${API_BASE}interactions/?oeuvre=${id}&type=like`,
        { withCredentials: true }
      )
      
      const userLike = response.data.find(
        interaction => interaction.utilisateur === user.id
      )
      
      setInteractionStats(prev => ({ 
        ...prev, 
        liked: !!userLike 
      }))
    } catch (err) {
      console.error('Erreur lors de la vérification du like:', err)
    }
  }

  // Fonction pour afficher plus de commentaires
  const loadMoreComments = () => {
    const nextVisible = Math.min(visibleComments + 3, allComments.length)
    setVisibleComments(nextVisible)
    setComments(allComments.slice(0, nextVisible))
  }

  // Fonction pour afficher moins de commentaires
  const showLessComments = () => {
    setVisibleComments(3)
    setComments(allComments.slice(0, 3))
  }

  // Fonction pour basculer l'affichage des réponses d'un commentaire
  const toggleReplies = (commentId) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
  }

  // Fonction pour démarrer une réponse à un commentaire
  const startReply = (commentId) => {
    setReplyingTo(commentId)
    setNewReply('')
  }

  // Fonction pour annuler une réponse
  const cancelReply = () => {
    setReplyingTo(null)
    setNewReply('')
  }

  // Fonction pour soumettre une réponse
  const handleSubmitReply = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      return // Silencieusement ignorer si pas connecté (le bouton ne devrait pas être visible)
    }

    if (!newReply.trim()) {
      return // Silencieusement ignorer si pas de contenu (le bouton devrait être disabled)
    }

    setLoadingReply(true)

    try {
      const response = await makeAuthenticatedRequest(
        'post',
        `${API_BASE}interactions/reply_to_comment/`,
        {
          parent: replyingTo,
          oeuvre: id,
          contenu: newReply.trim()
        }
      )

      console.log('✅ Réponse ajoutée:', response.data)
      
      // Réinitialiser le formulaire
      setNewReply('')
      setReplyingTo(null)
      
      // Recharger les commentaires pour afficher la nouvelle réponse
      await fetchAllComments()
      await fetchInteractionStats()
      await fetchInteractionDetails()

    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout de la réponse:', err)
      
      let modalConfig = {
        show: true,
        title: 'Erreur',
        message: 'Erreur lors de l\'ajout de la réponse',
        type: 'error'
      }
      
      // Vérifier si c'est une erreur de modération conviviale
      if (err.response?.status === 400 && err.response?.data?.type === 'moderation_reject') {
        const moderationError = err.response.data
        modalConfig = {
          show: true,
          title: moderationError.title || '🚫 Réponse non autorisée',
          message: moderationError.message?.replace('commentaire', 'réponse') || 'Votre réponse ne peut pas être publiée',
          suggestion: moderationError.suggestion?.replace('commentaire', 'réponse'),
          filteredPreview: moderationError.filtered_preview,
          details: moderationError.details,
          type: 'moderation'
        }
      } else if (err.response?.status === 500) {
        modalConfig.message = 'Erreur serveur. Vérifiez que vous êtes bien connecté.'
      } else if (err.response?.status === 401) {
        modalConfig.message = 'Vous devez être connecté pour répondre.'
      } else if (err.response?.status === 403) {
        modalConfig.message = 'Vous n\'avez pas l\'autorisation de répondre.'
      } else if (err.response?.data?.detail) {
        modalConfig.message = err.response.data.detail
      } else if (err.response?.data?.error) {
        modalConfig.message = err.response.data.error
      } else if (err.message) {
        modalConfig.message = err.message
      }
      
      setModal(modalConfig)
    } finally {
      setLoadingReply(false)
    }
  }

  // Fonction pour générer un commentaire avec l'IA
  const handleGenerateAIComment = async () => {
    if (!isAuthenticated) {
      setModal({
        show: true,
        title: 'Connexion requise',
        message: 'Vous devez être connecté pour utiliser l\'IA',
        type: 'error'
      })
      return
    }

    try {
      setLoadingAI(true)
      
      const response = await makeAuthenticatedRequest(
        'post',
       `${API_BASE}oeuvres/${id}/generate_ai_comment/`,
        {}
      )

      if (response.data.success) {
        // Insérer le commentaire généré dans le textarea
        setNewComment(response.data.comment)
        
        // Afficher une notification discrète au lieu d'une modal qui bloque
        console.log(`✨ Commentaire IA généré - Style: ${response.data.style}, Confiance: ${(response.data.confidence * 100).toFixed(0)}%`)
        
        // Optionnel: afficher une notification temporaire
        const notification = document.createElement('div')
        notification.innerHTML = `
          <div style="
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #4CAF50; 
            color: white; 
            padding: 12px 20px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
            z-index: 9999;
            font-family: Arial, sans-serif;
            font-size: 14px;
          ">
            ✨ Commentaire IA généré avec succès !
          </div>
        `
        document.body.appendChild(notification)
        setTimeout(() => {
          document.body.removeChild(notification)
        }, 3000)
        
      } else {
        setModal({
          show: true,
          title: 'Erreur IA',
          message: response.data.error || 'Impossible de générer le commentaire',
          type: 'error'
        })
      }
    } catch (err) {
      console.error('❌ Erreur génération IA:', err)
      
      let errorMessage = 'Erreur lors de la génération du commentaire IA'
      
      if (err.response?.status === 500) {
        errorMessage = 'Service IA temporairement indisponible. Vérifiez la configuration OpenAI.'
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      }
      
      setModal({
        show: true,
        title: 'Erreur IA',
        message: errorMessage,
        type: 'error'
      })
    } finally {
      setLoadingAI(false)
    }
  }

  // Fonction pour générer plusieurs suggestions IA
  const handleGenerateAISuggestions = async () => {
    try {
      setLoadingAI(true)
      
      const response = await makeAuthenticatedRequest(
        'post',
        `${API_BASE}oeuvres/${id}/generate_multiple_ai_comments/`,
        { count: 3 }
      )

      if (response.data.success) {
        setAiSuggestions(response.data.suggestions)
        setShowAISuggestions(true)
      }
    } catch (err) {
      console.error('❌ Erreur suggestions IA:', err)
    } finally {
      setLoadingAI(false)
    }
  }

  // Fonction pour sélectionner une suggestion IA
  const handleSelectAISuggestion = (suggestion) => {
    setNewComment(suggestion.comment)
    setShowAISuggestions(false)
    setModal({
      show: true,
      title: '✨ Suggestion sélectionnée',
      message: `Style "${suggestion.style}" appliqué au commentaire`,
      type: 'success'
    })
  }

  // Fonction pour toggle like
  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      setModal({
        show: true,
        title: 'Connexion requise',
        message: 'Vous devez être connecté pour liker une œuvre',
        type: 'error'
      })
      return
    }

    try {
      setLoadingInteractions(prev => ({ ...prev, like: true }))
      
      const response = await makeAuthenticatedRequest(
        'post',
        `${API_BASE}interactions/toggle_like/`,
        { oeuvre: parseInt(id) } // Convertir en entier
      )

      setInteractionStats(prev => ({
        ...prev,
        liked: response.data.liked,
        total_likes: response.data.total_likes
      }))

      // Recharger les détails des interactions pour les tooltips
      await fetchInteractionDetails()

      setLoadingInteractions(prev => ({ ...prev, like: false }))
    } catch (err) {
      console.error('Erreur lors du toggle like:', err)
      setModal({
        show: true,
        title: 'Erreur',
        message: 'Erreur lors de l\'action like',
        type: 'error'
      })
      setLoadingInteractions(prev => ({ ...prev, like: false }))
    }
  }

  // Fonction pour ajouter un commentaire
  const handleAddComment = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      setModal({
        show: true,
        title: 'Connexion requise',
        message: 'Vous devez être connecté pour commenter',
        type: 'error'
      })
      return
    }

    if (!newComment.trim()) {
      setModal({
        show: true,
        title: 'Erreur',
        message: 'Le commentaire ne peut pas être vide',
        type: 'error'
      })
      return
    }



    try {
      setLoadingInteractions(prev => ({ ...prev, comment: true }))
      
      await makeAuthenticatedRequest(
        'post',
       `${API_BASE}interactions/`,
        {
          type: 'commentaire',
          oeuvre: parseInt(id), // Convertir en entier
          contenu: newComment.trim()
        }
      )



      // Recharger les statistiques et tous les commentaires
      await fetchInteractionStats()
      setNewComment('')
      // Réinitialiser la pagination pour afficher le nouveau commentaire en premier
      setVisibleComments(3)
      
      // Recharger les détails des interactions pour les tooltips
      await fetchInteractionDetails()
      
      setLoadingInteractions(prev => ({ ...prev, comment: false }))
    } catch (err) {
      console.error('Erreur lors de l\'ajout du commentaire:', err)
      
      let modalConfig = {
        show: true,
        title: 'Erreur',
        message: 'Erreur lors de l\'ajout du commentaire',
        type: 'error'
      }
      
      // Vérifier si c'est une erreur de modération conviviale
      if (err.response?.status === 400 && err.response?.data?.type === 'moderation_reject') {
        const moderationError = err.response.data
        modalConfig = {
          show: true,
          title: moderationError.title || '🚫 Commentaire non autorisé',
          message: moderationError.message || 'Votre commentaire ne peut pas être publié',
          suggestion: moderationError.suggestion,
          filteredPreview: moderationError.filtered_preview,
          details: moderationError.details,
          type: 'moderation'
        }
      } else if (err.response?.status === 500) {
        modalConfig.message = 'Erreur serveur. Vérifiez que vous êtes bien connecté.'
      } else if (err.response?.status === 401) {
        modalConfig.message = 'Vous devez être connecté pour commenter.'
      } else if (err.response?.status === 403) {
        modalConfig.message = 'Vous n\'avez pas l\'autorisation de commenter.'
      } else if (err.response?.data?.detail) {
        modalConfig.message = err.response.data.detail
      } else if (err.response?.data?.error) {
        modalConfig.message = err.response.data.error
      } else if (err.message) {
        modalConfig.message = err.message
      }
      
      setModal(modalConfig)
      setLoadingInteractions(prev => ({ ...prev, comment: false }))
    }
  }



  const handleDeleteClick = () => {
    setConfirmModal(true)
  }

  const handleDeleteConfirm = async () => {
    setConfirmModal(false)

    try {
      await axios.delete(`${API_BASE}oeuvres/${id}/`, {
        withCredentials: true
      })
      setModal({ 
        show: true, 
        title: 'Succès !', 
        message: 'Oeuvre supprimée avec succès', 
        type: 'success' 
      })
    } catch (err) {
      console.error(err)
      setModal({ 
        show: true, 
        title: 'Erreur', 
        message: 'Erreur lors de la suppression', 
        type: 'error' 
      })
    }
  }

  const handleModalClose = () => {
    setModal({ ...modal, show: false })
    if (modal.type === 'success') {
      // Déterminer si l'utilisateur est propriétaire pour la redirection
      const isOwner = isAuthenticated && user?.id === oeuvre?.auteur
      navigate(isOwner ? '/mes-oeuvres' : '/oeuvres')
    }
  }

  // Fonctions de partage sur les réseaux sociaux
  const currentUrl = window.location.href
  const shareTitle = oeuvre?.titre || 'Découvrez cette œuvre'
  const shareDescription = oeuvre?.description || 'Une magnifique œuvre sur Pixelette'
  
  const handleShare = async (platform) => {
    let url = ''
    const encodedUrl = encodeURIComponent(currentUrl)
    const encodedTitle = encodeURIComponent(shareTitle)
    const encodedDescription = encodeURIComponent(shareDescription)
    
    switch (platform) {
      case 'facebook':
        // Facebook Dialog avec tous les paramètres
        url = `https://www.facebook.com/dialog/share?app_id=YOUR_APP_ID&display=popup&href=${encodedUrl}&quote=${encodedTitle}`
        // Alternative plus simple qui fonctionne mieux
        url = `https://www.facebook.com/sharer.php?u=${encodedUrl}&quote=${encodedTitle}&description=${encodedDescription}`
        break
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=Pixelette`
        break
      case 'linkedin':
        // LinkedIn Share avec titre et résumé
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}&source=Pixelette`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedTitle}%20-%20${encodedUrl}`
        break
      case 'pinterest':
        {
          const imageUrl = oeuvre?.image ? 
            (oeuvre.image.startsWith('http') ? oeuvre.image : `${window.location.origin}${oeuvre.image}`) : 
            ''
          url = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(imageUrl)}&description=${encodedTitle}%20-%20${encodedDescription}`
        }
        break
      default:
        return
    }
    
    // Enregistrer le partage dans la base de données si l'utilisateur est connecté
    if (isAuthenticated) {
      try {
        await makeAuthenticatedRequest(
          'post',
          `${API_BASE}interactions/`,
          {
            type: 'partage',
            oeuvre: parseInt(id), // Convertir en entier
            plateforme_partage: platform
          }
        )
        
        // Mettre à jour les statistiques
        setInteractionStats(prev => ({
          ...prev,
          total_partages: prev.total_partages + 1
        }))
        
        // Recharger les détails des interactions pour les tooltips
        await fetchInteractionDetails()
      } catch (err) {
        console.error('Erreur lors de l\'enregistrement du partage:', err)
        // Ne pas empêcher le partage même si l'enregistrement échoue
      }
    }
    
    // Ouvrir dans une popup avec des dimensions optimales
    const width = 600
    const height = 600
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2
    window.open(url, '_blank', `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`)
  }
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setShowCopySuccess(true)
      setTimeout(() => setShowCopySuccess(false), 3000)
    }).catch(() => {
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = currentUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setShowCopySuccess(true)
      setTimeout(() => setShowCopySuccess(false), 3000)
    })
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

  if (error || !oeuvre) {
    return (
      <>
        <Modal
          show={modal.show}
          onClose={handleModalClose}
          title={modal.title}
          message={modal.message}
          type={modal.type}
        />
        <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
          <div className="container">
            <div className="breadcumb-content">
              <h1 className="breadcumb-title">Erreur</h1>
            </div>
          </div>
        </div>
        <div className="space">
          <div className="container">
            <div className="text-center">
              <h3>{error || 'Oeuvre non trouvée'}</h3>
              <Link to={backLink} className="btn mt-3">{backLabel}</Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  const canEdit = isAuthenticated && (user?.id === oeuvre.auteur || user?.role === 'admin')
  
  // Déterminer le lien de retour selon si l'utilisateur est propriétaire
  const isOwner = isAuthenticated && user?.id === oeuvre?.auteur
  const backLink = isOwner ? '/mes-oeuvres' : '/oeuvres'
  const backLabel = isOwner ? 'Retour à mes oeuvres' : 'Retour aux oeuvres'

  return (
    <>

      
      <Modal
        show={modal.show}
        onClose={handleModalClose}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
      
      <ConfirmModal
        show={confirmModal}
        onClose={() => setConfirmModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette oeuvre ? Cette action est irréversible."
      />
      
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Détails de l'Oeuvre</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li><Link to="/oeuvres">OEUVRES</Link></li>
            <li className="active">DÉTAILS</li>
          </ul>
        </div>
      </div>

      {/* Portfolio Details Area */}
      <section className="portfolio-details-page space">
        <div className="container">
          <div className="row">
            <div className="col-xl-12">
              {/* Contrôles de visualisation */}
              <div className="d-flex justify-content-center gap-2 mb-3">
                <button 
                  className="btn btn-sm"
                  onClick={() => setRotation(prev => prev - 90)}
                  title="Rotation antihoraire"
                >
                  <i className="fas fa-undo"></i>
                </button>
                <button 
                  className="btn btn-sm"
                  onClick={() => setRotation(prev => prev + 90)}
                  title="Rotation horaire"
                >
                  <i className="fas fa-redo"></i>
                </button>
                <button 
                  className="btn btn-sm"
                  onClick={() => setRotation(0)}
                  title="Réinitialiser"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>

              <div className="portfolio-img" style={{ 
                position: 'relative', 
                borderRadius: '10px', 
                overflow: 'hidden',
                background: '#f0f0f0'
              }}>
               {oeuvre.image ? (
                  <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={4}
                    centerOnInit={true}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <>
                        {/* Contrôles de zoom */}
                        <div style={{
                          position: 'absolute',
                          top: '20px',
                          right: '20px',
                          zIndex: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          <button 
                            onClick={() => zoomIn()}
                            className="btn btn-sm"
                            style={{ 
                              backgroundColor: 'rgba(0,0,0,0.7)', 
                              borderColor: 'transparent', 
                              color: '#fff',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              padding: 0
                            }}
                            title="Zoom avant"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                          <button 
                            onClick={() => zoomOut()}
                            className="btn btn-sm"
                            style={{ 
                              backgroundColor: 'rgba(0,0,0,0.7)', 
                              borderColor: 'transparent', 
                              color: '#fff',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              padding: 0
                            }}
                            title="Zoom arrière"
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <button 
                            onClick={() => resetTransform()}
                            className="btn btn-sm"
                            style={{ 
                              backgroundColor: 'rgba(0,0,0,0.7)', 
                              borderColor: 'transparent', 
                              color: '#fff',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              padding: 0
                            }}
                            title="Réinitialiser zoom"
                          >
                            <i className="fas fa-compress"></i>
                          </button>
                        </div>

                        <TransformComponent
                          wrapperStyle={{
                            width: '100%',
                            height: '600px',
                            borderRadius: '10px'
                          }}
                          contentStyle={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <img 
                          src={oeuvre.image.startsWith('http') 
                ? oeuvre.image 
                : `${MEDIA_BASE}${oeuvre.image}`
              }
                     alt={oeuvre.titre}
                            style={{ 
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              transform: `rotate(${rotation}deg)`,
                              transition: 'transform 0.3s ease',
                              cursor: 'grab'
                            }}
                     onError={(e) => {
                              e.target.onerror = null
                              e.target.src = '/assets/img/portfolio/portfolio_page1_3.png'
                     }}
                   />
                        </TransformComponent>
                      </>
                    )}
                  </TransformWrapper>
               ) : (
                <div 
                    className="w-100 d-flex align-items-center justify-content-center"
                    style={{ 
                      height: '400px', 
                      background: '#f0f0f0',
                      borderRadius: '10px'
                    }}
                >
                  <i className="fas fa-image fa-5x text-muted"></i>
                </div>
              )}
              </div>

              {/* Légende des contrôles */}
              <div className="text-center mt-3">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Utilisez la molette de la souris ou les boutons pour zoomer • Cliquez et glissez pour déplacer
                </small>
              </div>
                </div>

            <div className="col-xl-8">
              <div className="portfolio-details-wrap mt-40">
                <h2 className="fw-semibold mb-20">{oeuvre.titre}</h2>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#666' }}>
                    {oeuvre.description}
                  </p>

                {/* Actions pour l'auteur/admin */}
                 {canEdit && (
                  <>
                    <h3 className="fw-semibold mt-40 mb-20">Actions</h3>
                    <div className="d-flex gap-3">
                     <Link 
                       to={`/oeuvres/${id}/edit`} 
                       className="btn"
                       style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', color: '#fff' }}
                     >
                       <i className="fas fa-edit me-2"></i>
                        Modifier cette oeuvre
                     </Link>
                     <button 
                       onClick={handleDeleteClick} 
                       className="btn"
                        style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}
                     >
                       <i className="fas fa-trash me-2"></i>
                       Supprimer
                     </button>
                   </div>
                  </>
                 )}
              </div>
            </div>

            {/* Section Interactions */}
            <div className="col-xl-8">
              <div className="portfolio-details-wrap mt-40">
                <h3 className="fw-semibold mb-3">
                  <i className="fas fa-users me-2"></i>
                  Interactions
                </h3>
                
                {/* Panneau d'interactions unifié */}
                <div className="interaction-panel" style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: '1px solid #e0e0e0',
                  marginBottom: '30px'
                }}>
                  {/* Statistiques en haut */}
                  <div className="stats-row mb-4" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    flexWrap: 'wrap',
                    position: 'relative'
                  }}>
                    {/* Stat Likes avec tooltip */}
                    <div 
                      className="stat-item text-center"
                      style={{ 
                        cursor: interactionDetails.likes.length > 0 ? 'pointer' : 'default',
                        position: 'relative',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={() => setHoveredStat('likes')}
                      onMouseLeave={() => setHoveredStat(null)}
                    >
                      <div className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                        {interactionStats.total_likes}
                      </div>
                      <div className="stat-label" style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                        <i className="fas fa-heart me-1"></i>Likes
                      </div>
                      
                      {/* Tooltip Likes */}
                      {hoveredStat === 'likes' && interactionDetails.likes.length > 0 && (
                        <div 
                          className="interaction-tooltip"
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '10px',
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '10px',
                            padding: '12px',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: '200px',
                            maxWidth: '300px',
                            animation: 'fadeInUp 0.2s ease'
                          }}
                        >
                          <div className="tooltip-header mb-2" style={{
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: '#dc3545',
                            borderBottom: '1px solid #f0f0f0',
                            paddingBottom: '8px'
                          }}>
                            <i className="fas fa-heart me-1"></i>
                            Personnes qui ont aimé
                          </div>
                          <div className="tooltip-content">
                            {interactionDetails.likes.slice(0, 5).map((like) => (
                              <div 
                                key={like.id}
                                className="tooltip-item d-flex align-items-center mb-1"
                                style={{ fontSize: '0.8rem' }}
                              >
                                <div 
                                  className="mini-avatar me-2"
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: '#dc3545',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {like.utilisateur_nom?.charAt(0) || 'U'}
                                </div>
                                <span style={{ color: '#333' }}>
                                  {like.utilisateur_nom || 'Utilisateur anonyme'}
                                </span>
                              </div>
                            ))}
                            {interactionDetails.likes.length > 5 && (
                              <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '8px', textAlign: 'center' }}>
                                et {interactionDetails.likes.length - 5} autre{interactionDetails.likes.length - 5 > 1 ? 's' : ''}...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stat Commentaires avec tooltip */}
                    <div 
                      className="stat-item text-center"
                      style={{ 
                        cursor: interactionDetails.commentaires.length > 0 ? 'pointer' : 'default',
                        position: 'relative',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={() => setHoveredStat('commentaires')}
                      onMouseLeave={() => setHoveredStat(null)}
                    >
                      <div className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                        {interactionStats.total_commentaires}
                      </div>
                      <div className="stat-label" style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                        <i className="fas fa-comment me-1"></i>Commentaires
                      </div>
                      
                      {/* Tooltip Commentaires */}
                      {hoveredStat === 'commentaires' && interactionDetails.commentaires.length > 0 && (
                        <div 
                          className="interaction-tooltip"
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '10px',
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '10px',
                            padding: '12px',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: '250px',
                            maxWidth: '350px',
                            animation: 'fadeInUp 0.2s ease'
                          }}
                        >
                          <div className="tooltip-header mb-2" style={{
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: '#007bff',
                            borderBottom: '1px solid #f0f0f0',
                            paddingBottom: '8px'
                          }}>
                            <i className="fas fa-comment me-1"></i>
                            Commentaires récents
                          </div>
                          <div className="tooltip-content">
                            {interactionDetails.commentaires.slice(0, 3).map((comment) => (
                              <div 
                                key={comment.id}
                                className="tooltip-item mb-2"
                                style={{ fontSize: '0.8rem' }}
                              >
                                <div className="d-flex align-items-start">
                                  <div 
                                    className="mini-avatar me-2"
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      backgroundColor: '#007bff',
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#fff',
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      flexShrink: 0
                                    }}
                                  >
                                    {comment.utilisateur_nom?.charAt(0) || 'U'}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: '600', color: '#333', fontSize: '0.75rem' }}>
                                      {comment.utilisateur_nom || 'Utilisateur anonyme'}
                                    </div>
                                    <div style={{ color: '#6c757d', fontSize: '0.7rem', fontStyle: 'italic' }}>
                                      {comment.contenu ? 
                                        (comment.contenu.length > 50 ? 
                                          `"${comment.contenu.substring(0, 50)}..."` : 
                                          `"${comment.contenu}"`) : 
                                        'Commentaire...'
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {interactionDetails.commentaires.length > 3 && (
                              <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '8px', textAlign: 'center' }}>
                                et {interactionDetails.commentaires.length - 3} autre{interactionDetails.commentaires.length - 3 > 1 ? 's' : ''} commentaire{interactionDetails.commentaires.length - 3 > 1 ? 's' : ''}...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stat Partages avec tooltip */}
                    <div 
                      className="stat-item text-center"
                      style={{ 
                        cursor: interactionDetails.partages.length > 0 ? 'pointer' : 'default',
                        position: 'relative',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={() => setHoveredStat('partages')}
                      onMouseLeave={() => setHoveredStat(null)}
                    >
                      <div className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                        {interactionStats.total_partages}
                      </div>
                      <div className="stat-label" style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                        <i className="fas fa-share me-1"></i>Partages
                      </div>
                      
                      {/* Tooltip Partages */}
                      {hoveredStat === 'partages' && interactionDetails.partages.length > 0 && (
                        <div 
                          className="interaction-tooltip"
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '10px',
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '10px',
                            padding: '12px',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: '220px',
                            maxWidth: '320px',
                            animation: 'fadeInUp 0.2s ease'
                          }}
                        >
                          <div className="tooltip-header mb-2" style={{
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: '#28a745',
                            borderBottom: '1px solid #f0f0f0',
                            paddingBottom: '8px'
                          }}>
                            <i className="fas fa-share me-1"></i>
                            Partages récents
                          </div>
                          <div className="tooltip-content">
                            {interactionDetails.partages.slice(0, 5).map((partage) => (
                              <div 
                                key={partage.id}
                                className="tooltip-item d-flex align-items-center justify-content-between mb-1"
                                style={{ fontSize: '0.8rem' }}
                              >
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="mini-avatar me-2"
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      backgroundColor: '#28a745',
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#fff',
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {partage.utilisateur_nom?.charAt(0) || 'U'}
                                  </div>
                                  <span style={{ color: '#333', fontSize: '0.75rem' }}>
                                    {partage.utilisateur_nom || 'Utilisateur anonyme'}
                                  </span>
                                </div>
                                {partage.plateforme_partage && (
                                  <span 
                                    className="badge bg-light text-dark"
                                    style={{ fontSize: '0.65rem', padding: '2px 6px' }}
                                  >
                                    <i className={`fab fa-${partage.plateforme_partage} me-1`}></i>
                                    {partage.plateforme_partage}
                                  </span>
                                )}
                              </div>
                            ))}
                            {interactionDetails.partages.length > 5 && (
                              <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '8px', textAlign: 'center' }}>
                                et {interactionDetails.partages.length - 5} autre{interactionDetails.partages.length - 5 > 1 ? 's' : ''} partage{interactionDetails.partages.length - 5 > 1 ? 's' : ''}...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Boutons d'actions */}
                  {isAuthenticated ? (
                    <div className="actions-row" style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '15px',
                      flexWrap: 'wrap',
                      alignItems: 'center'
                    }}>
                      {/* Bouton Like */}
                      <button 
                        onClick={handleToggleLike}
                        disabled={loadingInteractions.like}
                        className={`btn like-btn ${
                          interactionStats.liked 
                            ? 'btn-danger' 
                            : 'btn-outline-danger'
                        }`}
                        style={{ 
                          minWidth: '120px',
                          borderRadius: '25px',
                          padding: '10px 20px',
                          fontWeight: '500'
                        }}
                      >
                        {loadingInteractions.like ? (
                          <i className="fas fa-spinner fa-spin me-2"></i>
                        ) : (
                          <i className={`${interactionStats.liked ? 'fas' : 'far'} fa-heart me-2`}></i>
                        )}
                        {interactionStats.liked ? 'Aimé' : 'J\'aime'}
                      </button>

                      {/* Boutons de partage directs */}
                      <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center">
                        <small className="text-muted fw-semibold me-2" style={{ fontSize: '0.9rem' }}>
                          <i className="fas fa-share me-1"></i>Partager:
                        </small>
                        
                        <button 
                          className="btn btn-sm"
                          onClick={() => handleShare('facebook')}
                          style={{ 
                            backgroundColor: '#1877F2', 
                            border: 'none', 
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            minWidth: '80px'
                          }}
                          title="Partager sur Facebook"
                        >
                          <i className="fab fa-facebook-f me-1"></i>Facebook
                        </button>
                        
                        <button 
                          className="btn btn-sm"
                          onClick={() => handleShare('twitter')}
                          style={{ 
                            backgroundColor: '#1DA1F2', 
                            border: 'none', 
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            minWidth: '80px'
                          }}
                          title="Partager sur Twitter"
                        >
                          <i className="fab fa-twitter me-1"></i>Twitter
                        </button>
                        
                        <button 
                          className="btn btn-sm"
                          onClick={() => handleShare('linkedin')}
                          style={{ 
                            backgroundColor: '#0A66C2', 
                            border: 'none', 
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            minWidth: '80px'
                          }}
                          title="Partager sur LinkedIn"
                        >
                          <i className="fab fa-linkedin-in me-1"></i>LinkedIn
                        </button>
                        
                        <button 
                          className="btn btn-sm"
                          onClick={() => handleShare('whatsapp')}
                          style={{ 
                            backgroundColor: '#25D366', 
                            border: 'none', 
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            minWidth: '80px'
                          }}
                          title="Partager sur WhatsApp"
                        >
                          <i className="fab fa-whatsapp me-1"></i>WhatsApp
                        </button>
                        
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={handleCopyLink}
                          style={{ 
                            borderRadius: '8px',
                            padding: '8px 12px',
                            minWidth: '80px'
                          }}
                          title="Copier le lien"
                        >
                          <i className="fas fa-link me-1"></i>Lien
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="alert alert-info" style={{ 
                        border: 'none',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        borderRadius: '10px'
                      }}>
                        <i className="fas fa-info-circle me-2"></i>
                        <Link to="/login" className="fw-semibold text-decoration-none">Connectez-vous</Link> pour interagir avec cette œuvre
                      </div>
                    </div>
                  )}

                  {/* Notification de succès pour le copier */}
                  {showCopySuccess && (
                    <div style={{
                      position: 'fixed',
                      top: '20px',
                      right: '20px',
                      backgroundColor: '#28a745',
                      color: '#fff',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      boxShadow: '0 4px 20px rgba(40, 167, 69, 0.3)',
                      zIndex: 1050,
                      animation: 'slideInRight 0.3s ease'
                    }}>
                      <i className="fas fa-check-circle me-2"></i>Lien copié dans le presse-papier !
                    </div>
                  )}
                </div>



                {/* Section Commentaires */}
                <div className="comments-section" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: '1px solid #e0e0e0',
                  marginTop: '30px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                  <h3 className="fw-semibold mb-4" style={{
                    color: '#333',
                    borderBottom: '2px solid #007bff',
                    paddingBottom: '10px',
                    display: 'inline-block'
                  }}>
                    <i className="fas fa-comments me-2"></i>
                    Commentaires ({allComments.length > 0 ? allComments.length : interactionStats.total_commentaires})
                  </h3>

                  {/* Formulaire d'ajout de commentaire */}
                  {isAuthenticated ? (
                    <div className="comment-form" style={{
                      background: '#fff',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '25px',
                      border: '1px solid #e9ecef',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      <form onSubmit={handleAddComment}>
                        <div className="d-flex align-items-start gap-3">
                          {/* Avatar de l'utilisateur connecté */}
                          <div style={{
                            width: '45px',
                            height: '45px',
                            backgroundColor: '#007bff',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            flexShrink: 0
                          }}>
                            {user?.prenom?.charAt(0) || user?.nom?.charAt(0) || 'U'}
                          </div>
                          
                          <div className="flex-grow-1">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="form-control"
                              rows="3"
                              placeholder="Partagez vos impressions sur cette œuvre..."
                              disabled={loadingInteractions.comment}
                              style={{
                                border: '2px solid #e9ecef',
                                borderRadius: '10px',
                                padding: '12px 15px',
                                fontSize: '0.95rem',
                                transition: 'border-color 0.3s ease',
                                resize: 'vertical',
                                minHeight: '80px'
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#007bff'}
                              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                            />
                            <div className="d-flex justify-content-between align-items-center mt-3">
                              <div className="d-flex align-items-center gap-2">
                                <small className="text-muted">
                                  <i className="fas fa-info-circle me-1"></i>
                                  Soyez respectueux dans vos commentaires
                                </small>
                                
                                {/* Bouton génération IA */}
                                <button 
                                  type="button"
                                  onClick={handleGenerateAIComment}
                                  disabled={loadingAI || loadingInteractions.comment}
                                  className="btn btn-outline-success btn-sm"
                                  style={{
                                    borderRadius: '15px',
                                    padding: '4px 12px',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    border: '1px solid #28a745',
                                    background: loadingAI ? '#f8f9fa' : 'transparent'
                                  }}
                                  title="Générer un commentaire avec l'IA"
                                >
                                  {loadingAI ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin me-1"></i>
                                      IA...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-magic me-1"></i>
                                      ✨ IA
                                    </>
                                  )}
                                </button>
                              </div>
                              
                              <div className="d-flex gap-2">
                                <button 
                                  type="submit"
                                  disabled={loadingInteractions.comment || !newComment.trim()}
                                  className="btn btn-primary"
                                  style={{
                                    borderRadius: '20px',
                                    padding: '8px 25px',
                                    fontWeight: '500',
                                    minWidth: '120px'
                                  }}
                                >
                                {loadingInteractions.comment ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin me-2"></i>
                                    Publication...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-paper-plane me-2"></i>
                                    Publier
                                  </>
                                )}
                              </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="alert alert-info mb-4" style={{
                      border: 'none',
                      backgroundColor: 'rgba(13, 110, 253, 0.1)',
                      borderRadius: '12px',
                      padding: '20px'
                    }}>
                      <div className="text-center">
                        <i className="fas fa-user-circle fa-2x mb-3" style={{ color: '#007bff' }}></i>
                        <p className="mb-2">
                          <i className="fas fa-info-circle me-2"></i>
                          Vous devez être connecté pour commenter cette œuvre
                        </p>
                        <Link to="/login" className="btn btn-primary btn-sm" style={{ borderRadius: '20px' }}>
                          Se connecter
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Liste des commentaires */}
                  <div className="comments-list">
                    {loadingInteractions.stats ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary mb-3" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted">Chargement des commentaires...</p>
                      </div>
                    ) : comments.length > 0 ? (
                      <>
                        <div>
                          {comments.map((comment, index) => (
                            <div 
                              key={comment.id} 
                              className="comment-thread mb-4"
                              style={{ 
                                backgroundColor: '#fff', 
                                borderRadius: '12px',
                                border: '1px solid #e9ecef',
                                padding: '20px',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                marginLeft: index > 0 ? '15px' : '0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                                e.currentTarget.style.transform = 'translateY(-2px)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
                                e.currentTarget.style.transform = 'translateY(0)'
                              }}
                            >
                              {/* Commentaire principal */}
                              <div className="main-comment">
                                <div className="d-flex align-items-start gap-3">
                                  <div 
                                    className="avatar"
                                    style={{
                                      width: '45px',
                                      height: '45px',
                                      background: `linear-gradient(135deg, #007bff, #0056b3)`,
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#fff',
                                      fontWeight: 'bold',
                                      fontSize: '1.1rem',
                                      flexShrink: 0,
                                      border: '2px solid #fff',
                                      boxShadow: '0 2px 8px rgba(0,123,255,0.3)'
                                    }}
                                  >
                                    {comment.utilisateur_nom?.charAt(0) || 'U'}
                                  </div>
                                  <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <div>
                                        <h6 className="mb-1 fw-semibold" style={{ color: '#333', fontSize: '1rem' }}>
                                          {comment.utilisateur_nom || 'Utilisateur'}
                                        </h6>
                                        <small className="text-muted d-flex align-items-center">
                                          <i className="fas fa-clock me-1"></i>
                                          {new Date(comment.date).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </small>
                                      </div>
                                    </div>
                                    <div className="comment-content mb-3">
                                      <p className="mb-0" style={{ 
                                        lineHeight: '1.6', 
                                        color: '#555',
                                        fontSize: '0.95rem'
                                      }}>
                                        {comment.contenu}
                                      </p>
                                    </div>
                                    
                                    {/* Actions du commentaire */}
                                    <div className="comment-actions d-flex align-items-center gap-3 mb-3">
                                      {isAuthenticated && (
                                        <button 
                                          onClick={() => startReply(comment.id)}
                                          className="btn btn-sm btn-outline-primary"
                                          style={{ 
                                            fontSize: '0.8rem', 
                                            borderRadius: '20px',
                                            padding: '6px 15px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease'
                                          }}
                                        >
                                          <i className="fas fa-reply me-1"></i>
                                          Répondre
                                        </button>
                                      )}
                                      
                                      {comment.replies && comment.replies.length > 0 && (
                                        <button 
                                          onClick={() => toggleReplies(comment.id)}
                                          className={`btn btn-sm ${showReplies[comment.id] ? 'btn-warning' : 'btn-outline-info'}`}
                                          style={{ 
                                            fontSize: '0.8rem', 
                                            borderRadius: '20px',
                                            padding: '6px 15px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease'
                                          }}
                                        >
                                          <i className={`fas fa-${showReplies[comment.id] ? 'chevron-up' : 'chevron-down'} me-1`}></i>
                                          {showReplies[comment.id] ? 'Masquer' : 'Voir'} les réponses ({comment.replies.length})
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Formulaire de réponse */}
                                {replyingTo === comment.id && (
                                  <div className="reply-form mt-3 ms-5">
                                    <div 
                                      style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '12px',
                                        padding: '15px',
                                        border: '1px solid #e9ecef'
                                      }}
                                    >
                                      <form onSubmit={handleSubmitReply}>
                                        <div className="d-flex align-items-start gap-2">
                                          <div 
                                            style={{
                                              width: '35px',
                                              height: '35px',
                                              backgroundColor: '#28a745',
                                              borderRadius: '50%',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              color: '#fff',
                                              fontWeight: 'bold',
                                              fontSize: '0.9rem',
                                              flexShrink: 0
                                            }}
                                          >
                                            {user?.prenom?.charAt(0) || user?.nom?.charAt(0) || 'U'}
                                          </div>
                                          <div className="flex-grow-1">
                                            <textarea
                                              value={newReply}
                                              onChange={(e) => setNewReply(e.target.value)}
                                              className="form-control mb-2"
                                              rows="2"
                                              placeholder={`Répondre à ${comment.utilisateur_nom}...`}
                                              disabled={loadingReply}
                                              style={{
                                                border: '1px solid #dee2e6',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem'
                                              }}
                                            />
                                            <div className="d-flex gap-2">
                                              <button 
                                                type="submit"
                                                disabled={loadingReply || !newReply.trim()}
                                                className="btn btn-primary btn-sm"
                                                style={{ borderRadius: '15px', fontSize: '0.8rem' }}
                                              >
                                                {loadingReply ? (
                                                  <>
                                                    <i className="fas fa-spinner fa-spin me-1"></i>
                                                    Envoi...
                                                  </>
                                                ) : (
                                                  <>
                                                    <i className="fas fa-paper-plane me-1"></i>
                                                    Répondre
                                                  </>
                                                )}
                                              </button>
                                              <button 
                                                type="button"
                                                onClick={cancelReply}
                                                className="btn btn-secondary btn-sm"
                                                style={{ borderRadius: '15px', fontSize: '0.8rem' }}
                                              >
                                                Annuler
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </form>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Réponses */}
                              {comment.replies && comment.replies.length > 0 && showReplies[comment.id] && (
                                <div className="replies-section mt-3 ms-5">
                                  {comment.replies.map((reply) => (
                                    <div 
                                      key={reply.id} 
                                      className="reply-item mb-2"
                                      style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '10px',
                                        padding: '15px',
                                        border: '1px solid #e9ecef',
                                        borderLeft: '3px solid #007bff'
                                      }}
                                    >
                                      <div className="d-flex align-items-start gap-2">
                                        <div 
                                          style={{
                                            width: '35px',
                                            height: '35px',
                                            backgroundColor: '#6f42c1',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            flexShrink: 0
                                          }}
                                        >
                                          {reply.utilisateur_nom?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-grow-1">
                                          <div className="d-flex justify-content-between align-items-start mb-1">
                                            <h6 className="mb-0 fw-semibold" style={{ color: '#333', fontSize: '0.9rem' }}>
                                              {reply.utilisateur_nom || 'Utilisateur'}
                                            </h6>
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                              <i className="fas fa-clock me-1"></i>
                                              {new Date(reply.date).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </small>
                                          </div>
                                          <p className="mb-0" style={{ 
                                            lineHeight: '1.5', 
                                            color: '#555',
                                            fontSize: '0.85rem'
                                          }}>
                                            {reply.contenu}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Boutons de pagination des commentaires */}
                        {allComments.length > 3 && (
                          <div className="text-center mt-4">
                            {visibleComments < allComments.length ? (
                              <button 
                                onClick={loadMoreComments}
                                className="btn btn-outline-primary me-3"
                                style={{
                                  borderRadius: '25px',
                                  padding: '10px 25px',
                                  fontWeight: '500',
                                  border: '2px solid #007bff',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <i className="fas fa-chevron-down me-2"></i>
                                Afficher plus de commentaires ({allComments.length - visibleComments} restants)
                              </button>
                            ) : visibleComments > 3 && (
                              <button 
                                onClick={showLessComments}
                                className="btn btn-outline-secondary"
                                style={{
                                  borderRadius: '25px',
                                  padding: '10px 25px',
                                  fontWeight: '500',
                                  border: '2px solid #6c757d',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <i className="fas fa-chevron-up me-2"></i>
                                Afficher moins de commentaires
                              </button>
                            )}
                            
                            {/* Indicateur de progression */}
                            <div className="mt-3">
                              <small className="text-muted">
                                Affichage de {Math.min(visibleComments, allComments.length)} sur {allComments.length} commentaires
                              </small>
                              <div 
                                className="progress mt-2"
                                style={{ height: '6px', borderRadius: '10px' }}
                              >
                                <div 
                                  className="progress-bar bg-primary"
                                  role="progressbar"
                                  style={{ 
                                    width: `${(Math.min(visibleComments, allComments.length) / allComments.length) * 100}%`,
                                    borderRadius: '10px',
                                    transition: 'width 0.4s ease'
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-5">
                        <div style={{
                          padding: '40px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '15px',
                          border: '2px dashed #dee2e6'
                        }}>
                          <i className="fas fa-comments fa-4x mb-3 text-muted"></i>
                          <h5 className="mb-2 text-muted">Aucun commentaire pour le moment</h5>
                          <p className="text-muted mb-0">
                            Soyez le premier à partager votre opinion sur cette œuvre !
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>


              </div>
            </div>

            <div className="col-xl-4 sidebar-widget-area mt-50">
              <aside className="sidebar-sticky-area sidebar-area">
                <div className="widget widget-project-details">
                  <h3 className="widget_title">Informations sur l'Oeuvre</h3>
                  <ul>
                {auteur && (
                      <li>
                        <div className="icon"><i className="fas fa-user"></i></div>
                    <div className="media-body">
                          <span className="title">Artiste:</span>
                          <h6>{auteur.prenom} {auteur.nom}</h6>
                           </div>
                      </li>
                    )}
                    <li>
                      <div className="icon"><i className="fas fa-layer-group"></i></div>
                      <div className="media-body">
                        <span className="title">Catégorie:</span>
                        <h6>Oeuvre d'Art</h6>
                         </div>
                    </li>
                    <li>
                      <div className="icon"><i className="fas fa-calendar-alt"></i></div>
                      <div className="media-body">
                        <span className="title">Date de création:</span>
                        <h6>
                      {new Date(oeuvre.date_creation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                            year: 'numeric'
                      })}
                        </h6>
                      </div>
                    </li>
                    <li>
                      <div className="icon"><i className="fas fa-eye"></i></div>
                      <div className="media-body">
                        <span className="title">Vues:</span>
                        <h6>{oeuvre.vues || 0}</h6>
                      </div>
                    </li>
                    {auteur && auteur.email && (
                      <li>
                        <div className="icon"><i className="fas fa-envelope"></i></div>
                        <div className="media-body">
                          <span className="title">Contact:</span>
                          <h6>{auteur.email}</h6>
                        </div>
                    </li>
                    )}
                  </ul>

                  {/* Bouton retour */}
                  <div className="mt-4">
                    <Link to={backLink} className="btn w-100">
                      <i className="fas fa-arrow-left me-2"></i>
                      {backLabel}
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>


    </>
  )
}

export default OeuvreDetails

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isAuthenticated } = useAuth()
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendations()
    }
  }, [isAuthenticated])

const fetchRecommendations = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(
      `${API_BASE}/oeuvres/recommendations/`,
      {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true
      }
    )
    
    // ✅ AJOUTE CES LOGS
    console.log('📊 Réponse API:', response.data)
    console.log('📋 Première recommandation:', response.data.recommendations[0])
    
    setRecommendations(response.data.recommendations)
    setLoading(false)
  } catch (err) {
    console.error('Erreur:', err)
    setError('Erreur lors du chargement des recommandations')
    setLoading(false)
  }
}

  if (!isAuthenticated) {
    return (
      <div className="container text-center py-5">
        <h3>Connectez-vous pour voir vos recommandations</h3>
        <Link to="/login" className="btn mt-3">Se connecter</Link>
      </div>
    )
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

  if (error) {
    return (
      <div className="container text-center py-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    )
  }

  return (
    <>
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">🎨 Recommandé Pour Vous</h1>
            <p className="breadcumb-text">
              Œuvres sélectionnées selon vos goûts
            </p>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">ACCUEIL</Link></li>
            <li className="active">RECOMMANDATIONS</li>
          </ul>
        </div>
      </div>

      <div className="portfolio-standard-area space overflow-hidden">
        <div className="container">
          {recommendations.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-magic fa-3x text-muted mb-3"></i>
              <h3>Aucune recommandation pour le moment</h3>
              <p>Likez des œuvres et suivez des artistes pour recevoir des recommandations personnalisées !</p>
              <Link to="/oeuvres" className="btn mt-3">
                Explorer les œuvres
              </Link>
            </div>
          ) : (
            <>
              <div className="row">
                {recommendations.map((oeuvre) => (
                  <div key={oeuvre.id} className="col-lg-4 col-md-6 mb-4">
                    <Link 
                      to={`/oeuvres/${oeuvre.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="portfolio-card-4" style={{ 
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'transform 0.3s ease'
                      }}>
                        {/* Badge de score */}
                        <div style={{
                          position: 'absolute',
                          top: '15px',
                          left: '15px',
                          zIndex: 10,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          padding: '8px 15px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                        }}>
                          ⭐ {oeuvre.recommendation_score}
                        </div>

                        <div className="portfolio-thumb">
                          {oeuvre.image ? (
                            <img 
                              src={oeuvre.image.startsWith('http') 
                                ? oeuvre.image 
                                : `http://localhost:8000${oeuvre.image}`
                              } 
                              alt={oeuvre.titre}
                              style={{ 
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                borderRadius: '10px'
                              }}
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = '/assets/img/portfolio/portfolio_page1_3.png'
                              }}
                            />
                          ) : (
                            <img 
                              src="/assets/img/portfolio/portfolio_page1_3.png" 
                              alt={oeuvre.titre}
                              style={{ 
                                width: '100%', 
                                height: 'auto',
                                display: 'block',
                                borderRadius: '10px'
                              }}
                            />
                          )}
                        </div>

                        <div className="portfolio-details">
                          <span className="portfilio-card-subtitle" style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: '600'
                          }}>
                            {oeuvre.recommendation_reason}
                          </span>
                          <h3 className="portfilio-card-title">
                            {oeuvre.titre}
                          </h3>
                          {oeuvre.description && (
                            <p className="portfolio-description" style={{ 
                              color: '#666', 
                              fontSize: '0.95rem', 
                              marginTop: '15px',
                              lineHeight: '1.8'
                            }}>
                              {oeuvre.description.substring(0, 150)}
                              {oeuvre.description.length > 150 ? '...' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Recommendations
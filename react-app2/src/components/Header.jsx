import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = async () => {
    await logout()
    setDropdownOpen(false)
    window.location.href = '/'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="nav-header header-layout1">
      <div className="header-top d-md-block d-none">
        <div className="container">
          <div className="row justify-content-center justify-content-lg-between align-items-center gy-2">
            <div className="col-auto">
              <div className="header-links">
                <ul>
                  <li>
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 11.0312L11.9375 9.71875C11.25 9.40625 10.4688 9.625 10 10.1875L9.15625 11.2188C7.75 10.4062 6.59375 9.25 5.78125 7.875L6.84375 7.03125C7.375 6.5625 7.59375 5.78125 7.3125 5.125L5.96875 2C5.65625 1.28125 4.875 0.875 4.09375 1.0625L1.25 1.71875C0.5 1.875 0 2.53125 0 3.3125C0 10.875 6.125 17 13.6875 17C14.4688 17 15.125 16.5 15.25 15.75L15.9062 12.9062C16.125 12.125 15.7188 11.3438 15 11.0312ZM14.4688 12.5625L13.8125 15.4062C13.8125 15.4375 13.75 15.5 13.6875 15.5C6.96875 15.5 1.46875 10.0312 1.46875 3.3125C1.46875 3.25 1.53125 3.1875 1.59375 3.1875L4.4375 2.53125L4.46875 2.5C4.53125 2.5 4.5625 2.5625 4.59375 2.59375L5.90625 5.65625C5.9375 5.71875 5.9375 5.78125 5.875 5.8125L4.34375 7.0625C4.09375 7.28125 4 7.65625 4.15625 7.96875C5.1875 10.0625 6.90625 11.7812 9 12.8125C9.3125 12.9688 9.71875 12.9062 9.9375 12.625L11.1875 11.0938C11.2188 11.0625 11.2812 11.0312 11.3438 11.0625L14.4062 12.375C14.4688 12.4375 14.5 12.5 14.4688 12.5625Z" fill="inherit"/>
                    </svg>
                    <a href="tel:012041654">Have any Question?</a>
                  </li>
                  <li><i className="far fa-envelope"></i><a href="mailto:info@artvista.com">Mail Us: info@artvista.com</a></li>
                  <li><i className="far fa-clock"></i>Mon - Fri: 8:00AM - 6:00PM</li>
                </ul>
              </div>
            </div>
            <div className="col-auto d-none d-lg-block">
              <div className="header-links header-links-right">
                <ul>
                  <li>
                    <i className="fas fa-globe"></i>
                    <a className="dropdown-toggle" href="#" role="button" id="dropdownMenuLink6" data-bs-toggle="dropdown" aria-expanded="false">English</a>
                    <ul className="dropdown-menu" aria-labelledby="dropdownMenuLink6">
                      <li>
                        <a href="#">German</a>
                        <a href="#">French</a>
                        <a href="#">Italian</a>
                        <a href="#">Latvian</a>
                        <a href="#">Spanish</a>
                        <a href="#">Greek</a>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <button type="button" className="sidebar-btn sideMenuToggler">
                      <span className="line"></span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sticky-wrapper">
        <div className="menu-area">
          <div className="container">
            <div className="row align-items-center justify-content-between">
              <div className="col-auto">
                <div className="header-logo">
                  <Link to="/"><img src="/assets/img/logo/logoNom.png" alt="logo" style={{ height: '55px' }} /></Link>
                </div>
              </div>
              <div className="col-auto">
                <nav className="main-menu d-none d-lg-inline-block">
                  <ul>
                    <li className="menu-item-has-children">
                    <Link to="/">Home</Link> 
                    </li>
                    <li className="menu-item-has-children">
                      <a href="#">Pages</a>
                      <ul className="sub-menu">
                        <li><Link to="/about">About Page</Link></li>
                        <li><Link to="/team">Team Page</Link></li>
                        <li><Link to="/team-details">Team Details</Link></li>
                        <li><Link to="/opening-hour">Opening Hour</Link></li>
                        <li><Link to="/location">Location Us</Link></li>
                        <li><Link to="/project">Portfolio Standard</Link></li>
                        <li><Link to="/project-details">Portfolio Details</Link></li>
                      </ul>
                    </li>

                    <li className="menu-item-has-children">
                      <a href="#">Events</a>
                      <ul className="sub-menu">
                        <li><Link to="/event">Event Page</Link></li>
                        <li><Link to="/event-details">Event Details</Link></li>
                      </ul>
                    </li>
                    <li className="menu-item-has-children">
                      <Link to="/oeuvres">Oeuvres</Link>
                    </li>
                    <li className="menu-item-has-children">
                      <Link to="/galeries">Galeries</Link>
                    </li>
                    {isAuthenticated && (user?.role === 'artiste' || user?.role === 'admin') && (
                      <li className="menu-item-has-children">
                        <a href="#">Mes Créations</a>
                        <ul className="sub-menu">
                          <li><Link to="/mes-oeuvres">Mes Oeuvres</Link></li>
                          <li><Link to="/mes-galeries">Mes Galeries</Link></li>
                        </ul>
                      </li>
                    )}
                     <li className="menu-item-has-children">
                      <Link to="/artistes">Artistes</Link>
                    </li>
                 
                    <li>
                      <Link to="/contact">Contact</Link>
                    </li>
                  </ul>
                </nav>
                <div className="navbar-right d-inline-flex d-lg-none">
                  <button type="button" className="menu-toggle icon-btn"><i className="fas fa-bars"></i></button>
                </div>
              </div>
              <div className="col-auto d-none d-xl-block">
                <div className="header-button">
                  {isAuthenticated ? (
                    <div className="dropdown" ref={dropdownRef}>
                      <button 
                        className="btn dropdown-toggle d-flex align-items-center" 
                        type="button" 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none',
                          color: 'inherit',
                          fontSize: 'inherit'
                        }}
                      >
                        {user?.image && !imageError ? (
                          <img 
                            src={user.image.startsWith('http') ? user.image : `http://localhost:8000${user.image}`} 
                            alt={`${user.prenom} ${user.nom}`}
                            className="rounded-circle me-2"
                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <i className="fas fa-user-circle me-2" style={{ fontSize: '1.2rem' }}></i>
                        )}
                        {user?.prenom} {user?.nom}
                        <i className="fas fa-chevron-down ms-2" style={{ fontSize: '0.8rem' }}></i>
                      </button>
                      <ul 
                        className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}
                        style={{ 
                          position: 'absolute', 
                          right: 0, 
                          left: 'auto',
                          marginTop: '10px',
                          border: 'none',
                          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                          borderRadius: '8px',
                          minWidth: '200px'
                        }}
                      >
                        <li>
                          <Link 
                            className="dropdown-item d-flex align-items-center" 
                            to="/profile" 
                            onClick={() => setDropdownOpen(false)}
                            style={{ padding: '10px 15px' }}
                          >
                            <i className="fas fa-user me-3" style={{ width: '16px' }}></i>
                            <span>Mon Profil</span>
                          </Link>
                        </li>

                        <li><hr className="dropdown-divider my-2" /></li>
                        <li>
                          <button 
                            className="dropdown-item d-flex align-items-center" 
                            onClick={handleLogout} 
                            style={{ 
                              padding: '10px 15px',
                              color: '#dc3545',
                              background: 'none',
                              border: 'none',
                              width: '100%',
                              textAlign: 'left'
                            }}
                          >
                            <i className="fas fa-sign-out-alt me-3" style={{ width: '16px' }}></i>
                            <span>Déconnexion</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <Link to="/login" className="btn d-none d-xl-block">
                      Se connecter
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
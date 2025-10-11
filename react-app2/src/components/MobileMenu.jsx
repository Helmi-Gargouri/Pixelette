import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MobileMenu = () => {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="mobile-menu-wrapper">
      <div className="mobile-menu-area text-center">
        <button className="menu-toggle"><i className="fas fa-times"></i></button>
        <div className="mobile-logo">
          <Link to="/"><img src="/assets/img/logo-white.svg" alt="Artvista" /></Link>
        </div>
        <div className="mobile-menu">
          <ul>
            <li className="menu-item-has-children">
              <a href="#">Home</a>
              <ul className="sub-menu">
                <li><Link to="/">Home 01</Link></li>
              </ul>
            </li>
            <li className="menu-item-has-children">
              <a href="#">Pages</a>
              <ul className="sub-menu">
                <li><Link to="/about">About Page</Link></li>
                <li><Link to="/team">Team Page</Link></li>
                <li><Link to="/team-details">Team Details</Link></li>
                <li><Link to="/opening-hour">Opening Hour</Link></li>
                <li><Link to="/location">Location Us</Link></li>
              </ul>
            </li>
            <li className="menu-item-has-children">
              <a href="#">Events</a>
              <ul className="sub-menu">
                <li><Link to="/event">Event Page</Link></li>
                <li><Link to="/event-details">Event Details</Link></li>
              </ul>
            </li>
            <li>
              <Link to="/oeuvres">Oeuvres</Link>
            </li>
            <li>
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
              <a href="#">Blog</a>
              <ul className="sub-menu">
                <li><Link to="/blog">Blog Page</Link></li>
                <li><Link to="/blog-details">Blog Details</Link></li>
              </ul>
            </li>
            <li className="menu-item-has-children">
              <a href="#">Shop</a>
              <ul className="sub-menu">
                <li><Link to="/shop">Shop Grid</Link></li>
                <li><Link to="/shop-details">Shop Details</Link></li>
              </ul>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default MobileMenu


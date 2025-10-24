import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="footer-wrapper footer-layout1 overflow-hidden">
      <div className="shape-mockup footer1-shape1 jump" data-top="20%" data-left="-2%">
        <img src="/assets/img/normal/footer-1-shape1.png" alt="img" />
      </div>
      <div className="container">
        <div className="footer-top">
          <div className="row align-items-center justify-content-between">
            <div className="col-sm-auto">
              <div className="footer-logo mb-40 mb-sm-0">
                <Link to="/"><img src="/assets/img/logo/LogoNomBlanc.png" alt="logo" style={{ height: '100px' }} /></Link>
              </div>
            </div>
            <div className="col-sm-auto">
              <div className="social-btn style2">
                <a href="https://facebook.com/"><i className="fab fa-facebook-f"></i></a>
                <a href="https://twitter.com/"><i className="fab fa-twitter"></i></a>
                <a href="https://behance.com/"><i className="fab fa-behance"></i></a>
                <a href="https://www.youtube.com/"><i className="fab fa-youtube"></i></a>
              </div>
            </div>
          </div>
        </div>
        <div className="widget-area">
          <div className="row justify-content-between">
            <div className="col-md-6 col-xl-3 col-lg-4">
              <div className="widget footer-widget">
                <div className="widget-contact">
                  <h3 className="widget_title">Contact Info</h3>
                  <ul className="contact-info-list">
                    <li>Reception: + 99 76 486 856</li>
                    <li>Office: + 99 7 66 486 856</li>
                    <li>E-mail: info@pixelette.com</li>
                    <li>Address: Moran Street, Berlin</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-auto col-lg-4">
              <div className="widget widget_nav_menu footer-widget">
                <h3 className="widget_title">Information</h3>
                <div className="menu-all-pages-container">
                  <ul className="menu">
                    <li><Link to="/team">Our Team</Link></li>
                    <li><Link to="/contact">Faq's</Link></li>
                    <li><Link to="/contact">Contact</Link></li>
                    <li><Link to="/project">What we do</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl-auto col-lg-4">
              <div className="widget widget_nav_menu footer-widget">
                <h3 className="widget_title">Visitor Info </h3>
                <div className="menu-all-pages-container">
                  <ul className="menu">
                    <li><Link to="/contact">How To Find Us</Link></li>
                    <li><Link to="/contact">Get Ticket</Link></li>
                    <li><Link to="/event">Join Events</Link></li>
                    <li><Link to="/event">Tours</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="widget footer-widget">
                <h3 className="widget_title">Subscribe Now</h3>
                <p className="footer-text">Don't worry we don't spam your email</p>
                <form className="newsletter-form">
                  <div className="form-group">
                    <input className="form-control" type="email" placeholder="Email Address" required />
                  </div>
                  <button type="submit" className="btn">SUBSCRIBE</button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-menu-area">
          <ul className="footer-menu-list">
            <li><Link to="/">HOME</Link></li>
            <li><Link to="/project">EXHIBITIONS</Link></li>
            <li><Link to="/event">EVENTS</Link></li>
            <li><Link to="/about">ABOUT</Link></li>
            <li><Link to="/shop">SHOP</Link></li>
          </ul>
        </div>
      </div>
      <div className="copyright-wrap text-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-auto align-self-center">
              <p className="copyright-text text-white">© 2024 </p>
              <p className="copyright-text text-white"><a href="#">Artvista.</a> All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer


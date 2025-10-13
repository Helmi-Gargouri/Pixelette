import { Link } from 'react-router-dom'

const Location = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Location</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">LOCATION</li>
          </ul>
        </div>
      </div>

      {/* Location Area */}
      <div className="space">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="map-sec">
                <iframe
                  src="https://maps.google.com/maps?q=London%20Eye%2C%20London%2C%20United%20Kingdom&t=m&z=10&output=embed&iwloc=near"
                  width="100%"
                  height="500"
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>
              <div className="location-info mt-50">
                <h3>Museum Location</h3>
                <p><i className="fas fa-map-marker-alt"></i> Moran Street, Berlin</p>
                <p><i className="fas fa-phone"></i> +99 76 486 856</p>
                <p><i className="fas fa-envelope"></i> Artvista@wedding.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Location


import { Link } from 'react-router-dom'

const OpeningHour = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Opening Hours</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">OPENING HOURS</li>
          </ul>
        </div>
      </div>

      {/* Opening Hours Area */}
      <div className="space">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="opening-hour-content text-center">
                <h2 className="sec-title">Museum Opening Hours</h2>
                <div className="opening-hour-list mt-50">
                  <div className="opening-hour-item">
                    <span className="day">Monday</span>
                    <span className="time">Closed</span>
                  </div>
                  <div className="opening-hour-item">
                    <span className="day">Tuesday - Friday</span>
                    <span className="time">10:00 AM - 6:00 PM</span>
                  </div>
                  <div className="opening-hour-item">
                    <span className="day">Saturday - Sunday</span>
                    <span className="time">10:00 AM - 8:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default OpeningHour


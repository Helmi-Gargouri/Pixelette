import { Link } from 'react-router-dom'

const Event = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Events</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">EVENTS</li>
          </ul>
        </div>
      </div>

      {/* Event Area */}
      <div className="event-area-1 space overflow-hidden bg-smoke">
        <div className="container">
          <div className="row gy-30">
            <div className="col-lg-12">
              <div className="event-card wow custom-anim-left">
                <div className="event-card-date">
                  <span className="date">08</span>
                  June, 2024
                </div>
                <div className="event-card-details">
                  <h3 className="event-card-title"><Link to="/event-details">Are There Specific Unique Events We Thats</Link></h3>
                  <span className="event-card-location">New York, Rodices120/32</span>
                  <Link to="/event-details" className="btn">GET TICKET</Link>
                </div>
                <div className="event-card-thumb">
                  <img src="/assets/img/event/event-thumb-1-1.png" alt="img" />
                </div>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="event-card wow custom-anim-left">
                <div className="event-card-date">
                  <span className="date">09</span>
                  June, 2024
                </div>
                <div className="event-card-details">
                  <h3 className="event-card-title"><Link to="/event-details">Carving Moment Capturing Emotions Nies</Link></h3>
                  <span className="event-card-location">New York, Rodices120/32</span>
                  <Link to="/event-details" className="btn">GET TICKET</Link>
                </div>
                <div className="event-card-thumb">
                  <img src="/assets/img/event/event-thumb-1-2.png" alt="img" />
                </div>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="event-card wow custom-anim-left">
                <div className="event-card-date">
                  <span className="date">18</span>
                  June, 2024
                </div>
                <div className="event-card-details">
                  <h3 className="event-card-title"><Link to="/event-details">Where Vision Meets Line Craftsmanship</Link></h3>
                  <span className="event-card-location">New York, Rodices120/32</span>
                  <Link to="/event-details" className="btn">GET TICKET</Link>
                </div>
                <div className="event-card-thumb">
                  <img src="/assets/img/event/event-thumb-1-3.png" alt="img" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Event


import { Link } from 'react-router-dom'

const EventDetails = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Event Details</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">EVENT DETAILS</li>
          </ul>
        </div>
      </div>

      {/* Event Details Area */}
      <div className="space">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className="event-details">
                <div className="event-img">
                  <img src="/assets/img/event/event-details1-1.png" alt="event" />
                </div>
                <div className="event-content">
                  <h2 className="event-title">Are There Specific Unique Events We Thats</h2>
                  <div className="event-meta">
                    <span><i className="far fa-calendar"></i>08 June, 2024</span>
                    <span><i className="far fa-clock"></i>09PM - 14AM</span>
                    <span><i className="far fa-map-marker-alt"></i>New York, Rodices120/32</span>
                  </div>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                  <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                  <Link to="/contact" className="btn">GET TICKET</Link>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <aside className="sidebar">
                <div className="widget">
                  <h3 className="widget-title">Event Info</h3>
                  <ul className="event-info-list">
                    <li><strong>Date:</strong> 08 June, 2024</li>
                    <li><strong>Time:</strong> 09PM - 14AM</li>
                    <li><strong>Location:</strong> New York, Rodices120/32</li>
                    <li><strong>Price:</strong> $25</li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default EventDetails


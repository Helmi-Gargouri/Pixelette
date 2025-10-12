import { Link } from 'react-router-dom'

const Team = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Our Team</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">TEAM</li>
          </ul>
        </div>
      </div>

      {/* Team Area */}
      <div className="space">
        <div className="container">
          <div className="row gy-30">
            <div className="col-lg-4 col-md-6">
              <div className="team-card">
                <div className="team-img">
                  <img src="/assets/img/team/team_1_1.png" alt="Team" />
                </div>
                <div className="team-content">
                  <h3 className="team-title"><Link to="/team-details">John Doe</Link></h3>
                  <span className="team-desig">Museum Director</span>
                  <div className="social-btn">
                    <a href="#"><i className="fab fa-facebook-f"></i></a>
                    <a href="#"><i className="fab fa-twitter"></i></a>
                    <a href="#"><i className="fab fa-linkedin-in"></i></a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="team-card">
                <div className="team-img">
                  <img src="/assets/img/team/team_1_2.png" alt="Team" />
                </div>
                <div className="team-content">
                  <h3 className="team-title"><Link to="/team-details">Jane Smith</Link></h3>
                  <span className="team-desig">Curator</span>
                  <div className="social-btn">
                    <a href="#"><i className="fab fa-facebook-f"></i></a>
                    <a href="#"><i className="fab fa-twitter"></i></a>
                    <a href="#"><i className="fab fa-linkedin-in"></i></a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="team-card">
                <div className="team-img">
                  <img src="/assets/img/team/team_1_3.png" alt="Team" />
                </div>
                <div className="team-content">
                  <h3 className="team-title"><Link to="/team-details">Mike Johnson</Link></h3>
                  <span className="team-desig">Art Historian</span>
                  <div className="social-btn">
                    <a href="#"><i className="fab fa-facebook-f"></i></a>
                    <a href="#"><i className="fab fa-twitter"></i></a>
                    <a href="#"><i className="fab fa-linkedin-in"></i></a>
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

export default Team


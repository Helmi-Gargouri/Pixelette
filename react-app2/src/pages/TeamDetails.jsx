import { Link } from 'react-router-dom'

const TeamDetails = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Team Details</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">TEAM DETAILS</li>
          </ul>
        </div>
      </div>

      {/* Team Details Area */}
      <div className="space">
        <div className="container">
          <div className="row">
            <div className="col-lg-4">
              <div className="team-details-img">
                <img src="/assets/img/team/team_1_1.png" alt="Team" />
              </div>
            </div>
            <div className="col-lg-8">
              <div className="team-details-content">
                <h2 className="team-title">John Doe</h2>
                <span className="team-desig">Museum Director</span>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <div className="social-btn mt-30">
                  <a href="#"><i className="fab fa-facebook-f"></i></a>
                  <a href="#"><i className="fab fa-twitter"></i></a>
                  <a href="#"><i className="fab fa-linkedin-in"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TeamDetails


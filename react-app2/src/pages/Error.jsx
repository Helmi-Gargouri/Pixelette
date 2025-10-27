import { Link } from 'react-router-dom'

const Error = () => {
  return (
    <div className="error-area space">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="error-content text-center">
              <div className="error-img">
                <img src="/assets/img/normal/error.svg" alt="404" />
              </div>
              <h2 className="error-title">Page Not Found</h2>
              <p className="error-text">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
              <Link to="/" className="btn">GO BACK HOME</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Error


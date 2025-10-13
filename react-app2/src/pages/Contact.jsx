import { Link } from 'react-router-dom'

const Contact = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Contact Us</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">CONTACT</li>
          </ul>
        </div>
      </div>

      {/* Contact Area */}
      <div className="space">
        <div className="container">
          <div className="contact-page-wrap">
            <div className="row gx-0 justify-content-center flex-row-reverse">
              <div className="col-xl-5">
                <div className="map-sec">
                  <iframe
                    src="https://maps.google.com/maps?q=London%20Eye%2C%20London%2C%20United%20Kingdom&t=m&z=10&output=embed&iwloc=near"
                    allowFullScreen=""
                    loading="lazy"
                  ></iframe>
                </div>
              </div>
              <div className="col-xl-7">
                <div className="contact-form-wrap">
                  <div className="title-area mb-30">
                    <span className="sub-title text-theme">CONTACT US</span>
                    <h2 className="sec-title">Get In Touch!</h2>
                  </div>
                  <form action="/mail.php" method="POST" className="contact-form ajax-contact">
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="form-group style-4 form-icon-left">
                          <i className="far fa-user text-theme"></i>
                          <input type="text" className="form-control style-border" name="name" id="name" placeholder="Enter Full Name" />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="form-group style-4 form-icon-left">
                          <i className="far fa-envelope text-theme"></i>
                          <input type="text" className="form-control style-border" name="email" id="email" placeholder="Email Address" />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="form-group style-4 form-icon-left">
                          <i className="far fa-comment text-theme"></i>
                          <textarea name="message" placeholder="Type Your Message" id="contactForm" className="form-control style-border"></textarea>
                        </div>
                      </div>
                    </div>
                    <div className="form-btn col-12">
                      <button type="submit" className="btn">SEND MESSAGE NOW</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Contact


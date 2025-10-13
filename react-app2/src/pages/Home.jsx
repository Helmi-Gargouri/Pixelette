import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <>
      {/* Hero Area */}
      <div className="hero-wrapper hero-1" id="hero-sec">
        <div className="global-carousel hero-slider1" id="heroSlider1" data-fade="true" data-slide-show="1" data-arrows="false">
          <div className="hero-slider">
            <div className="hero-thumb1" data-ani="slider-custom-anim-left" data-ani-delay="0.1s">
              <img src="/assets/img/hero/hero_1_1.png" alt="img" />
            </div>
            <div className="hero-thumb2" data-ani="slider-custom-anim-right" data-ani-delay="0.1s">
              <img src="/assets/img/hero/hero_1_2.png" alt="img" />
            </div>
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-lg-8 col-md-12">
                  <div className="hero-style1">
                    <h1 className="hero-title" data-ani="slider-custom-anim-right" data-ani-delay="0.15s">
                      Art Vista <span className="text-stroke">Artvista</span>
                    </h1>
                    <h1 className="hero-title" data-ani="slider-custom-anim-left" data-ani-delay="0.2s">
                      History World
                    </h1>
                    <h1 className="hero-title title-bg-thumb" data-bg-src="/assets/img/hero/hero_1_text-bg.png" data-ani="slider-custom-anim-right" data-ani-delay="0.25s">
                      Museum
                    </h1>
                    <div className="hero-social-wrap" data-ani="slider-custom-anim-left" data-ani-delay="0.3s">
                      <span>Follow Us On: </span>
                      <a href="https://facebook.com/"><i className="fab fa-facebook-f"></i></a>
                      <a href="https://twitter.com/"><i className="fab fa-twitter"></i></a>
                      <a href="https://behance.com/"><i className="fab fa-behance"></i></a>
                      <a href="https://www.youtube.com/"><i className="fab fa-youtube"></i></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container text-end">
          <div className="hero-slider1-controller-wrap">
            <div className="slides-numbers">
              <span className="active">01</span> <span className="total"></span>
            </div>
            <div className="hero-custom-dots">
              <button className="tab-btn active" type="button">
                <span className="slide-dot"></span>
              </button>
            </div>
            <div className="icon-box">
              <button data-slick-prev=".hero-slider1" className="icon-btn">
                <svg width="24" height="14" viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.74198 0L0 7L6.74198 14L7.87513 12.8234L3.06758 7.83189L24 7.83189V6.168L3.06773 6.168L7.87513 1.17658L6.74198 0Z" fill="inherit"/>
                </svg>
              </button>
              <button data-slick-next=".hero-slider1" className="icon-btn">
                <svg width="24" height="14" viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.258 14L24 7L17.258 0L16.1249 1.17658L20.9324 6.16811L2.45808e-07 6.16811V7.832L20.9323 7.832L16.1249 12.8234L17.258 14Z" fill="inherit"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exhibition Area */}
      <div className="space bg-title">
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-lg-8">
              <div className="title-area wow custom-anim-left" data-wow-duration="1.5s" data-wow-delay="0.1s">
                <h2 className="sec-title text-white">Trending Exhibitions</h2>
              </div>
            </div>
            <div className="col-lg-auto">
              <div className="sec-btn wow custom-anim-right" data-wow-duration="1.5s" data-wow-delay="0.1s">
                <Link className="btn style2" to="/event">VIEW ALL EXHIBITIONS</Link>
              </div>
            </div>
          </div>
          <div className="row justify-content-center exhibition-wrap-1 gy-40 gx-30">
            <div className="col-lg-4 col-md-6 exhibition-card-wrap">
              <div className="exhibition-card gtop">
                <div className="exhibition-card-thumb">
                  <img src="/assets/img/exhibition/1-1.png" alt="img" />
                  <div className="shadow-text">Sculptor</div>
                </div>
                <div className="exhibition-card-details">
                  <div className="post-meta-item blog-meta">
                    <Link to="/blog">14 MAY, 2024 - 10 APRIL, 2024</Link>
                    <Link to="/blog">09PM - 14AM</Link>
                  </div>
                  <h3 className="event-card-title"><Link to="/event">Capturing Essence in Art</Link></h3>
                  <Link className="btn style2" to="/event">SCULPTOR</Link>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 exhibition-card-wrap">
              <div className="exhibition-card gtop">
                <div className="exhibition-card-thumb">
                  <img src="/assets/img/exhibition/1-2.png" alt="img" />
                  <div className="shadow-text">Sculptor</div>
                </div>
                <div className="exhibition-card-details">
                  <div className="post-meta-item blog-meta">
                    <Link to="/blog">14 MAY, 2024 - 10 APRIL, 2024</Link>
                    <Link to="/blog">09PM - 14AM</Link>
                  </div>
                  <h3 className="event-card-title"><Link to="/event">Transforming Ideas into</Link></h3>
                  <Link className="btn style2" to="/event">SCULPTOR</Link>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 exhibition-card-wrap">
              <div className="exhibition-card gtop">
                <div className="exhibition-card-thumb">
                  <img src="/assets/img/exhibition/1-3.png" alt="img" />
                  <div className="shadow-text">Sculptor</div>
                </div>
                <div className="exhibition-card-details">
                  <div className="post-meta-item blog-meta">
                    <Link to="/blog">14 MAY, 2024 - 10 APRIL, 2024</Link>
                    <Link to="/blog">09PM - 14AM</Link>
                  </div>
                  <h3 className="event-card-title"><Link to="/event">Sculpting the Landscape</Link></h3>
                  <Link className="btn style2" to="/event">SCULPTOR</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Area */}
      <div className="overflow-hidden">
        <div className="container-fluid p-0">
          <div className="cta-area-1 space gtop" data-bg-src="/assets/img/bg/cta-1-bg.png">
            <div className="row justify-content-center">
              <div className="col-xl-6 col-lg-7">
                <div className="title-area text-center mb-0 wow custom-anim-top" data-wow-duration="1.5s" data-wow-delay="0.1s">
                  <h2 className="sec-title mb-0 text-white fw-medium">
                    Let's book an event for your awesome Museum destination
                  </h2>
                  <Link to="/contact" className="btn">Ticket & Admission</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Area */}
      <div className="event-area-1 space overflow-hidden bg-smoke">
        <div className="container">
          <div className="row justify-content-lg-between justify-content-center text-lg-start text-center">
            <div className="col-lg-7">
              <div className="title-area wow custom-anim-left" data-wow-duration="1.5s" data-wow-delay="0.1s">
                <h2 className="sec-title">Join Now Upcoming Events</h2>
              </div>
            </div>
            <div className="col-lg-auto">
              <div className="sec-btn wow custom-anim-right" data-wow-duration="1.5s" data-wow-delay="0.1s">
                <Link to="/event" className="btn">VIEW ALL EVENTS</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="row gy-30">
            <div className="col-lg-12">
              <div className="event-card wow custom-anim-left" data-wow-duration="1.5s" data-wow-delay="0.1s">
                <div className="event-card-date">
                  <span className="date">08</span>
                  June, 2024
                </div>
                <div className="event-card-details">
                  <h3 className="event-card-title"><Link to="/event-details">Are There Specific Unique Events We Thats</Link></h3>
                  <span className="event-card-location">New York, Rodices120/32</span>
                  <Link to="/event" className="btn">GET TICKET</Link>
                </div>
                <div className="event-card-thumb">
                  <img src="/assets/img/event/event-thumb-1-1.png" alt="img" />
                </div>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="event-card wow custom-anim-left" data-wow-duration="1.5s" data-wow-delay="0.1s">
                <div className="event-card-date">
                  <span className="date">09</span>
                  June, 2024
                </div>
                <div className="event-card-details">
                  <h3 className="event-card-title"><Link to="/event-details">Carving Moment Capturing Emotions Nies</Link></h3>
                  <span className="event-card-location">New York, Rodices120/32</span>
                  <Link to="/event" className="btn">GET TICKET</Link>
                </div>
                <div className="event-card-thumb">
                  <img src="/assets/img/event/event-thumb-1-2.png" alt="img" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Home


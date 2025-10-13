import { Link } from 'react-router-dom'

const About = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">About Us</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">ABOUT US</li>
          </ul>
        </div>
      </div>

      {/* About Area */}
      <div className="about-page-area space overflow-hidden position-relative">
        <div className="container">
          <div className="row gy-50 gx-60 justify-content-lg-between align-items-center">
            <div className="col-xl-5">
              <div className="about-page-thumb wow custom-anim-left" data-wow-duration="1.5s" data-wow-delay="0.1s">
                <img src="/assets/img/normal/about_page1-1.png" alt="img" />
              </div>
            </div>
            <div className="col-xl-7">
              <div className="title-area mb-0 wow custom-anim-left" data-wow-duration="1.5s" data-wow-delay="0.1s">
                <h2 className="sec-title mb-0">Welcome to Unveiling History Art, and Culture</h2>
                <p className="sec-text mt-20">
                  Step into the past with our meticulously curated exhibits that span centuries and continents. From ancient artifacts to contemporary masterpieces, our virtual galleries bring the diverse facets of the human experience to your screen. Embark on a virtual odyssey through the corridors of time and creativity as you enter the digital realm of Museum Name. Our online portal is a gateway to an enriching exploration.
                </p>
                <p className="sec-text mt-30">
                  Step into the past with our meticulously curated exhibits that span centuries and continents. From ancient artifacts to contemporary masterpieces, our virtual galleries bring the diverse facets of the human experience to your screen. Embark on a virtual odyssey through the corridors of time and creativity as you enter the digital realm of Museum Name. Our online portal is a gateway to an enriching exploration of human history, artistry, and cultural heritage. Unearth the secrets of civilizations, witness the evolution of art.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-100">
            <div className="row gy-50 gx-60 justify-content-xl-between align-items-center flex-row-reverse">
              <div className="col-xl-6 text-xl-end">
                <div className="about-page-thumb wow custom-anim-left" data-wow-duration="1.5s" data-wow-delay="0.1s">
                  <img src="/assets/img/normal/about_page1-2.png" alt="img" />
                </div>
              </div>
              <div className="col-xl-6">
                <div className="title-area mb-0 wow custom-anim-left" data-wow-duration="1.5s" data-wow-delay="0.1s">
                  <h2 className="sec-title mb-0">Stay Connected to Culture</h2>
                  <p className="sec-text mt-20">
                    Step into the past with our meticulously curated exhibits that span centuries and continents. From ancient artifacts to contemporary masterpieces, our virtual galleries bring the diverse facets of the human experience to your screen. Embark on a virtual odyssey through the corridors of time and creativity as you enter the digital realm of Museum Name. Our online portal is a gateway to an enriching exploration.
                  </p>
                  <p className="sec-text mt-30">
                    Step into the past with our meticulously curated exhibits that span centuries and continents. From ancient artifacts to contemporary masterpieces, our virtual galleries bring the diverse facets of the human experience to your screen. Embark on a virtual odyssey through the corridors of time and creativity as you enter the digital realm of Museum Name. Our online portal is a gateway to an enriching exploration of human history, artistry, and cultural heritage. Unearth the secrets of civilizations, witness the evolution of art.
                  </p>
                </div>
              </div>
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

      {/* Video Area */}
      <div className="video-area-1 overflow-hidden text-center bg-attachment" data-bg-src="/assets/img/bg/video-2-bg.png" data-overlay="black" data-opacity="3">
        <div className="container">
          <div className="video-wrap1">
            <a href="https://www.youtube.com/watch?v=PwYewBMlkJw" className="play-btn popup-video">
              <img src="/assets/img/icon/play-btn.svg" alt="img" />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export default About


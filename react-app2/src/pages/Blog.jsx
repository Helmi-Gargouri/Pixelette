import { Link } from 'react-router-dom'

const Blog = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Blog</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">BLOG</li>
          </ul>
        </div>
      </div>

      {/* Blog Area */}
      <div className="space">
        <div className="container">
          <div className="row gy-30">
            <div className="col-lg-4 col-md-6">
              <div className="blog-card">
                <div className="blog-img">
                  <img src="/assets/img/blog/blog_1_1.png" alt="blog" />
                </div>
                <div className="blog-content">
                  <div className="blog-meta">
                    <Link to="/blog"><i className="far fa-calendar"></i>15 Jan, 2024</Link>
                    <Link to="/blog"><i className="far fa-user"></i>By Admin</Link>
                  </div>
                  <h3 className="blog-title"><Link to="/blog-details">Education is at the heart of everything we do</Link></h3>
                  <Link to="/blog-details" className="link-btn">READ MORE <i className="fas fa-arrow-right"></i></Link>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="blog-card">
                <div className="blog-img">
                  <img src="/assets/img/blog/blog_1_2.png" alt="blog" />
                </div>
                <div className="blog-content">
                  <div className="blog-meta">
                    <Link to="/blog"><i className="far fa-calendar"></i>05 Jul, 2024</Link>
                    <Link to="/blog"><i className="far fa-user"></i>By Admin</Link>
                  </div>
                  <h3 className="blog-title"><Link to="/blog-details">Exploring A Journey Through Egyptian Artifacts</Link></h3>
                  <Link to="/blog-details" className="link-btn">READ MORE <i className="fas fa-arrow-right"></i></Link>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="blog-card">
                <div className="blog-img">
                  <img src="/assets/img/blog/blog_1_3.png" alt="blog" />
                </div>
                <div className="blog-content">
                  <div className="blog-meta">
                    <Link to="/blog"><i className="far fa-calendar"></i>14 Sep, 2024</Link>
                    <Link to="/blog"><i className="far fa-user"></i>By Admin</Link>
                  </div>
                  <h3 className="blog-title"><Link to="/blog-details">Whether you're a seasoned or a curious</Link></h3>
                  <Link to="/blog-details" className="link-btn">READ MORE <i className="fas fa-arrow-right"></i></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Blog


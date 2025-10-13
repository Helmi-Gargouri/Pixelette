import { Link } from 'react-router-dom'

const BlogDetails = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Blog Details</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">BLOG DETAILS</li>
          </ul>
        </div>
      </div>

      {/* Blog Details Area */}
      <div className="space">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className="blog-details">
                <div className="blog-img">
                  <img src="/assets/img/blog/blog_details1_1.png" alt="blog" />
                </div>
                <div className="blog-content">
                  <div className="blog-meta">
                    <Link to="/blog"><i className="far fa-calendar"></i>15 Jan, 2024</Link>
                    <Link to="/blog"><i className="far fa-user"></i>By Admin</Link>
                  </div>
                  <h2 className="blog-title">Education is at the heart of everything we do</h2>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                  <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <aside className="sidebar">
                <div className="widget">
                  <h3 className="widget-title">Recent Posts</h3>
                  <div className="recent-post">
                    <div className="media-img">
                      <Link to="/blog-details"><img src="/assets/img/blog/recent-post1.png" alt="Blog" /></Link>
                    </div>
                    <div className="media-body">
                      <div className="recent-post-meta">
                        <Link to="/blog"><i className="far fa-calendar"></i>15 Jan, 2024</Link>
                      </div>
                      <h4 className="post-title"><Link to="/blog-details">Education is at the heart</Link></h4>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default BlogDetails


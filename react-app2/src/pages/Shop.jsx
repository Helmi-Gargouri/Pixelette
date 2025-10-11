import { Link } from 'react-router-dom'

const Shop = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Shop</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">SHOP</li>
          </ul>
        </div>
      </div>

      {/* Product Area */}
      <div className="product-area-1 space overflow-hidden">
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-3 col-md-6">
              <div className="product-card">
                <div className="product-img">
                  <span className="tag">Sculptor</span>
                  <img src="/assets/img/product/1-1.png" alt="Product Image" />
                  <div className="actions">
                    <a href="#" className="icon-btn"><i className="fas fa-shopping-cart"></i></a>
                    <a href="#" className="icon-btn"><i className="far fa-heart"></i></a>
                    <a href="#" className="icon-btn"><i className="far fa-eye"></i></a>
                  </div>
                </div>
                <div className="product-content">
                  <span className="price">$250.00 <del>$550.00</del></span>
                  <h3 className="product-title"><Link to="/shop-details">Lady Seraphina</Link></h3>
                  <div className="star-rating">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="product-card">
                <div className="product-img">
                  <span className="tag">Sculptor</span>
                  <img src="/assets/img/product/1-2.png" alt="Product Image" />
                  <div className="actions">
                    <a href="#" className="icon-btn"><i className="fas fa-shopping-cart"></i></a>
                    <a href="#" className="icon-btn"><i className="far fa-heart"></i></a>
                    <a href="#" className="icon-btn"><i className="far fa-eye"></i></a>
                  </div>
                </div>
                <div className="product-content">
                  <span className="price">$150.00 <del>$550.00</del></span>
                  <h3 className="product-title"><Link to="/shop-details">Nova Byte</Link></h3>
                  <div className="star-rating">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="product-card">
                <div className="product-img">
                  <span className="tag">Sculptor</span>
                  <img src="/assets/img/product/1-3.png" alt="Product Image" />
                  <div className="actions">
                    <a href="#" className="icon-btn"><i className="fas fa-shopping-cart"></i></a>
                    <a href="#" className="icon-btn"><i className="far fa-heart"></i></a>
                    <a href="#" className="icon-btn"><i className="far fa-eye"></i></a>
                  </div>
                </div>
                <div className="product-content">
                  <span className="price">$260.00 <del>$550.00</del></span>
                  <h3 className="product-title"><Link to="/shop-details">Synth Sphere</Link></h3>
                  <div className="star-rating">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="product-card">
                <div className="product-img">
                  <span className="tag">Sculptor</span>
                  <img src="/assets/img/product/1-4.png" alt="Product Image" />
                  <div className="actions">
                    <a href="#" className="icon-btn"><i className="fas fa-shopping-cart"></i></a>
                    <a href="#" className="icon-btn"><i className="far fa-heart"></i></a>
                    <a href="#" className="icon-btn"><i className="far fa-eye"></i></a>
                  </div>
                </div>
                <div className="product-content">
                  <span className="price">$250.00 <del>$550.00</del></span>
                  <h3 className="product-title"><Link to="/shop-details">NeoGlow Ahe</Link></h3>
                  <div className="star-rating">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
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

export default Shop


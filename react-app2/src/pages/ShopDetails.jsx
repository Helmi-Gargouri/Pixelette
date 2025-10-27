import { Link } from 'react-router-dom'

const ShopDetails = () => {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcumb-wrapper text-center" data-bg-src="/assets/img/bg/breadcrumb-bg.png">
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Shop Details</h1>
          </div>
          <ul className="breadcumb-menu">
            <li><Link to="/">MAIN HOME</Link></li>
            <li className="active">SHOP DETAILS</li>
          </ul>
        </div>
      </div>

      {/* Shop Details Area */}
      <div className="space">
        <div className="container">
          <div className="row gx-50">
            <div className="col-lg-6">
              <div className="product-big-img">
                <img src="/assets/img/product/product-details1.png" alt="Product" />
              </div>
            </div>
            <div className="col-lg-6 align-self-center">
              <div className="product-about">
                <p className="price">$150.00</p>
                <h2 className="product-title">Premium Museum Masterpieces</h2>
                <div className="product-rating">
                  <div className="star-rating">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                  <Link to="/shop-details" className="woocommerce-review-link">(2 customer reviews)</Link>
                </div>
                <p className="text">
                  Syndicate customized growth strategies prospective human capital leverage other's optimal e-markets without transparent catalysts for change.
                </p>
                <div className="actions">
                  <button className="btn">ADD TO CART <i className="fas fa-shopping-bag ms-2"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ShopDetails


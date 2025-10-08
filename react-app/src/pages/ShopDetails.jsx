import React from 'react'
import './_pageStyles.css'

export default function ShopDetails() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/shop-details.html?raw') }} />
}

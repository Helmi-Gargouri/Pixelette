import React from 'react'
import './_pageStyles.css'

export default function Shop() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/shop.html?raw') }} />
}

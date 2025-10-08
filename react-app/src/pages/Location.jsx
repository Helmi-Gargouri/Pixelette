import React from 'react'
import './_pageStyles.css'

export default function Location() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/location.html?raw') }} />
}

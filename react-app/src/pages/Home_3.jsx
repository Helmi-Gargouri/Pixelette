import React from 'react'
import './_pageStyles.css'

export default function Home_3() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/home-3.html?raw') }} />
}

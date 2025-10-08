import React from 'react'
import './_pageStyles.css'

export default function Home_2() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/home-2.html?raw') }} />
}

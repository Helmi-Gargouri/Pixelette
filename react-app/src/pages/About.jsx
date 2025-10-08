import React from 'react'
import './_pageStyles.css'

export default function About() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/about.html?raw') }} />
}

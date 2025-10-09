import React from 'react'
import './_pageStyles.css'

export default function Index() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/index.html?raw') }} />
}
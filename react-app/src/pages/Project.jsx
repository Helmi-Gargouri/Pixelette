import React from 'react'
import './_pageStyles.css'

export default function Project() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/project.html?raw') }} />
}

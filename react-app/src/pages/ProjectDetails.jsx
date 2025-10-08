import React from 'react'
import './_pageStyles.css'

export default function ProjectDetails() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/project-details.html?raw') }} />
}

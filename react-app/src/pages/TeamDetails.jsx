import React from 'react'
import './_pageStyles.css'

export default function TeamDetails() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/team-details.html?raw') }} />
}

import React from 'react'
import './_pageStyles.css'

export default function Team() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/team.html?raw') }} />
}

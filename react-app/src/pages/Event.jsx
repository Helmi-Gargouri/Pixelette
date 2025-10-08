import React from 'react'
import './_pageStyles.css'

export default function Event() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/event.html?raw') }} />
}

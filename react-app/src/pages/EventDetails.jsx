import React from 'react'
import './_pageStyles.css'

export default function EventDetails() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/event-details.html?raw') }} />
}

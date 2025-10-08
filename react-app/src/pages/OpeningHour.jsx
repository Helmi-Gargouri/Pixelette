import React from 'react'
import './_pageStyles.css'

export default function OpeningHour() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/opening-hour.html?raw') }} />
}

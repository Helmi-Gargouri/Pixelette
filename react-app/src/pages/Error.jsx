import React from 'react'
import './_pageStyles.css'

export default function Error() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/error.html?raw') }} />
}

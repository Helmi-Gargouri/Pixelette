import React from 'react'
import './_pageStyles.css'

export default function Mail() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/mail.php?raw') }} />
}

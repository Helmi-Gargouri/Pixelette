import React from 'react'
import './_pageStyles.css'

export default function Contact() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/contact.html?raw') }} />
}

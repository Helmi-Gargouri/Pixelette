import React from 'react'
import './_pageStyles.css'

export default function BlogDetails() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/blog-details.html?raw') }} />
}

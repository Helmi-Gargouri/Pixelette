import React from 'react'
import './_pageStyles.css'

export default function Blog() {
  return <div dangerouslySetInnerHTML={{ __html: require('../public/pages/blog.html?raw') }} />
}

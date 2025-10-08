import React, { useEffect, useState } from 'react'

export default function TemplatePage({ page }) {
  const [html, setHtml] = useState('<p>Loading...</p>')

  useEffect(() => {
    let mounted = true
    fetch(`/pages/${page}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.text()
      })
      .then((t) => mounted && setHtml(t))
      .catch(() => mounted && setHtml('<p>Page not found</p>'))
    return () => (mounted = false)
  }, [page])

  return (
    <div className="template-page" dangerouslySetInnerHTML={{ __html: html }} />
  )
}

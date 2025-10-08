import React, { useEffect, useState, useRef } from 'react'

function normalizeAssetUrl(url) {
  if (!url) return url
  // If already absolute (starts with / or http), return as-is
  if (url.startsWith('/') || url.startsWith('http')) return url
  // Handle relative paths like './assets/..' or 'assets/...'
  return '/' + url.replace(/^\.\//, '')
}

export default function StaticPage({ page }) {
  const [html, setHtml] = useState('<p>Loading...</p>')

  const containerRef = useRef(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const res = await fetch(`/pages/${page}`)
        if (!res.ok) throw new Error('Not found')
        const text = await res.text()

        // Ensure container is hidden until we finish injecting and initializing scripts
        try {
          const cr = containerRef.current
          if (cr) {
            cr.style.visibility = 'hidden'
            cr.style.opacity = '0'
            cr.style.transition = 'opacity 200ms ease'
          }
        } catch (e) {}

        // Parse as DOM so we can handle <link>, <script>, and rewrite asset URLs
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/html')

        // Rewrite asset URLs for href/src attributes that start with assets/
        ;[...doc.querySelectorAll('[src]')].forEach((el) => {
          const src = el.getAttribute('src')
          if (src && src.match(/^\.\/|^assets\//)) {
            el.setAttribute('src', normalizeAssetUrl(src))
          }
        })
        ;[...doc.querySelectorAll('link[href]')].forEach((el) => {
          const href = el.getAttribute('href')
          if (href && href.match(/^\.\/|^assets\//)) {
            el.setAttribute('href', normalizeAssetUrl(href))
          }
        })
        ;[...doc.querySelectorAll('[href]')].forEach((el) => {
          // update asset links (images/fonts/etc) only, skip anchors to pages
          const href = el.getAttribute('href')
          if (href && href.match(/^assets\//)) {
            el.setAttribute('href', normalizeAssetUrl(href))
          }
        })

        // Collect stylesheets and ensure they're loaded into head
        const links = [...doc.querySelectorAll('link[rel="stylesheet"]')]
        links.forEach((link) => {
          const href = link.getAttribute('href')
          if (!href) return
          // avoid duplicates
          if (!document.head.querySelector(`link[href="${href}"]`)) {
            const newLink = document.createElement('link')
            newLink.rel = 'stylesheet'
            newLink.href = href
            document.head.appendChild(newLink)
          }
        })

        // Extract scripts and remove them from the doc so they don't remain in innerHTML
        const scripts = [...doc.querySelectorAll('script')]
        scripts.forEach((s) => s.parentNode && s.parentNode.removeChild(s))

        const bodyHtml = doc.body.innerHTML

  if (mounted) setHtml(bodyHtml)

  // After injecting HTML, dynamically add scripts so they execute
        // Delay slightly to allow React to render the injected HTML
        setTimeout(() => {
          scripts.forEach((s) => {
            const src = s.getAttribute && s.getAttribute('src')
            if (src) {
              const absolute = normalizeAssetUrl(src)
              // Don't load the same script twice
              if (!document.querySelector(`script[src="${absolute}"]`)) {
                const sc = document.createElement('script')
                sc.src = absolute
                sc.async = false
                document.body.appendChild(sc)
              }
            } else if (s.textContent) {
              // inline script: execute it
              const sc = document.createElement('script')
              sc.textContent = s.textContent
              document.body.appendChild(sc)
            }
          })

          // --- Safe fallback: if the template preloader wasn't removed by the template JS,
          // remove it after a short timeout to ensure pages aren't stuck behind it.
          setTimeout(() => {
            try {
              const pre = document.querySelector('.preloader')
              if (pre && pre.parentNode) pre.parentNode.removeChild(pre)
              // some templates add inline styles or classes that lock scrolling; clear overflow
              document.body.style.overflow = ''
            } catch (e) {
              // ignore
            }
          }, 2500)

          // --- Plugin re-initializer: idempotently initialize common template plugins
          setTimeout(() => {
            try {
              // jQuery-based plugins
              const $ = window.jQuery
              if ($) {
                // Slick sliders
                if ($.fn && $.fn.slick) {
                  const selectors = ['.global-carousel', '.hero-slider1', '.portfolio-slider1', '.testi-slider2']
                  selectors.forEach((sel) => {
                    $(sel).each(function () {
                      const $el = $(this)
                      if (!$el.hasClass('slick-initialized')) {
                        try {
                          $el.slick({ slidesToShow: 1, arrows: true, dots: false })
                        } catch (e) {
                          // ignore errors
                        }
                      }
                    })
                  })
                }

                // Magnific Popup
                if ($.fn && $.fn.magnificPopup) {
                  try {
                    $('.popup-image').each(function () {
                      const $p = $(this)
                      if (!$p.data('magnific-init')) {
                        $p.magnificPopup({ type: 'image', gallery: { enabled: true } })
                        $p.data('magnific-init', true)
                      }
                    })
                    $('.popup-content').each(function () {
                      const $p = $(this)
                      if (!$p.data('magnific-init')) {
                        $p.magnificPopup({ type: 'inline' })
                        $p.data('magnific-init', true)
                      }
                    })
                  } catch (e) {}
                }

                // imagesLoaded + Isotope
                if ($.fn && $.fn.imagesLoaded && $.fn.isotope) {
                  try {
                    $('.masonry-grid, .portfolio-grid, .isotope-grid').each(function () {
                      const $grid = $(this)
                      if (!$grid.data('isotope')) {
                        $grid.imagesLoaded(function () {
                          try {
                            $grid.isotope({ itemSelector: '.grid-item', percentPosition: true })
                          } catch (e) {}
                        })
                      }
                    })
                  } catch (e) {}
                }
              }

              // WOW (animations)
              if (window.WOW) {
                try {
                  // create a fresh instance and init; safe to call multiple times
                  new window.WOW().init()
                } catch (e) {}
              }
            } catch (e) {
              // swallow plugin init errors to avoid crashing the SPA
            }
          }, 350)

          // Reveal the injected content after a short delay so CSS and scripts can apply
          const revealTimeout = setTimeout(() => {
            try {
              const cr = containerRef.current
              if (cr) {
                cr.style.visibility = ''
                cr.style.opacity = '1'
              }
            } catch (e) {}
          }, 500)

          // ensure we clear the timeout on unmount
          if (!mounted) clearTimeout(revealTimeout)
        }, 50)

        // Rewrite anchors inside the injected HTML to point to SPA routes and intercept clicks
        setTimeout(() => {
          try {
            const container = containerRef.current
            if (!container) return

            // rewrite hrefs like 'home-2.html' -> '/home-2'
            ;[...container.querySelectorAll('a[href]')].forEach((a) => {
              const href = a.getAttribute('href')
              if (!href) return
              // Ignore external links and anchors
              if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
              // If it already looks like a SPA route (/...), leave it
              if (href.startsWith('/')) return
              // If it's an HTML/PHP page, convert
              const m = href.match(/^(.+)\.(html|php)$/)
              if (m) {
                let route = '/' + m[1]
                // map index -> /
                if (m[1].toLowerCase() === 'index') route = '/'
                a.setAttribute('data-spa-href', route)
                a.setAttribute('href', route)
              }
            })

            // Intercept clicks to perform SPA navigation
            const onClick = (e) => {
              const target = e.target.closest && e.target.closest('a')
              if (!target) return
              let href = target.getAttribute('href')
              if (!href) return
              // external or different-origin
              if (href.startsWith('http') && !href.startsWith(window.location.origin)) return
              // let the browser handle if it's hash/mailto/tel
              if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

              // If link still points to an html/php page, convert to SPA route
              const m = href.match(/^\/?(.+)\.(html|php)$/)
              if (m) {
                let route = '/' + m[1]
                if (m[1].toLowerCase() === 'index') route = '/'
                e.preventDefault()
                window.history.pushState({}, '', route)
                window.dispatchEvent(new PopStateEvent('popstate'))
                return
              }

              // If the link was rewritten earlier (data-spa-href present) or is a SPA path, handle it
              if (target.getAttribute('data-spa-href') || href.startsWith('/')) {
                e.preventDefault()
                window.history.pushState({}, '', href)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }
            }

            container.addEventListener('click', onClick)

            // cleanup listener when page changes
            setTimeout(() => {
              if (container) container.removeEventListener('click', onClick)
            }, 0)
          } catch (e) {
            // ignore
          }
        }, 100)
      } catch (err) {
        if (mounted) setHtml('<p>Page not found</p>')
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [page])

  return <div ref={containerRef} className="template-page" dangerouslySetInnerHTML={{ __html: html }} />
}


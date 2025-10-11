import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const useTemplateInit = () => {
  const location = useLocation()

  useEffect(() => {
    // Reinitialize background images with data-bg-src
    const initBackgroundImages = () => {
      const bgElements = document.querySelectorAll('[data-bg-src]')
      bgElements.forEach((element) => {
        const src = element.getAttribute('data-bg-src')
        if (src) {
          element.style.backgroundImage = `url(${src})`
          element.removeAttribute('data-bg-src')
          element.classList.add('background-image')
        }
      })
    }

    // Reinitialize WOW.js animations if available
    const initWowAnimations = () => {
      if (window.WOW) {
        try {
          new window.WOW({
            boxClass: 'wow',
            animateClass: 'animated',
            offset: 0,
            mobile: true,
            live: true,
          }).init()
        } catch (error) {
          console.log('WOW init error (safe to ignore):', error)
        }
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initBackgroundImages()
      initWowAnimations()
    }, 100)

    return () => clearTimeout(timer)
  }, [location.pathname])

  return null
}

export default useTemplateInit




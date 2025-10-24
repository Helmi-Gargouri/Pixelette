import React, { useEffect, useRef } from 'react'
import ApexCharts from 'apexcharts'

// Imperative wrapper around ApexCharts (avoids react-apexcharts internal logic)
// Props: options (object), series (array), type, height, width
const ImperativeApexChart = ({ options = {}, series = [], type = 'line', height = 320, width = '100%', className }) => {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const opts = { ...options, chart: { ...(options.chart || {}), type, height, width } }
    try {
      // destroy previous if present
      if (chartRef.current) {
        try {
          if (typeof chartRef.current.destroy === 'function') chartRef.current.destroy()
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('ImperativeApexChart destroy failed (ignored)', err)
        }
        chartRef.current = null
      }

      const c = new ApexCharts(containerRef.current, { ...opts, series })
      chartRef.current = c
      // schedule render on next frame to avoid React commit-time DOM races
      const raf = requestAnimationFrame(() => {
        try {
          c.render().catch(e => {
            // eslint-disable-next-line no-console
            console.error('ImperativeApexChart render error', e)
          })
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('ImperativeApexChart render sync error', err)
        }
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('ImperativeApexChart init error', err)
    }

    return () => {
      try {
        // cancel any scheduled render
        if (typeof raf !== 'undefined') cancelAnimationFrame(raf)
      } catch (_) {}
      try {
        if (chartRef.current && typeof chartRef.current.destroy === 'function') chartRef.current.destroy()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('ImperativeApexChart destroy failed (cleanup)', err)
      }
      chartRef.current = null
    }
  // rerender whenever options/series/type/height/width change
  }, [options, JSON.stringify(series), type, height, width])

  return <div ref={containerRef} className={className} style={{ width, height }} />
}

export default ImperativeApexChart

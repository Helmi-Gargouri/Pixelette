
import React, { useRef, useState, useMemo } from 'react'

// Simple responsive SVG pie/donut with lightweight hover tooltip.
// Props:
//  - series: array of numbers
//  - labels: array of strings
//  - colors: array of color strings
//  - size: desired pixel size (used as viewBox square)
//  - innerRadius: 0..1 fraction for donut hole
const SimplePie = ({ series = [], labels = [], colors = ['#3b82f6', '#f59e0b'], size = 350, innerRadius = 0.6 }) => {
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, label: '', value: 0, percent: 0 })

  const total = series.reduce((s, v) => s + (v || 0), 0)

  // memoize arcs to avoid recalculation on every render
  const arcs = useMemo(() => {
    let cumulative = 0
    const cx = size / 2
    const cy = size / 2
    const r = size / 2
    const innerR = r * innerRadius

    const polarToCartesian = (cx, cy, r, angleInDegrees) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
      return { x: cx + r * Math.cos(angleInRadians), y: cy + r * Math.sin(angleInRadians) }
    }

    const describeArc = (x, y, r, startAngle, endAngle) => {
      const start = polarToCartesian(x, y, r, endAngle)
      const end = polarToCartesian(x, y, r, startAngle)
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
      return { start, end, largeArcFlag }
    }

    const out = []
    for (let i = 0; i < series.length; i++) {
      const value = series[i] || 0
      const startAngle = (cumulative / (total || 1)) * 360
      cumulative += value
      const endAngle = (cumulative / (total || 1)) * 360
      const outer = describeArc(cx, cy, r, startAngle, endAngle)
      const inner = describeArc(cx, cy, innerR, startAngle, endAngle)

      // build path for donut slice (outer arc, line to inner arc, inner arc reverse)
      const d = `M ${outer.start.x} ${outer.start.y} A ${r} ${r} 0 ${outer.largeArcFlag} 0 ${outer.end.x} ${outer.end.y} L ${inner.end.x} ${inner.end.y} A ${innerR} ${innerR} 0 ${inner.largeArcFlag} 1 ${inner.start.x} ${inner.start.y} Z`
      const percent = total ? Math.round((value / total) * 1000) / 10 : 0
      out.push({ d, color: colors[i % colors.length], label: labels[i] || `#${i+1}`, value, percent })
    }
    return out
  }, [series, labels, colors, size, innerRadius, total])

  const onEnter = (e, arc) => {
    const rect = containerRef.current && containerRef.current.getBoundingClientRect()
    if (!rect) return
    setTooltip({ visible: true, x: e.clientX - rect.left + 10, y: e.clientY - rect.top + 10, label: arc.label, value: arc.value, percent: arc.percent })
  }
  const onMove = (e) => {
    const rect = containerRef.current && containerRef.current.getBoundingClientRect()
    if (!rect) return
    setTooltip(prev => ({ ...prev, x: e.clientX - rect.left + 10, y: e.clientY - rect.top + 10 }))
  }
  const onLeave = () => setTooltip(prev => ({ ...prev, visible: false }))

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 'auto' }}>
          <g>
            {arcs.map((a, idx) => (
              <path
                key={idx}
                d={a.d}
                fill={a.color}
                stroke="#fff"
                strokeWidth="1"
                style={{ cursor: 'pointer', transition: 'opacity 120ms' }}
                onMouseEnter={(e) => onEnter(e, a)}
                onMouseMove={onMove}
                onMouseLeave={onLeave}
              />
            ))}
            {/* center hole */}
            <circle cx={size / 2} cy={size / 2} r={(size / 2) * innerRadius} fill="#fff" />
          </g>
        </svg>
      </div>

      {/* tooltip */}
      {tooltip.visible && (
        <div style={{ position: 'absolute', pointerEvents: 'none', transform: `translate(${tooltip.x}px, ${tooltip.y}px)` }}>
          <div style={{ background: 'white', padding: 8, borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: 12 }}>
            <div style={{ fontWeight: 600 }}>{tooltip.label}</div>
            <div style={{ color: '#444' }}>{tooltip.value} ({tooltip.percent}%)</div>
          </div>
        </div>
      )}

      {/* legend */}
      <div className="mt-3 text-sm text-default-700" style={{ width: '100%', maxWidth: 420 }}>
        {arcs.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: a.color }}></span>
            <div>{a.label}: <strong>{a.value}</strong> <span style={{ color: '#666' }}>({a.percent}%)</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SimplePie

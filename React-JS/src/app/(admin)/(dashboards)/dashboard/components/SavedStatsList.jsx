import { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import Chart from 'react-apexcharts'
import SimplePie from '@/components/client-wrapper/SimplePie'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { getAnalyticsReports, getSubscriptionDistribution, getPagesInteraction, getPresPectiveChart, getUserDeviceChart, getSatisfactionChart, getDailyVisitInsightsChart } from '@/app/(admin)/(dashboards)/analytics/components/data'

const StatCard = ({ stat, onRefresh }) => {
  const [data, setData] = useState(null)
  const [popover, setPopover] = useState(null)

  // show popover with users on day click
  const handleDayClick = async (info) => {
    const ds = info.date.toISOString().slice(0,10)
    try {
      const res = await axios.get(`http://localhost:8000/api/users/by-date/?date=${ds}`, { withCredentials: true })
      if (res.data && !res.data.error) {
        setPopover({ open: true, date: ds, users: res.data.users, x: info.jsEvent?.clientX || 0, y: info.jsEvent?.clientY || 0 })
      }
    } catch (e) {
      console.error('fetch users by date failed', e)
    }
  }
  const [loading, setLoading] = useState(false)

  const fetchCompute = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`http://localhost:8000/api/saved-stats/${stat.id}/compute/`, { withCredentials: true })
      // Defensive: backend may return { error, detail } on failure
      if (res.data && res.data.error) {
        setData({ error: res.data.error, detail: res.data.detail })
      } else {
        setData(res.data)
      }
    } catch (err) {
      console.error('compute error', err)
      // Try to extract backend JSON if present
      const errData = err.response?.data
      if (errData && errData.error) setData({ error: errData.error, detail: errData.detail })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompute()
  }, [stat.id])

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8000/api/saved-stats/${stat.id}/`, { withCredentials: true })
      onRefresh && onRefresh()
    } catch (err) {
      console.error('delete', err)
    }
  }

  if (loading) return (
    <div className="p-4 bg-white rounded shadow">Chargement...</div>
  )

  if (!data) return (
    <div className="p-4 bg-white rounded shadow">Aucune donnée</div>
  )

  if (data.error) return (
    <div className="p-4 bg-white rounded shadow text-red-600">
      Erreur: {data.error} {data.detail ? `- ${data.detail}` : ''}
    </div>
  )

  // Validate shape for ApexCharts and convert to the exact series/options
  const rawLabels = Array.isArray(data.labels) ? data.labels : []
  const rawValues = Array.isArray(data.values) ? data.values : []

  // Ensure values are numbers
  const numericValues = rawValues.map(v => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  })

  // If labels are missing, create index labels
  const labels = rawLabels.length ? rawLabels : numericValues.map((_, i) => String(i + 1))

  let options = { chart: { id: `stat-${stat.id}` } }
  let series = []

  const chartType = (stat.chart_type || 'pie').toLowerCase()

  if (chartType === 'pie' || chartType === 'donut') {
    // Use the analytics preset for donut/pie and apply labels
    const preset = getSubscriptionDistribution()
    options = { ...preset, ...options, labels }
    // visually stronger palette and no legend
    options.colors = ['#6366F1', '#06B6D4', '#F97316', '#10B981', '#EF4444']
    options.legend = { show: false }
    if (!options.plotOptions) options.plotOptions = {}
    options.plotOptions.pie = { donut: { size: '55%' } }
    series = numericValues
  } else if (chartType === 'bar') {
    // Use pages interaction preset to get rounded bars, colors, etc.
    const preset = getPagesInteraction()
    options = { ...preset, ...options }
    options.xaxis = { ...preset.xaxis, categories: labels }
    // polished bar styles: rounded, gradient fill, no data labels
    options.plotOptions = { ...(options.plotOptions || {}), bar: { borderRadius: 8, columnWidth: '50%' } }
    options.dataLabels = { enabled: false }
    options.fill = { type: 'gradient', gradient: { shade: 'light', type: 'vertical', gradientToColors: ['#60A5FA'], shadeIntensity: 0.6, opacityFrom: 0.95, opacityTo: 0.8 } }
    options.colors = ['#2563EB']
    series = [{ name: stat.title || stat.subject_field || 'Series', data: numericValues }]
  } else if (chartType === 'treemap') {
    const preset = getPresPectiveChart()
    options = { ...preset, ...options }
    series = [{ data: labels.map((l, i) => ({ x: l, y: numericValues[i] || 0 })) }]
  } else if (chartType === 'radar') {
    const preset = getUserDeviceChart()
    options = { ...preset, ...options }
    // radar expects series as array of {name,data}
    options.stroke = { width: 2 }
    options.fill = { opacity: 0.25 }
    options.markers = { size: 4 }
    series = [{ name: stat.title || stat.subject_field || 'Series', data: numericValues }]
  } else if (chartType === 'radialbar') {
    const preset = getSatisfactionChart()
    options = { ...preset, ...options }
    options.plotOptions = { radialBar: { hollow: { size: '60%' }, dataLabels: { name: { show: false }, value: { fontSize: '18px', show: true } } } }
    options.colors = ['#10B981']
    series = numericValues.slice(0, 1) // radial bar shows a single value
  } else if (chartType === 'area') {
    const preset = getAnalyticsReports()
    options = { ...preset, ...options }
    options.xaxis = { ...preset.xaxis, categories: labels }
    options.stroke = { curve: 'smooth', width: 2 }
    options.fill = { type: 'gradient', gradient: { shadeIntensity: 0.3, opacityFrom: 0.6, opacityTo: 0.1 } }
    options.markers = { size: 3 }
    series = [{ name: stat.title || stat.subject_field || 'Series', data: numericValues }]
  } else if (chartType === 'line') {
    // Use analytics reports preset for line styling
    const preset = getAnalyticsReports()
    options = { ...preset, ...options }
    options.xaxis = { ...preset.xaxis, categories: labels }
    options.stroke = { curve: 'smooth', width: 2 }
    options.markers = { size: 3 }
    options.dropShadow = { enabled: true, top: 2, left: 1, blur: 4, opacity: 0.08 }
    series = [{ name: stat.title || stat.subject_field || 'Series', data: numericValues }]
  } else {
    // Fallback: keep simple pie-style
    options = { ...options, labels }
    series = numericValues
  }

  // FullCalendar-based calendar: shows month view with counts and shading. Navigating months will trigger compute calls for that month range.
  const FullCalendarWrapper = ({ points }) => {
    const [localPoints, setLocalPoints] = useState(points || [])
    // keep localPoints in sync when parent provides new points (initial load)
    useEffect(() => { setLocalPoints(points || []) }, [points])

    const counts = useMemo(() => new Map((localPoints || []).map(p => [p.date, p.value])), [localPoints])
    const allVals = (localPoints || []).map(p => p.value)
    const maxVal = Math.max(...allVals, 1)
    const fcRef = useRef(null)
    const lastRangeRef = useRef({ start: null, end: null })

    const dayCellStyle = (info) => {
      const ds = info.date.toISOString().slice(0,10)
      const v = counts.get(ds) || 0
      if (v > 0) {
        const t = Math.min(1, v / maxVal)
        info.el.style.backgroundColor = `rgba(59,130,246, ${0.12 + 0.6 * t})`
        info.el.style.position = 'relative'
        const existing = info.el.querySelector('.fc-count-badge')
        if (existing) existing.remove()
        const badge = document.createElement('div')
        badge.className = 'fc-count-badge'
        badge.textContent = String(v)
        badge.style.cssText = 'position:absolute;right:6px;top:6px;font-size:12px;font-weight:600;color:#0f172a'
        info.el.appendChild(badge)
      } else {
        const existing = info.el.querySelector('.fc-count-badge')
        if (existing) existing.remove()
        info.el.style.backgroundColor = ''
      }
    }

    const handleDatesSet = async (arg) => {
      // arg.startStr and arg.endStr are ISO strings; call backend for that range
      try {
        const start = arg.startStr.slice(0,10)
        const end = arg.endStr.slice(0,10)
        // avoid refetching for the same range repeatedly
        if (lastRangeRef.current.start === start && lastRangeRef.current.end === end) return
        const res = await axios.get(`http://localhost:8000/api/saved-stats/${stat.id}/compute/?start=${start}&end=${end}`, { withCredentials: true })
        if (res.data && !res.data.error) {
          const newPoints = res.data.points || []
          const curPoints = localPoints || []
          const same = newPoints.length === curPoints.length && newPoints.every((p, i) => p.date === curPoints[i]?.date && p.value === curPoints[i]?.value)
          if (!same) {
            setLocalPoints(newPoints)
          }
          lastRangeRef.current = { start, end }
        }
      } catch (e) {
        console.error('FullCalendar range fetch failed', e)
      }
    }

    return (
      <div>
        <FullCalendar
          ref={fcRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          dayCellDidMount={dayCellStyle}
          datesSet={handleDatesSet}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          dayMaxEventRows={3}
          height={360}
          dateClick={handleDayClick}
        />

        {/* small chart below calendar */}
        <div className="mt-2">
          <Chart
            options={{
              chart: { sparkline: { enabled: true }, toolbar: { show: false } },
              stroke: { curve: 'smooth' },
              xaxis: { categories: (localPoints || []).map(p => p.date) },
              markers: { size: 0 },
              tooltip: { enabled: false },
              legend: { show: false },
            }}
            series={[{ name: stat.title || 'Series', data: (localPoints || []).map(p => p.value) }]}
            type={'line'}
            height={80}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold">{stat.title}</h4>
        <div className="space-x-2">
          <button className="text-sm text-red-600" onClick={handleDelete}>Supprimer</button>
        </div>
      </div>
      <div>
        {Array.isArray(data.points) ? (
          <FullCalendarWrapper points={data.points} />
        ) : (
          // ensure legend is disabled to avoid injected foreignObject legend block
          (() => { options.legend = { ...(options.legend || {}), show: false }; return (
            stat.title === 'Nombre de galeries par utilisateur' ? (
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <Chart options={options} series={series} type={(options.chart && options.chart.type) ? options.chart.type : (stat.chart_type || 'pie')} height={250} />
                </div>
                <div className="w-48 flex-shrink-0">
                  <SimplePie series={numericValues} labels={labels} colors={['#6366F1', '#06B6D4', '#F97316', '#10B981', '#EF4444']} size={160} innerRadius={0.55} />
                </div>
              </div>
            ) : (
              <Chart options={options} series={series} type={(options.chart && options.chart.type) ? options.chart.type : (stat.chart_type || 'pie')} height={250} />
            )
          ) })()
        )}
      </div>
      {/* Popover for showing users on clicked day */}
      {popover?.open && (
        <div style={{ position: 'fixed', left: popover.x + 8, top: popover.y + 8, zIndex: 9999 }} className="bg-white border rounded shadow p-2 w-64">
          <div className="font-semibold text-sm">{popover.date} — {popover.users.length} inscrit(s)</div>
          <ul className="text-xs mt-2 max-h-40 overflow-auto">
            {popover.users.length ? popover.users.map(u => (
              <li key={u.id} className="border-b py-1">{u.prenom} {u.nom} <span className="text-gray-400">({u.email})</span></li>
            )) : (<li className="text-gray-500">Aucun inscrit</li>)}
          </ul>
          <div className="text-right mt-2">
            <button className="text-sm text-blue-600" onClick={() => setPopover(null)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}

const SavedStatsList = ({ onCreated, refreshKey }) => {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const headers = token ? { Authorization: `Token ${token}` } : {}
      const res = await axios.get('http://localhost:8000/api/saved-stats/', { withCredentials: true, headers })
      setStats(res.data)
    } catch (err) {
      console.error('fetch stats', err)
      // Show backend message in UI if available
      const msg = err.response?.data?.detail || err.message
      setStats([])
      try {
        // If 401, call whoami to diagnose session state and show it
        if (err.response?.status === 401) {
          const who = await axios.get('http://localhost:8000/api/whoami/', { withCredentials: true })
          const sessionUser = who.data.session_user
          if (sessionUser && sessionUser.role === 'admin') {
            // retry once with session (should succeed)
            const retry = await axios.get('http://localhost:8000/api/saved-stats/', { withCredentials: true })
            setStats(retry.data)
            setLoading(false)
            return
          }
          // show session info for debugging
          // eslint-disable-next-line no-alert
          alert('Failed to load saved stats: ' + msg + '\nwhoami: ' + JSON.stringify(who.data))
          setLoading(false)
          return
        }
      } catch (whoErr) {
        console.error('whoami failed', whoErr)
      }
      // eslint-disable-next-line no-alert
      alert('Failed to load saved stats: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [refreshKey])

  useEffect(() => {
    if (onCreated) onCreated(fetchStats)
  }, [onCreated])

  if (loading) return <div>Chargement des stats...</div>

  // Separate calendar stats to render them full-width at the bottom
  const calendarStats = stats.filter(s => s.config && s.config.calendar)
  const otherStats = stats.filter(s => !(s.config && s.config.calendar))

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {otherStats.map(s => (
          <StatCard key={s.id} stat={s} onRefresh={fetchStats} />
        ))}
      </div>

      {calendarStats.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Calendriers</h3>
          <div className="grid grid-cols-1 gap-4">
            {calendarStats.map(s => (
              <div key={s.id} className="w-full">
                <StatCard stat={s} onRefresh={fetchStats} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default SavedStatsList

import { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import Chart from 'react-apexcharts'
import SimplePie from '@/components/client-wrapper/SimplePie'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { getAnalyticsReports, getSubscriptionDistribution, getPagesInteraction, getPresPectiveChart, getUserDeviceChart, getSatisfactionChart, getDailyVisitInsightsChart } from '@/app/(admin)/(dashboards)/analytics/components/data'

const StatCard = ({ stat, onRefresh }) => {
  const [data, setData] = useState(null)
  const [popover, setPopover] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

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

  const fetchCompute = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`http://localhost:8000/api/saved-stats/${stat.id}/compute/`, { withCredentials: true })
      if (res.data && res.data.error) {
        setData({ error: res.data.error, detail: res.data.detail })
      } else {
        setData(res.data)
      }
    } catch (err) {
      console.error('compute error', err)
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce widget ?')) {
      try {
        await axios.delete(`http://localhost:8000/api/saved-stats/${stat.id}/`, { withCredentials: true })
        onRefresh && onRefresh()
      } catch (err) {
        console.error('delete', err)
        alert('Erreur lors de la suppression')
      }
    }
  }

  const handleRefresh = () => {
    fetchCompute()
  }

  // Chart configuration based on type
  const { options, series, chartType } = useMemo(() => {
  if (!data || data.error) return { options: {}, series: [], chartType: (stat.chart_type || 'pie').toLowerCase() }

    const rawLabels = Array.isArray(data.labels) ? data.labels : []
    const rawValues = Array.isArray(data.values) ? data.values : []
    const numericValues = rawValues.map(v => Number.isFinite(Number(v)) ? Number(v) : 0)
    const labels = rawLabels.length ? rawLabels : numericValues.map((_, i) => `Item ${i + 1}`)
    
  // Prefer chart_type returned by the compute endpoint (data.chart_type)
  // Fall back to the saved stat.chart_type when absent.
  const type = ((data && data.chart_type) ? String(data.chart_type) : stat.chart_type || 'pie').toLowerCase()
    let chartOptions = { 
      chart: { 
        id: `stat-${stat.id}`,
        toolbar: { show: true },
        fontFamily: 'inherit'
      },
      colors: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      dataLabels: { enabled: false },
      legend: { show: false }
    }

    let chartSeries = []

    switch (type) {
      case 'pie':
      case 'donut':
        const presetPie = getSubscriptionDistribution()
        chartOptions = { ...presetPie, ...chartOptions, labels }
        chartOptions.plotOptions = { pie: { donut: { size: '55%' } } }
        chartSeries = numericValues
        break

      case 'bar':
        const presetBar = getPagesInteraction()
        chartOptions = { ...presetBar, ...chartOptions }
        chartOptions.xaxis = { ...presetBar.xaxis, categories: labels }
        chartOptions.plotOptions = { bar: { borderRadius: 8, columnWidth: '60%' } }
        chartOptions.fill = { 
          type: 'gradient', 
          gradient: { 
            shade: 'light', 
            type: 'vertical', 
            gradientToColors: ['#60A5FA'], 
            shadeIntensity: 0.6, 
            opacityFrom: 0.95, 
            opacityTo: 0.8 
          } 
        }
        chartSeries = [{ name: stat.title || stat.subject_field || 'Series', data: numericValues }]
        break

      case 'line':
        const presetLine = getAnalyticsReports()
        chartOptions = { ...presetLine, ...chartOptions }
        chartOptions.xaxis = { ...presetLine.xaxis, categories: labels }
        chartOptions.stroke = { curve: 'smooth', width: 3 }
        chartOptions.markers = { size: 5 }
        chartSeries = [{ name: stat.title || stat.subject_field || 'Series', data: numericValues }]
        break

      case 'area':
        const presetArea = getAnalyticsReports()
        chartOptions = { ...presetArea, ...chartOptions }
        chartOptions.xaxis = { ...presetArea.xaxis, categories: labels }
        chartOptions.stroke = { curve: 'smooth', width: 2 }
        chartOptions.fill = { type: 'gradient', gradient: { shadeIntensity: 0.3, opacityFrom: 0.6, opacityTo: 0.1 } }
        chartSeries = [{ name: stat.title || stat.subject_field || 'Series', data: numericValues }]
        break

      case 'radar':
        const presetRadar = getUserDeviceChart()
        chartOptions = { ...presetRadar, ...chartOptions }
        chartOptions.xaxis = { categories: labels }
        chartSeries = [{ name: stat.title || stat.subject_field || 'Series', data: numericValues }]
        break

      case 'radialbar':
        const presetRadial = getSatisfactionChart()
        chartOptions = { ...presetRadial, ...chartOptions }
        chartOptions.plotOptions = { 
          radialBar: { 
            hollow: { size: '60%' }, 
            dataLabels: { 
              name: { show: false }, 
              value: { fontSize: '18px', show: true } 
            } 
          } 
        }
        chartSeries = [numericValues[0] || 0]
        break

      default:
        chartOptions = { ...chartOptions, labels }
        chartSeries = numericValues
    }

    return { options: chartOptions, series: chartSeries, chartType: type }
  }, [data, stat])

  const FullCalendarWrapper = ({ points }) => {
    const [localPoints, setLocalPoints] = useState(points || [])
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
      try {
        const start = arg.startStr.slice(0,10)
        const end = arg.endStr.slice(0,10)
        if (lastRangeRef.current.start === start && lastRangeRef.current.end === end) return
        const res = await axios.get(`http://localhost:8000/api/saved-stats/${stat.id}/compute/?start=${start}&end=${end}`, { withCredentials: true })
        if (res.data && !res.data.error) {
          const newPoints = res.data.points || []
          setLocalPoints(newPoints)
          lastRangeRef.current = { start, end }
        }
      } catch (e) {
        console.error('FullCalendar range fetch failed', e)
      }
    }

    return (
      <div className="space-y-4">
        <FullCalendar
          ref={fcRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          dayCellDidMount={dayCellStyle}
          datesSet={handleDatesSet}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          dayMaxEventRows={3}
          height={320}
          dateClick={handleDayClick}
        />
        <div className="mt-2">
          <Chart
            options={{
              chart: { sparkline: { enabled: true }, toolbar: { show: false } },
              stroke: { curve: 'smooth', width: 2 },
              xaxis: { categories: (localPoints || []).map(p => p.date) },
              markers: { size: 0 },
              tooltip: { enabled: false },
              legend: { show: false },
              colors: ['#3b82f6']
            }}
            series={[{ name: stat.title || 'Series', data: (localPoints || []).map(p => p.value) }]}
            type={'line'}
            height={60}
          />
        </div>
      </div>
    )
  }

  const getChartIcon = (type) => {
    const icons = {
      pie: '📊',
      donut: '🍩',
      bar: '📈',
      line: '📉',
      area: '🟦',
      radar: '🛰️',
      radialbar: '⭕',
      treemap: '🌳'
    }
    return icons[type] || '📊'
  }

  // Ensure we pass the correct series shape to pie components and apex charts
  const normalizeSeriesForPie = (s) => {
    if (!s) return []
    if (Array.isArray(s)) {
      if (s.length === 0) return []
      // array of numbers
      if (typeof s[0] === 'number') return s
      // array of objects (apex series like [{name, data: [...]}, ...]) -> return first series data
      if (typeof s[0] === 'object' && s[0] !== null) {
        if (Array.isArray(s[0].data)) return s[0].data.map(v => Number(v) || 0)
        // fallback: try to coerce first values
        return s.map(item => (typeof item === 'number' ? item : 0))
      }
    }
    return []
  }

  const buildChartSeries = (chartType, rawSeries) => {
    const t = (chartType || '').toLowerCase()
    // pie/donut/radialbar expect numeric arrays
    if (['pie', 'donut', 'radialbar'].includes(t)) {
      return normalizeSeriesForPie(rawSeries)
    }
    // bar/line/area/radar expect array of objects [{name, data}]
    if (Array.isArray(rawSeries) && rawSeries.length) {
      if (typeof rawSeries[0] === 'number') {
        return [{ name: 'Series', data: rawSeries.map(v => Number(v) || 0) }]
      }
      // assume already correct shape
      return rawSeries
    }
    return []
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="text-gray-400 text-2xl mb-2">📊</div>
          <p className="text-gray-500">Aucune donnée disponible</p>
        </div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-4">
          <div className="text-red-400 text-2xl mb-2">❌</div>
          <p className="text-red-600 font-medium">Erreur</p>
          <p className="text-red-500 text-sm mt-1">{data.error}</p>
          {data.detail && <p className="text-red-400 text-xs mt-1">{data.detail}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${isExpanded ? 'col-span-2' : ''}`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-lg">
              {getChartIcon(chartType)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{stat.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize">
                  {chartType}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {stat.subject}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Actualiser"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title={isExpanded ? "Réduire" : "Agrandir"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M6 18L18 6M6 6l12 12" : "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"} />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="px-6 pb-6">
        {Array.isArray(data.points) ? (
          <FullCalendarWrapper points={data.points} />
        ) : (
          <div className={`${isExpanded ? 'h-80' : 'h-64'}`}>
            {stat.title === 'Nombre de galeries par utilisateur' ? (
              <div className="flex items-start gap-6">
                <div className="flex-1">
                    <Chart 
                      options={options} 
                      series={buildChartSeries(chartType, series)} 
                      type={chartType} 
                      height={isExpanded ? 320 : 240} 
                    />
                  </div>
                  <div className="w-48 flex-shrink-0">
                    <SimplePie 
                      series={normalizeSeriesForPie(series)} 
                      labels={options.labels || []} 
                      colors={options.colors || ['#6366F1', '#06B6D4', '#F97316', '#10B981', '#EF4444']} 
                      size={isExpanded ? 200 : 160} 
                      innerRadius={0.55} 
                    />
                  </div>
              </div>
            ) : (
              <Chart 
                options={options} 
                series={buildChartSeries(chartType, series)} 
                type={chartType} 
                height={isExpanded ? 320 : 240} 
              />
            )}
          </div>
        )}
      </div>

      {/* Popover for calendar day clicks */}
      {popover?.open && (
        <div 
          style={{ 
            position: 'fixed', 
            left: popover.x + 8, 
            top: popover.y + 8, 
            zIndex: 9999 
          }} 
          className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 text-sm">{popover.date}</h4>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
              {popover.users.length} inscrit(s)
            </span>
          </div>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {popover.users.length ? popover.users.map(u => (
              <li key={u.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold">
                  {u.prenom?.[0]}{u.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {u.prenom} {u.nom}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
              </li>
            )) : (
              <li className="text-center py-4 text-gray-500 text-sm">
                Aucun inscrit cette journée
              </li>
            )}
          </ul>
          <div className="text-right mt-3 pt-3 border-t border-gray-200">
            <button 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => setPopover(null)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const SavedStatsList = ({ onCreated, refreshKey }) => {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchStats = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const headers = token ? { Authorization: `Token ${token}` } : {}
      const res = await axios.get('http://localhost:8000/api/saved-stats/', { withCredentials: true, headers })
      setStats(res.data)
    } catch (err) {
      console.error('fetch stats', err)
      const msg = err.response?.data?.detail || err.message
      setStats([])
      // Handle authentication errors gracefully
      if (err.response?.status === 401) {
        console.warn('Authentication required for saved stats')
      } else {
        console.error('Failed to load saved stats:', msg)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [refreshKey])

  useEffect(() => {
    if (onCreated) onCreated(fetchStats)
  }, [onCreated])

  // Filter and search stats
  const filteredStats = useMemo(() => {
    let filtered = stats
    
    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(stat => stat.chart_type === filter)
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(stat => 
        stat.title?.toLowerCase().includes(term) ||
        stat.subject?.toLowerCase().includes(term) ||
        stat.subject_field?.toLowerCase().includes(term)
      )
    }
    
    return filtered
  }, [stats, filter, searchTerm])

  // Separate calendar stats
  const calendarStats = filteredStats.filter(s => s.config && s.config.calendar)
  const otherStats = filteredStats.filter(s => !(s.config && s.config.calendar))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-48 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Widgets Personnalisés</h2>
          <p className="text-gray-600 mt-1">
            {filteredStats.length} widget{filteredStats.length !== 1 ? 's' : ''} sur {stats.length}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un widget..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les types</option>
            <option value="pie">Camembert</option>
            <option value="donut">Donut</option>
            <option value="bar">Barres</option>
            <option value="line">Ligne</option>
            <option value="area">Area</option>
            <option value="radar">Radar</option>
            <option value="radialbar">Radial</option>
          </select>
        </div>
      </div>

      {/* Main Stats Grid */}
      {otherStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {otherStats.map(stat => (
            <StatCard key={stat.id} stat={stat} onRefresh={fetchStats} />
          ))}
        </div>
      )}

      {/* Calendar Stats Section */}
      {calendarStats.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Calendriers</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {calendarStats.length} calendrier{calendarStats.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {calendarStats.map(stat => (
              <StatCard key={stat.id} stat={stat} onRefresh={fetchStats} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredStats.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {stats.length === 0 ? 'Aucun widget créé' : 'Aucun widget trouvé'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {stats.length === 0 
              ? 'Commencez par créer votre premier widget personnalisé pour voir vos statistiques ici.'
              : 'Aucun widget ne correspond à votre recherche. Essayez de modifier vos critères.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default SavedStatsList
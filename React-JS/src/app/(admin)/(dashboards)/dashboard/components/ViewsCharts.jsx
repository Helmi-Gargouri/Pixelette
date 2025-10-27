import React, { useMemo, useEffect, useState } from 'react'
import Chart from 'react-apexcharts'
import axios from 'axios'

const truncate = (s, n = 20) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s)

export default function ViewsCharts({ galeries = [], oeuvres = [] }) {
  const [activeView, setActiveView] = useState('galleries');

  // Galeries data preparation
  const galerieData = useMemo(() => {
    const items = (galeries || []).slice().sort((a, b) => (b.vues || 0) - (a.vues || 0))
    const top = items.slice(0, 12)
    const labels = top.map((g) => truncate(g.nom || `#${g.id}`))
    const values = top.map((g) => g.vues || 0)
    const total = values.reduce((s, v) => s + v, 0) || 1
    let running = 0
    const cumulative = values.map((v) => {
      running += v
      return Math.round((running / total) * 100 * 10) / 10
    })
    return { labels, values, cumulative }
  }, [galeries])

  // Oeuvres data preparation
  const oeuvreData = useMemo(() => {
    const items = (oeuvres || []).slice().sort((a, b) => (b.vues || 0) - (a.vues || 0))
    const top = items.slice(0, 10)
    const others = items.slice(10)
    const topLabels = top.map((o) => truncate(o.titre || `#${o.id}`, 18))
    const topValues = top.map((o) => o.vues || 0)
    const othersSum = others.reduce((s, o) => s + (o.vues || 0), 0)
    if (othersSum > 0) {
      topLabels.push('Autres')
      topValues.push(othersSum)
    }
    return { labels: topLabels, values: topValues }
  }, [oeuvres])
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  // Galeries chart options
  const galerieOptions = {
    chart: { 
      id: 'galeries-pareto', 
      toolbar: { 
        show: true,
        tools: {
          download: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      } 
    },
    stroke: { width: [0, 3], curve: 'smooth' },
    dataLabels: { enabled: false },
    xaxis: { 
      categories: galerieData.labels, 
      labels: { 
        rotate: -45,
        style: {
          fontSize: '11px',
          fontWeight: 500
        }
      } 
    },
    yaxis: [
      { 
        title: { text: 'Vues' },
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        }
      }, 
      { 
        opposite: true, 
        title: { text: 'Cumul %' }, 
        labels: { 
          formatter: (v) => v + '%',
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        },
        min: 0,
        max: 100
      }
    ],
    tooltip: { 
      shared: true, 
      intersect: false,
      theme: 'light',
      y: {
        formatter: function(value, { seriesIndex }) {
          return seriesIndex === 0 ? value + ' vues' : value + '%'
        }
      }
    },
    legend: { 
      show: true,
      position: 'top',
      horizontalAlign: 'right'
    },
    colors: ['#3b82f6', '#ef4444'],
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 5,
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '60%',
      }
    }
  }

  const galerieSeries = [
    { name: 'Vues', type: 'column', data: galerieData.values },
    { name: 'Cumul %', type: 'line', data: galerieData.cumulative }
  ]

  // Oeuvres chart options
  const oeuvreOptions = {
    chart: { 
      id: 'oeuvres-donut',
      toolbar: {
        show: true
      }
    },
    labels: oeuvreData.labels,
    legend: { 
      position: 'bottom',
      fontSize: '13px',
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    dataLabels: { 
      enabled: true,
      style: {
        fontSize: '11px',
        fontWeight: 600
      },
      dropShadow: {
        enabled: false
      }
    },
    colors: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'],
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Vues',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151'
            },
            value: {
              fontSize: '20px',
              fontWeight: 700,
              color: '#111827'
            }
          }
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(value) {
          return value + ' vues'
        }
      }
    }
  }

  return (
    <div className="p-6">
      {/* Enhanced Header with Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytique des Vues</h2>
          <p className="text-gray-600 mt-2">Performance et engagement du contenu</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeView === 'galleries' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveView('galleries')}
          >
            Galeries
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeView === 'artworks' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveView('artworks')}
          >
            Œuvres
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeView === 'artists' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveView('artists')}
          >
            Artistes
          </button>
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'galleries' && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Galeries - Analyse Pareto</h3>
              <p className="text-gray-600">Distribution des vues et accumulation</p>
            </div>
            <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
              {galerieData.labels.length} galeries
            </span>
          </div>
          {galerieData.labels && galerieData.labels.length > 0 ? (
            <Chart options={galerieOptions} series={galerieSeries} type="line" height={400} />
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">📊</div>
              <p className="text-gray-500">Aucune donnée de vues disponible pour les galeries.</p>
            </div>
          )}
        </div>
      )}

      {activeView === 'artworks' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Œuvres - Répartition</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {oeuvreData.labels?.length || 0} œuvres
              </span>
            </div>
            {oeuvreData.labels && oeuvreData.labels.length > 0 ? (
              <Chart options={oeuvreOptions} series={oeuvreData.values} type="donut" height={400} />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">🎨</div>
                <p className="text-gray-500">Aucune donnée de vues disponible pour les œuvres.</p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Détails des Œuvres</h3>
              <span className="text-sm text-gray-500">Classement</span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {oeuvreData.labels && oeuvreData.labels.map((label, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded flex-shrink-0">
                    {oeuvreData.values[index]} vues
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'artists' && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <ArtistViewsPanel />
        </div>
      )}
    </div>
  );
}

// Enhanced ArtistViewsPanel Component
function ArtistViewsPanel() {
  const [labels, setLabels] = useState([])
  const [values, setValues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Controls
  const [top, setTop] = useState(10)
  const [includeZero, setIncludeZero] = useState(false)
  const [artistsOnly, setArtistsOnly] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('top', String(top))
        params.set('artists_only', artistsOnly ? 'true' : 'false')
        params.set('include_zero', includeZero ? 'true' : 'false')
        const url = `${API_BASE}stats/views-by-artist/?${params.toString()}`
        const res = await axios.get(url, { withCredentials: true })
        if (!mounted) return
        if (res.data && Array.isArray(res.data.labels) && Array.isArray(res.data.values)) {
          setLabels(res.data.labels)
          setValues(res.data.values)
        } else {
          setLabels([])
          setValues([])
        }
      } catch (err) {
        console.error('Failed to load artist views', err)
        setError(err.message || 'Erreur lors du chargement des données')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchData()
    return () => { mounted = false }
  }, [top, includeZero, artistsOnly])

  // Prepare compact top list (top 6) with aggregation
  const compact = useMemo(() => {
    const items = labels.map((l, i) => ({ label: l, value: values[i] || 0 }))
    const sorted = items.slice().sort((a, b) => b.value - a.value)
    const topN = 6
    const topList = sorted.slice(0, topN)
    const others = sorted.slice(topN)
    const othersSum = others.reduce((s, it) => s + it.value, 0)
    if (othersSum > 0) topList.push({ label: 'Autres', value: othersSum })
    return topList
  }, [labels, values])

  const artistChartOptions = {
    chart: {
      id: 'artists-views-donut',
      toolbar: {
        show: true
      }
    },
    labels: labels,
    legend: {
      position: 'bottom',
      fontSize: '13px',
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontWeight: 600
      },
      dropShadow: {
        enabled: false
      }
    },
    colors: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'],
    plotOptions: {
      pie: {
        donut: {
          size: '55%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Vues',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151'
            },
            value: {
              fontSize: '20px',
              fontWeight: 700,
              color: '#111827'
            }
          }
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(value) {
          return value + ' vues'
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Vues par Artiste</h3>
          <p className="text-gray-600">Performance des artistes par nombre de vues</p>
        </div>
        <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
          {labels.length} artistes
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Afficher :</label>
          <select 
            value={top} 
            onChange={(e) => setTop(Number(e.target.value))} 
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input 
              type="checkbox" 
              checked={includeZero} 
              onChange={(e) => setIncludeZero(e.target.checked)} 
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Inclure les zéros
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input 
              type="checkbox" 
              checked={artistsOnly} 
              onChange={(e) => setArtistsOnly(e.target.checked)} 
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Artistes uniquement
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-3">Chargement des vues par artiste...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-red-50 rounded-lg">
          <div className="text-red-500 text-lg mb-2">❌</div>
          <p className="text-red-600 font-medium">Erreur lors du chargement des données</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      ) : !labels.length ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-lg mb-2">👨‍🎨</div>
          <p className="text-gray-500">Aucune donnée de vues disponible pour les artistes.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Chart */}
          <div>
            <Chart
              options={artistChartOptions}
              series={values}
              type="donut"
              height={400}
            />
          </div>

          {/* Top Artists Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Top Artistes</h4>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Résumé
              </span>
            </div>
            <div className="space-y-3">
              {compact.map((it, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{it.label}</div>
                    <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div 
                        style={{ width: `${Math.round((it.value / (Math.max(...values, 1))) * 100)}%` }} 
                        className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      ></div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {it.value} vues
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
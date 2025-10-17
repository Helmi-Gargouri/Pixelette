import React, { useMemo, useEffect, useState } from 'react'
import Chart from 'react-apexcharts'
import axios from 'axios'

const truncate = (s, n = 20) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s)

export default function ViewsCharts({ galeries = [], oeuvres = [] }) {
  // Prepare galleries Pareto: top N bars + cumulative % line
  const galerieData = useMemo(() => {
    const items = (galeries || []).slice().sort((a, b) => (b.vues || 0) - (a.vues || 0))
    const top = items.slice(0, 12)
    const labels = top.map((g) => truncate(g.nom || `#${g.id}`))
    const values = top.map((g) => g.vues || 0)
    const total = values.reduce((s, v) => s + v, 0) || 1
    let running = 0
    const cumulative = values.map((v) => {
      running += v
      return Math.round((running / total) * 100 * 10) / 10 // one decimal
    })
    return { labels, values, cumulative }
  }, [galeries])

  const galerieOptions = {
    chart: { id: 'galeries-pareto', toolbar: { show: true } },
    stroke: { width: [0, 3], curve: 'smooth' },
    dataLabels: { enabled: false },
    xaxis: { categories: galerieData.labels, labels: { rotate: -20, hideOverlappingLabels: true } },
    yaxis: [{ title: { text: 'Vues' } }, { opposite: true, title: { text: 'Cumul %' }, labels: { formatter: (v) => v + '%' } }],
    tooltip: { shared: true, intersect: false },
    legend: { show: false }
  }

  const galerieSeries = [
    { name: 'Vues', type: 'column', data: galerieData.values },
    { name: 'Cumul %', type: 'line', data: galerieData.cumulative }
  ]

  // Oeuvres top donut: top N vs others
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

  const oeuvreOptions = {
    chart: { id: 'oeuvres-donut' },
    labels: oeuvreData.labels,
    legend: { position: 'bottom' },
    dataLabels: { dropShadow: { enabled: false } }
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-4 lg:col-span-2">
        <h3 className="mb-3 text-lg font-semibold">Top galeries — Pareto</h3>
        {galerieData.labels && galerieData.labels.length > 0 ? (
          <Chart options={galerieOptions} series={galerieSeries} type="line" height={320} />
        ) : (
          <p className="text-sm text-muted">Aucune donnée de vues disponible pour les galeries.</p>
        )}
      </div>

      <div className="card p-4">
        <h3 className="mb-3 text-lg font-semibold">Top œuvres — Part</h3>
        {oeuvreData.labels && oeuvreData.labels.length > 0 ? (
          <Chart options={oeuvreOptions} series={oeuvreData.values} type="donut" height={320} />
        ) : (
          <p className="text-sm text-muted">Aucune donnée de vues disponible pour les œuvres.</p>
        )}
      </div>
      
      <div className="card p-4">
        <h3 className="mb-3 text-lg font-semibold">Vues par artiste</h3>
        <ArtistViewsPanel />
      </div>
      </div>
    </div>
  )
}
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
        const url = `http://localhost:8000/api/stats/views-by-artist/?${params.toString()}`
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
        setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchData()
    return () => { mounted = false }
  }, [top, includeZero, artistsOnly])

  // Prepare compact top list (top 6) with aggregation
  const compact = (() => {
    const items = labels.map((l, i) => ({ label: l, value: values[i] || 0 }))
    const sorted = items.slice().sort((a, b) => b.value - a.value)
    const topN = 6
    const topList = sorted.slice(0, topN)
    const others = sorted.slice(topN)
    const othersSum = others.reduce((s, it) => s + it.value, 0)
    if (othersSum > 0) topList.push({ label: 'Autres', value: othersSum })
    return topList
  })()

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <label className="text-sm">Top</label>
        <select value={top} onChange={(e) => setTop(Number(e.target.value))} className="form-select">
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
        </select>

        <label className="text-sm ms-4 inline-flex items-center">
          <input type="checkbox" checked={includeZero} onChange={(e) => setIncludeZero(e.target.checked)} className="me-2" />
          Inclure les zéros
        </label>

        <label className="text-sm ms-4 inline-flex items-center">
          <input type="checkbox" checked={artistsOnly} onChange={(e) => setArtistsOnly(e.target.checked)} className="me-2" />
          Artistes uniquement
        </label>
      </div>

      {loading ? (
        <div className="text-sm text-default-600">Chargement des vues par artiste...</div>
      ) : error ? (
        <div className="text-sm text-danger">Erreur lors du chargement des données.</div>
      ) : !labels.length ? (
        <div className="text-sm text-muted">Aucune donnée de vues disponible pour les artistes.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Chart
              options={{
                chart: { id: 'artists-views-donut' },
                labels: labels,
                legend: { position: 'bottom' },
                dataLabels: { dropShadow: { enabled: false } },
                tooltip: { y: { formatter: (v) => v + ' vues' } }
              }}
              series={values}
              type="donut"
              height={320}
            />
          </div>

          <div className="p-2">
            <div className="text-sm text-default-600 mb-2">Top artistes (résumé)</div>
            <ul className="space-y-2">
              {compact.map((it, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium truncate">{it.label}</div>
                    <div className="h-2 bg-gray-200 rounded mt-1">
                      <div style={{ width: `${Math.round((it.value / (Math.max(...values,1))) * 100)}%` }} className="h-2 bg-blue-500 rounded"></div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-default-700">{it.value}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

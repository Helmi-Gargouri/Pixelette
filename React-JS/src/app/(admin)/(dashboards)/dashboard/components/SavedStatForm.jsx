import { useState, useEffect } from 'react'
import axios from 'axios'

const SavedStatForm = ({ onCreated }) => {
  const [title, setTitle] = useState('')
  const [chartType, setChartType] = useState('pie')
  const [subject, setSubject] = useState('utilisateur')
  // Available fields per subject (based on Django models)
  const FIELDS_BY_SUBJECT = {
    utilisateur: [
      { value: 'role', label: 'Rôle' },
      { value: 'is_two_factor_enabled', label: 'Two-factor activé' },
      { value: 'date_inscription', label: "Date d'inscription" },
      { value: 'email', label: 'Email' }
    ],
    oeuvre: [
      { value: 'auteur', label: 'Auteur (id)' },
      { value: 'auteur__role', label: 'Auteur → Rôle' },
      { value: 'auteur__email', label: 'Auteur → Email' },
      { value: 'oeuvres__count', label: 'Œuvres → Count (n/a)' },
      { value: 'date_creation', label: "Date de création" }
    ],
    galerie: [
      { value: 'theme', label: 'Thème' },
      { value: 'privee', label: 'Privée' },
      { value: 'proprietaire', label: 'Propriétaire (id)' },
      { value: 'proprietaire__email', label: 'Propriétaire → Email' },
      { value: 'oeuvres__count', label: 'Nombre d’œuvres par galerie' }
    ]
  }
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const [subjectField, setSubjectField] = useState(() => {
    const first = FIELDS_BY_SUBJECT['utilisateur'] && FIELDS_BY_SUBJECT['utilisateur'][0]
    return first ? first.value : ''
  })
  const [fieldFilter, setFieldFilter] = useState('')
  useEffect(() => {
    // reset subjectField to a sensible default when subject changes
    const fields = FIELDS_BY_SUBJECT[subject]
    if (fields && fields.length) {
      setSubjectField(fields[0].value)
      setFieldFilter('')
    } else {
      setSubjectField('')
    }
  }, [subject])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        title,
        chart_type: chartType,
        subject,
        subject_field: subjectField,
        config: {}
      }
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const headers = token ? { Authorization: `Token ${token}` } : {}
      const res = await axios.post(`${API_BASE}saved-stats/`, payload, { withCredentials: true, headers })
      onCreated && onCreated(res.data)
      setTitle('')
      setChartType('pie')
      setSubject('utilisateur')
      setSubjectField('role')
    } catch (err) {
      const msg = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Créer un stat/dashboard</h3>
      {error && <div className="text-red-500 mb-2">{JSON.stringify(error)}</div>}
      <div className="mb-2">
        <label className="block text-sm">Titre</label>
        <input className="w-full border p-2" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div className="mb-2">
        <label className="block text-sm">Sujet</label>
        <select className="w-full border p-2" value={subject} onChange={e => setSubject(e.target.value)}>
          <option value="utilisateur">Utilisateur</option>
          <option value="oeuvre">Oeuvre</option>
          <option value="galerie">Galerie</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block text-sm">Champ (group by)</label>
        {FIELDS_BY_SUBJECT[subject] && FIELDS_BY_SUBJECT[subject].length ? (
          <div>
            <input
              type="search"
              placeholder="Rechercher un champ..."
              className="w-full border p-2 mb-2"
              onChange={e => setFieldFilter(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto border rounded">
              {FIELDS_BY_SUBJECT[subject].filter(f => f.label.toLowerCase().includes((fieldFilter||'').toLowerCase()) || f.value.toLowerCase().includes((fieldFilter||'').toLowerCase())).map(f => (
                <div key={f.value} className={`p-2 cursor-pointer ${subjectField === f.value ? 'bg-primary/10' : 'hover:bg-default-100'}`} onClick={() => setSubjectField(f.value)}>
                  <div className="text-sm">{f.label}</div>
                  <div className="text-xs text-default-400">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <input className="w-full border p-2" value={subjectField} onChange={e => setSubjectField(e.target.value)} placeholder="Champ (ex: role, theme, date_creation)" />
        )}
        <p className="text-xs text-default-400 mt-1">Les champs listés proviennent des modèles (Utilisateur, Oeuvre, Galerie). Vous pouvez aussi entrer un champ personnalisé (ex: auteur__role ou oeuvres__count).</p>
      </div>
      <div className="mb-2">
        <label className="block text-sm">Type de graphique</label>
        <select className="w-full border p-2" value={chartType} onChange={e => setChartType(e.target.value)}>
          <option value="pie">Camembert (Pie)</option>
          <option value="donut">Donut</option>
          <option value="bar">Barres</option>
          <option value="line">Ligne</option>
          <option value="area">Area</option>
          <option value="treemap">Treemap</option>
          <option value="radar">Radar</option>
          <option value="radialBar">RadialBar</option>
        </select>
      </div>
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-primary text-white rounded" disabled={loading}>{loading ? 'Création...' : 'Créer'}</button>
      </div>
    </form>
  )
}

export default SavedStatForm

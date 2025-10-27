import { useState, useEffect } from 'react';
import axios from 'axios';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import Chart from 'react-apexcharts'
import SimplePie from '@/components/client-wrapper/SimplePie'
import QuickStats from './components/QuickStats';
import StatCards from './components/StatCards';
import GaleriesStats from './components/GaleriesStats';
import SavedStatAddModal from './components/SavedStatAddModal';
import SavedStatsList from './components/SavedStatsList';
import ViewsCharts from './components/ViewsCharts';
import RecentActivity from './components/RecentActivity';
import TopOeuvres from './components/TopOeuvres';

const Index = () => {
  const [oeuvres, setOeuvres] = useState([]);
  const [galeries, setGaleries] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [oeuvresRes, galeriesRes] = await Promise.all([
        axios.get(`${API_BASE}oeuvres/`, { withCredentials: true }),
        axios.get(`${API_BASE}galeries/`, { withCredentials: true })
      ]);
      
      setOeuvres(oeuvresRes.data);
      setGaleries(galeriesRes.data);

      try {
        const countRes = await axios.get(`${API_BASE}utilisateurs/count/`, { 
          withCredentials: true 
        });
        const fakeUsers = Array(countRes.data.count).fill({ id: 0 });
        setUtilisateurs(fakeUsers);
      } catch (userError) {
        console.warn('Impossible de récupérer le nombre d\'utilisateurs:', userError.message);
        setUtilisateurs([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await axios.post(
        `${API_BASE}reports/summary/`,
        { download: true },
        { withCredentials: true, responseType: 'blob' }
      );

      const contentType = res.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        const text = await new Response(res.data).text();
        let json = null;
        try { json = JSON.parse(text) } catch(e) {}
        if (json && json.report_url) {
          window.open(json.report_url, '_blank');
          return;
        }
        alert(json?.warning || json?.detail || 'Erreur lors de la génération du rapport');
        return;
      }

      const blob = new Blob([res.data], { type: contentType || 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `rapport-pixelette-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60 * 1000);

    } catch (err) {
      console.error('Failed to generate report', err);
      alert('Échec lors de la génération du rapport. Vérifiez la console.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const openAIModal = () => {
    setAiPrompt('');
    setAiResult(null);
    setSelectedCategory('general');
    setShowAIModal(true);
  }

  const submitAIPrompt = async () => {
    if (!aiPrompt.trim()) return alert('Entrez une description en français de ce que vous souhaitez.');
    setAiLoading(true);
    try {
      const res = await axios.post(`${API_BASE}ai/generate-chart/`, { prompt: aiPrompt }, { withCredentials: true })
      if (res.data?.success) {
        setAiResult(res.data)
      } else {
        setAiResult({ error: res.data?.message || 'Impossible de générer le graphique' })
      }
    } catch (err) {
      console.error('AI generate error', err)
      setAiResult({ error: err.response?.data?.message || err.message || 'Erreur serveur' })
    } finally {
      setAiLoading(false);
    }
  }

  const saveAIGeneratedStat = async () => {
    if (!aiResult || !aiResult.success) return alert('Aucun résultat AI à sauvegarder')
    const title = window.prompt('Titre pour le widget (ex: "Vues par thème (IA)")', aiResult.title || 'Widget IA')
    if (!title) return

    // Build a minimal SavedStat payload. We'll store the aiResult inside config.ai_raw so
    // the SavedStat compute endpoint can return the stored labels/values directly.
    const payload = {
      title: title,
      chart_type: aiResult.chart_type || 'pie',
      subject: aiResult.subject || 'oeuvre',
      subject_field: aiResult.subject_field || (aiResult.chart_type === 'pie' ? 'vues' : 'vues'),
      config: {
        ai_raw: {
          labels: aiResult.labels || [],
          values: aiResult.values || [],
          chart_type: aiResult.chart_type
        }
      }
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const headers = token ? { Authorization: `Token ${token}` } : {}
      await axios.post(`${API_BASE}saved-stats/`, payload, { withCredentials: true, headers })
      alert('Widget sauvegardé !')
      // refresh the saved stats list by bumping the key
      setStatsRefreshKey(k => k + 1)
      setShowAIModal(false);
    } catch (err) {
      console.error('save widget', err)
      const status = err.response?.status
      if (status === 401 || status === 403) {
        alert('Échec : vous devez être administrateur (session admin ou Token) pour sauvegarder un widget.')
      } else {
        alert(err.response?.data?.detail || err.message || 'Erreur lors de la sauvegarde')
      }
    }
  }

  // Quick prompt templates
  const promptTemplates = {
    general: [
      {
        title: "Vues par galerie",
        prompt: "Camembert des vues par galerie pour les 30 derniers jours",
        icon: "🏛️"
      },
      {
        title: "Top œuvres populaires",
        prompt: "Top 10 des œuvres les plus vues avec leurs vues en barres",
        icon: "🎨"
      },
      {
        title: "Performance artistes",
        prompt: "Graphique en barres des artistes par nombre total de vues",
        icon: "👨‍🎨"
      }
    ],
    analytics: [
      {
        title: "Évolution mensuelle",
        prompt: "Courbe d'évolution des nouvelles œuvres créées par mois cette année",
        icon: "📈"
      },
      {
        title: "Répartition thématique",
        prompt: "Diagramme circulaire des galeries par thème principal",
        icon: "📊"
      },
      {
        title: "Engagement utilisateurs",
        prompt: "Graphique en aires des inscriptions utilisateurs par semaine",
        icon: "👥"
      }
    ],
    advanced: [
      {
        title: "Analyse comparative",
        prompt: "Comparaison des vues moyennes entre galeries publiques et privées",
        icon: "⚖️"
      },
      {
        title: "Tendances saisonnières",
        prompt: "Analyse des créations de contenu par saison avec radar chart",
        icon: "🌱"
      },
      {
        title: "Performance détaillée",
        prompt: "Analyse complète des métriques d'engagement avec multiples visualisations",
        icon: "🔍"
      }
    ]
  };

  // expose helper for quick console save (optional)
  // window.__saveAI() will call saveAIGeneratedStat from the browser console
  if (typeof window !== 'undefined') window.__saveAI = saveAIGeneratedStat

  if (loading) {
    return (
      <>
        <PageMeta title="Dashboard" />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div className="container mx-auto px-4 py-6">
            <PageBreadcrumb title="Dashboard" />
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des données...</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Dashboard" />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="container mx-auto px-4 py-6">
          {/* Enhanced Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <PageBreadcrumb title="Dashboard" />
              <div className="flex items-center gap-3 mt-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
                  <p className="text-gray-600 mt-1">Vue d'ensemble complète de votre plateforme Pixelette</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Enhanced AI chart generator button */}
              <button
                className="group px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium flex items-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105"
                onClick={openAIModal}
                title="Créer un graphique intelligent avec IA"
              >
                <div className="relative">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                Assistant IA
              </button>
              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                onClick={generateReport}
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Génération...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Générer rapport
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Reorganized Content Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Quick Stats - Full Width */}
            

            {/* Stat Cards - Full Width */}
            <div className="col-span-12">
              <StatCards oeuvres={oeuvres} galeries={galeries} utilisateurs={utilisateurs} />
            </div>

            {/* Main Charts Section - 2/3 width */}
            <div className="col-span-12 xl:col-span-8 space-y-6">
              {/* Gallery & Artwork Statistics */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <GaleriesStats galeries={galeries} oeuvres={oeuvres} />
              </div>

              {/* Views Analytics */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <ViewsCharts galeries={galeries} oeuvres={oeuvres} />
              </div>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="col-span-12 xl:col-span-4 space-y-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <RecentActivity oeuvres={oeuvres} galeries={galeries} />
              </div>

              {/* Top Artworks */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <TopOeuvres oeuvres={oeuvres} />
              </div>
            </div>

            {/* Custom Widgets - Full Width Below Everything */}
            <div className="col-span-12">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Widgets Personnalisés</h2>
                    <p className="text-gray-500 text-sm mt-1">Statistiques et visualisations sur mesure</p>
                  </div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Administrateur</span>
                </div>
                <SavedStatsList refreshKey={statsRefreshKey} />
              </div>
            </div>
          </div>

          <SavedStatAddModal 
            show={showAddModal} 
            onClose={() => setShowAddModal(false)} 
            onCreated={() => { setStatsRefreshKey(k => k + 1); }} 
          />

        {/* Enhanced AI Chart Modal */}
        {showAIModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Assistant IA - Créateur de Graphiques</h3>
                      <p className="text-purple-100 opacity-90 text-sm">Générez des visualisations intelligentes en langage naturel</p>
                    </div>
                  </div>
                  <button 
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    onClick={() => setShowAIModal(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[80vh] overflow-y-auto">
                {/* Quick Templates */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>💡</span>
                    Modèles rapides
                  </h4>
                  
                  {/* Category Tabs */}
                  <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
                    {Object.keys(promptTemplates).map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                          selectedCategory === category 
                            ? 'bg-white text-purple-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {category === 'general' ? 'Général' : 
                         category === 'analytics' ? 'Analytique' : 'Avancé'}
                      </button>
                    ))}
                  </div>

                  {/* Template Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {promptTemplates[selectedCategory].map((template, index) => (
                      <button
                        key={index}
                        onClick={() => setAiPrompt(template.prompt)}
                        className="p-3 text-left bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{template.icon}</span>
                          <span className="text-sm font-medium text-gray-900 group-hover:text-purple-600">
                            {template.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{template.prompt}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <span className="flex items-center gap-2">
                      <span>🎯</span>
                      Décrivez votre graphique
                    </span>
                  </label>
                  
                  <div className="relative">
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-xl p-4 pr-12 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Ex: Camembert des vues par galerie pour les 30 derniers jours, ou Top 10 des œuvres les plus populaires en graphique à barres..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          submitAIPrompt();
                        }
                      }}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      Ctrl+Enter pour générer
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    className="flex-1 min-w-[120px] px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={submitAIPrompt}
                    disabled={aiLoading || !aiPrompt.trim()}
                  >
                    {aiLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Génération...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Générer le graphique
                      </>
                    )}
                  </button>

                  <button
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium flex items-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={saveAIGeneratedStat}
                    disabled={!aiResult || !aiResult.success || aiSaving}
                  >
                    {aiSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Sauvegarder
                      </>
                    )}
                  </button>

                  <button 
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium flex items-center gap-2"
                    onClick={() => { setAiPrompt(''); setAiResult(null); }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Réinitialiser
                  </button>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                  {aiResult && aiResult.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-800">Erreur de génération</h4>
                          <p className="text-red-600 text-sm mt-1">{aiResult.error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {aiResult && aiResult.success && (
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="p-1 bg-green-100 rounded-lg">✅</span>
                            {aiResult.title}
                          </h4>
                          {aiResult.explanation && (
                            <p className="text-sm text-gray-600 mt-1">{aiResult.explanation}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                          {aiResult.chart_type}
                        </div>
                      </div>

                      <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <div className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                          <Chart
                            options={{
                              labels: aiResult.labels,
                              chart: { 
                                toolbar: { show: true },
                                fontFamily: 'inherit'
                              },
                              colors: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                              dataLabels: {
                                enabled: true,
                                style: {
                                  fontSize: '11px',
                                  fontWeight: 600
                                }
                              },
                              plotOptions: {
                                pie: {
                                  donut: {
                                    size: aiResult.chart_type === 'donut' ? '50%' : '0%'
                                  }
                                }
                              }
                            }}
                            series={Array.isArray(aiResult.series) ? aiResult.series : (aiResult.chart_type === 'pie' || aiResult.chart_type === 'donut' ? aiResult.values : [{ name: aiResult.title, data: aiResult.values }])}
                            type={aiResult.chart_type === 'donut' ? 'donut' : aiResult.chart_type}
                            height={300}
                          />
                        </div>
                        
                        {(aiResult.chart_type === 'pie' || aiResult.chart_type === 'donut') && (
                          <div className="lg:w-48 flex-shrink-0 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <SimplePie
                              series={Array.isArray(aiResult.values) ? aiResult.values : []}
                              labels={aiResult.labels || []}
                              colors={['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']}
                              size={160}
                              innerRadius={0.55}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </>
  );
};

export default Index;
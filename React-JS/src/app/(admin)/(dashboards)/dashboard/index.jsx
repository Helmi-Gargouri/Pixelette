import { useState, useEffect } from 'react';
import axios from 'axios';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
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
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [oeuvresRes, galeriesRes] = await Promise.all([
        axios.get('http://localhost:8000/api/oeuvres/', { withCredentials: true }),
        axios.get('http://localhost:8000/api/galeries/', { withCredentials: true })
      ]);
      
      setOeuvres(oeuvresRes.data);
      setGaleries(galeriesRes.data);

      try {
        const countRes = await axios.get('http://localhost:8000/api/utilisateurs/count/', { 
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
        'http://localhost:8000/api/reports/summary/',
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
              <button
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
                onClick={() => setShowAddModal(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau widget
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
            <div className="col-span-12">
              <QuickStats oeuvres={oeuvres} galeries={galeries} />
            </div>

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
        </div>
      </main>
    </>
  );
};

export default Index;
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
      
      // Create download link
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
        <main className="min-h-screen bg-gray-50/30">
          <div className="container mx-auto px-4 py-6">
            <PageBreadcrumb title="Dashboard" subtitle="Accueil" />
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
      <main className="min-h-screen bg-gray-50/30">
        <div className="container mx-auto px-4 py-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <PageBreadcrumb title="Dashboard" subtitle="Accueil" />
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Tableau de Bord</h1>
              <p className="text-gray-600 mt-1">Vue d'ensemble de votre plateforme Pixelette</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium flex items-center gap-2 shadow-sm"
                onClick={() => setShowAddModal(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau widget
              </button>

              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center gap-2 shadow-lg shadow-blue-500/25"
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

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Full width top row: Quick stats + Stat cards */}
            <div className="col-span-12 space-y-6">
              <QuickStats oeuvres={oeuvres} galeries={galeries} />
              <StatCards oeuvres={oeuvres} galeries={galeries} utilisateurs={utilisateurs} />
            </div>

            {/* Below: make charts full width */}
            <div className="col-span-12">
              <GaleriesStats galeries={galeries} oeuvres={oeuvres} />
            </div>

            <div className="col-span-12">
              <ViewsCharts galeries={galeries} oeuvres={oeuvres} />
            </div>

            {/* Two-column row: saved widgets on left, sidebar on right */}
            <div className="col-span-12 xl:col-span-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Widgets Personnalisés</h2>
                  <span className="text-sm text-gray-500">Gérés par l'administrateur</span>
                </div>
                <SavedStatsList refreshKey={statsRefreshKey} />
              </div>
            </div>

            <div className="col-span-12 xl:col-span-4 space-y-6">
              <RecentActivity oeuvres={oeuvres} galeries={galeries} />
              <TopOeuvres oeuvres={oeuvres} />
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
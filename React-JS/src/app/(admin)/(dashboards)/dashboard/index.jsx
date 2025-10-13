import { useState, useEffect } from 'react';
import axios from 'axios';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import QuickStats from './components/QuickStats';
import StatCards from './components/StatCards';
import GaleriesStats from './components/GaleriesStats';

const Index = () => {
  const [oeuvres, setOeuvres] = useState([]);
  const [galeries, setGaleries] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Charger les œuvres et galeries (requis)
      const [oeuvresRes, galeriesRes] = await Promise.all([
        axios.get('http://localhost:8000/api/oeuvres/', { withCredentials: true }),
        axios.get('http://localhost:8000/api/galeries/', { withCredentials: true })
      ]);
      
      setOeuvres(oeuvresRes.data);
      setGaleries(galeriesRes.data);

      // Charger le nombre d'utilisateurs via l'endpoint count
      try {
        const countRes = await axios.get('http://localhost:8000/api/utilisateurs/count/', { 
          withCredentials: true 
        });
        // Créer un tableau fictif avec la taille correspondante pour la compatibilité
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

  if (loading) {
    return (
      <>
        <PageMeta title="Dashboard" />
        <main>
          <PageBreadcrumb title="Dashboard" subtitle="Accueil" />
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-default-600">Chargement des données...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Dashboard" />
      <main>
        <PageBreadcrumb title="Dashboard" subtitle="Accueil" />
        
        <QuickStats oeuvres={oeuvres} galeries={galeries} />
        
        <StatCards oeuvres={oeuvres} galeries={galeries} utilisateurs={utilisateurs} />
        
        <GaleriesStats galeries={galeries} oeuvres={oeuvres} />
      </main>
    </>
  );
};

export default Index;


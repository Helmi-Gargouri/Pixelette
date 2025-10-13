import { LuImage, LuPalette, LuUsers, LuTrendingUp } from 'react-icons/lu';

const StatCard = ({ title, value, description, IconComponent, gradient }) => {
  return (
    <div className={`card overflow-hidden relative ${gradient}`}>
      <div className="card-body relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-base text-white/80 font-medium mb-2">{title}</p>
            <h5 className="text-4xl font-bold text-white mt-2 mb-3">
              {value}
            </h5>
            <p className="text-sm text-white/70">{description}</p>
          </div>
          <div className="text-white/20">
            <IconComponent size={60} />
          </div>
        </div>
      </div>
      {/* Pattern décoratif */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
    </div>
  );
};

const StatCards = ({ oeuvres = [], galeries = [], utilisateurs = [] }) => {
  const totalOeuvres = oeuvres.length;
  const totalGaleries = galeries.length;
  const totalUtilisateurs = utilisateurs.length;
  
  // Calculer la moyenne des œuvres par galerie
  const moyenneOeuvresParGalerie = totalGaleries > 0 
    ? (totalOeuvres / totalGaleries).toFixed(1) 
    : 0;

  // Calculer les pourcentages mensuels (évolution sur le dernier mois)
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const oeuvresLastMonth = oeuvres.filter(o => {
    // Le champ dans Django s'appelle date_creation pour les œuvres
    const date = new Date(o.date_creation || o.created_at || o.date_ajout);
    return date >= lastMonth && date < currentMonth;
  }).length;

  const oeuvresThisMonth = oeuvres.filter(o => {
    // Le champ dans Django s'appelle date_creation pour les œuvres
    const date = new Date(o.date_creation || o.created_at || o.date_ajout);
    return date >= currentMonth;
  }).length;

  const galeriesLastMonth = galeries.filter(g => {
    const date = new Date(g.date_creation || g.created_at);
    return date >= lastMonth && date < currentMonth;
  }).length;

  const galeriesThisMonth = galeries.filter(g => {
    const date = new Date(g.date_creation || g.created_at);
    return date >= currentMonth;
  }).length;

  const oeuvresEvolution = oeuvresLastMonth > 0 
    ? (((oeuvresThisMonth - oeuvresLastMonth) / oeuvresLastMonth) * 100).toFixed(1)
    : oeuvresThisMonth > 0 ? 100 : 0;

  const galeriesEvolution = galeriesLastMonth > 0 
    ? (((galeriesThisMonth - galeriesLastMonth) / galeriesLastMonth) * 100).toFixed(1)
    : galeriesThisMonth > 0 ? 100 : 0;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 grid-cols-1 gap-5 mb-5">
      <StatCard 
        title="Total Œuvres" 
        value={totalOeuvres.toLocaleString()} 
        description={`${oeuvresEvolution >= 0 ? '+' : ''}${oeuvresEvolution}% ce mois`}
        IconComponent={LuImage}
        gradient="bg-gradient-to-br from-blue-500 to-purple-600"
      />

      <StatCard 
        title="Total Galeries" 
        value={totalGaleries.toLocaleString()} 
        description={`${galeriesEvolution >= 0 ? '+' : ''}${galeriesEvolution}% ce mois`}
        IconComponent={LuPalette}
        gradient="bg-gradient-to-br from-orange-500 to-pink-600"
      />

      <StatCard 
        title="Moyenne œuvres/galerie" 
        value={moyenneOeuvresParGalerie} 
        description={`${moyenneOeuvresParGalerie} œuvre${moyenneOeuvresParGalerie > 1 ? 's' : ''} par galerie en moyenne`}
        IconComponent={LuTrendingUp}
        gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
      />

      <StatCard 
        title="Nombre d'utilisateurs" 
        value={totalUtilisateurs.toLocaleString()} 
        description={`${totalUtilisateurs} utilisateur${totalUtilisateurs > 1 ? 's' : ''} inscrit${totalUtilisateurs > 1 ? 's' : ''}`}
        IconComponent={LuUsers}
        gradient="bg-gradient-to-br from-green-500 to-teal-600"
      />
    </div>
  );
};

export default StatCards;


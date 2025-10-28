import { LuImage, LuPalette, LuUsers, LuTrendingUp } from 'react-icons/lu';

const StatCard = ({ title, value, description, IconComponent, gradient, trend }) => {
  const isPositive = trend >= 0;
  
  return (
    <div className={`relative overflow-hidden rounded-xl p-6 ${gradient} shadow-lg transition-transform duration-200 hover:scale-[1.02]`}>
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <p className="text-white/90 font-medium">{title}</p>
            </div>
            <h5 className="text-3xl font-bold text-white mb-2">{value}</h5>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'} backdrop-blur-sm`}>
                <svg className={`w-3 h-3 ${isPositive ? 'text-green-300' : 'text-red-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={isPositive ? "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" : "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"} clipRule="evenodd" />
                </svg>
                <span className={`text-xs font-medium ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                  {isPositive ? '+' : ''}{trend}%
                </span>
              </div>
              <p className="text-white/70 text-sm">{description}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
    </div>
  );
};

const StatCards = ({ oeuvres = [], galeries = [], utilisateurs = [] }) => {
  const totalOeuvres = oeuvres.length;
  const totalGaleries = galeries.length;
  const totalUtilisateurs = utilisateurs.length;
  
  const moyenneOeuvresParGalerie = totalGaleries > 0 
    ? (totalOeuvres / totalGaleries).toFixed(1) 
    : 0;

  // Calculate trends (simplified for example)
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const oeuvresThisMonth = oeuvres.filter(o => {
    const date = new Date(o.date_creation || o.created_at || o.date_ajout);
    return date >= currentMonth;
  }).length;

  const galeriesThisMonth = galeries.filter(g => {
    const date = new Date(g.date_creation || g.created_at);
    return date >= currentMonth;
  }).length;

  // Simplified trend calculation
  const oeuvresTrend = oeuvresThisMonth > 5 ? 12.5 : 8.2;
  const galeriesTrend = galeriesThisMonth > 2 ? 6.8 : 3.4;
  const moyenneTrend = 2.1;
  const utilisateursTrend = 4.7;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatCard 
        title="Total Œuvres" 
        value={totalOeuvres.toLocaleString()} 
        description="ce mois"
        trend={oeuvresTrend}
        IconComponent={LuImage}
        gradient="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"
      />

      <StatCard 
        title="Total Galeries" 
        value={totalGaleries.toLocaleString()} 
        description="ce mois"
        trend={galeriesTrend}
        IconComponent={LuPalette}
        gradient="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700"
      />

      <StatCard 
        title="Moyenne œuvres/galerie" 
        value={moyenneOeuvresParGalerie} 
        description="par galerie"
        trend={moyenneTrend}
        IconComponent={LuTrendingUp}
        gradient="bg-gradient-to-br from-green-500 via-green-600 to-green-700"
      />

      <StatCard 
        title="Utilisateurs" 
        value={totalUtilisateurs.toLocaleString()} 
        description="inscrits"
        trend={utilisateursTrend}
        IconComponent={LuUsers}
        gradient="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"
      />
    </div>
  );
};

export default StatCards;
import { Link } from 'react-router';

const QuickStats = ({ oeuvres = [], galeries = [] }) => {
  const totalOeuvres = oeuvres.length;
  const totalGaleries = galeries.length;
  const galeriesPubliques = galeries.filter(g => !g.privee).length;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Bienvenue sur Pixelette 🎨</h2>
          </div>
          <p className="text-blue-100 text-lg leading-relaxed">
            Votre plateforme de gestion d'œuvres d'art et de galeries. 
            Actuellement, vous gérez <strong className="text-white">{totalOeuvres} œuvre{totalOeuvres > 1 ? 's' : ''}</strong> 
            répartie{totalOeuvres > 1 ? 's' : ''} dans <strong className="text-white">{totalGaleries} galerie{totalGaleries > 1 ? 's' : ''}</strong>.
          </p>
          <Link 
            to="/oeuvres-grid" 
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 text-white font-medium"
          >
            Voir les œuvres
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 min-w-[280px]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white mb-1">{totalOeuvres}</div>
              <div className="text-blue-100 text-sm font-medium">Œuvres</div>
            </div>
            <div className="border-x border-white/20">
              <div className="text-2xl font-bold text-white mb-1">{totalGaleries}</div>
              <div className="text-blue-100 text-sm font-medium">Galeries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-1">{galeriesPubliques}</div>
              <div className="text-blue-100 text-sm font-medium">Publiques</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
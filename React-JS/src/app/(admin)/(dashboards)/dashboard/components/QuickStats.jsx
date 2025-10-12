import { Link } from 'react-router';

const QuickStats = ({ oeuvres = [], galeries = [] }) => {
  const totalOeuvres = oeuvres.length;
  const totalGaleries = galeries.length;
  const galeriesPubliques = galeries.filter(g => !g.privee).length;

  return (
    <div className="grid lg:grid-cols-4 grid-cols-1 mb-5 gap-5">
      <div className="lg:col-span-2">
        <h5 className="mb-2 text-xl text-default-800 font-semibold">Bienvenue sur Pixelette 🎨</h5>
        <p className="text-default-600">
          Votre plateforme de gestion d&apos;œuvres d&apos;art et de galeries. 
          Actuellement, vous gérez <strong>{totalOeuvres} œuvre{totalOeuvres > 1 ? 's' : ''}</strong> répartie{totalOeuvres > 1 ? 's' : ''} dans <strong>{totalGaleries} galerie{totalGaleries > 1 ? 's' : ''}</strong>.
          <Link to="/oeuvres-grid" className="text-primary ml-2">
            Voir les œuvres
          </Link>
        </p>
      </div>

      <div className="lg:col-start-3 lg:col-span-2">
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-3">
              <div className="px-4 text-center border-e border-default-200 text-sm">
                <h6 className="mb-1 font-bold">
                  <span className="counter-value text-default-800">
                    {totalOeuvres}
                  </span>
                </h6>
                <p className="text-default-500">Œuvres</p>
              </div>

              <div className="px-4 text-center border-e border-default-200 text-sm">
                <h6 className="mb-1 font-bold">
                  <span className="counter-value text-default-800">
                    {totalGaleries}
                  </span>
                </h6>
                <p className="text-default-500">Galeries</p>
              </div>

              <div className="px-4 text-center text-sm">
                <h6 className="mb-1 font-bold">
                  <span className="counter-value text-default-800">
                    {galeriesPubliques}
                  </span>
                </h6>
                <p className="text-default-500">Publiques</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;


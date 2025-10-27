import { LuX, LuCalendar, LuUser, LuTag, LuLock, LuGlobe, LuImages } from 'react-icons/lu';

const GalerieDetailsModal = ({ show, onClose, galerie }) => {
  if (!show || !galerie) return null;

  return (
    <div className="hs-overlay size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none flex items-center justify-center bg-black/50">
      <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-100 ease-out transition-all sm:max-w-2xl sm:w-full m-3 sm:mx-auto pointer-events-auto">
        <div className="flex flex-col bg-white border shadow-sm rounded-xl">
          {/* Header */}
          <div className="flex justify-between items-center py-3 px-4 border-b">
            <h3 className="font-bold text-default-800">
              Détails de la Galerie
            </h3>
            <button 
              type="button" 
              className="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-default-100 text-default-800 hover:bg-default-200"
              onClick={onClose}
            >
              <LuX className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <div className="space-y-6">
              {/* Nom de la galerie */}
              <div>
                <h2 className="text-2xl font-bold text-default-800 mb-2">
                  {galerie.nom}
                </h2>
                {galerie.description && (
                  <p className="text-default-600 leading-relaxed">
                    {galerie.description}
                  </p>
                )}
              </div>

              {/* Informations */}
              <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
                {/* Thème */}
                {galerie.theme && (
                  <div className="flex items-center gap-3">
                    <div className="size-10 flex items-center justify-center rounded-full bg-info/10">
                      <LuTag className="size-5 text-info" />
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Thème</p>
                      <p className="font-semibold text-default-800">{galerie.theme}</p>
                    </div>
                  </div>
                )}

                {/* Nombre d'œuvres */}
                <div className="flex items-center gap-3">
                  <div className="size-10 flex items-center justify-center rounded-full bg-primary/10">
                    <LuImages className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-default-500">Nombre d'œuvres</p>
                    <p className="font-semibold text-default-800">
                      {galerie.oeuvres_count || 0} œuvre{galerie.oeuvres_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Visibilité */}
                <div className="flex items-center gap-3">
                  <div className={`size-10 flex items-center justify-center rounded-full ${galerie.privee ? 'bg-warning/10' : 'bg-success/10'}`}>
                    {galerie.privee ? (
                      <LuLock className="size-5 text-warning" />
                    ) : (
                      <LuGlobe className="size-5 text-success" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-default-500">Visibilité</p>
                    <p className="font-semibold text-default-800">
                      {galerie.privee ? 'Privée' : 'Publique'}
                    </p>
                  </div>
                </div>

                {/* Date de création */}
                <div className="flex items-center gap-3">
                  <div className="size-10 flex items-center justify-center rounded-full bg-success/10">
                    <LuCalendar className="size-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-default-500">Date de Création</p>
                    <p className="font-semibold text-default-800">
                      {new Date(galerie.date_creation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Liste des œuvres */}
              {galerie.oeuvres_list && galerie.oeuvres_list.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-default-700 mb-3">
                    Œuvres de la galerie ({galerie.oeuvres_list.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {galerie.oeuvres_list.slice(0, 6).map(oeuvre => (
                      <div 
                        key={oeuvre.id}
                        className="relative rounded-lg overflow-hidden group"
                      >
                        {oeuvre.image ? (
                          <img 
                            src={oeuvre.image} 
                            alt={oeuvre.titre}
                            className="w-full h-24 object-cover"
                          />
                        ) : (
                          <div className="w-full h-24 bg-default-100 flex items-center justify-center">
                            <LuImages className="size-8 text-default-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-xs font-medium px-2 text-center">
                            {oeuvre.titre}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {galerie.oeuvres_list.length > 6 && (
                    <p className="text-xs text-default-500 mt-2 text-center">
                      ... et {galerie.oeuvres_list.length - 6} autres œuvres
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center gap-x-2 py-3 px-4 border-t">
            <button 
              type="button" 
              className="btn bg-default-200 text-default-800 hover:bg-default-300"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalerieDetailsModal;


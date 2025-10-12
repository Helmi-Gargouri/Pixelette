import { LuX, LuCalendar, LuUser, LuRuler, LuPaintbrush, LuImage } from 'react-icons/lu';

const OeuvreDetailsModal = ({ show, onClose, oeuvre }) => {
  if (!show || !oeuvre) return null;

  return (
    <div className="hs-overlay size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none flex items-center justify-center bg-black/50">
      <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-100 ease-out transition-all sm:max-w-3xl sm:w-full m-3 sm:mx-auto pointer-events-auto">
        <div className="flex flex-col bg-white border shadow-sm rounded-xl">
          {/* Header */}
          <div className="flex justify-between items-center py-3 px-4 border-b">
            <h3 className="font-bold text-default-800">
              Détails de l'Œuvre
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
          <div className="p-4 overflow-y-auto max-h-[80vh]">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image */}
              <div>
                {oeuvre.image ? (
                  <img 
                    src={oeuvre.image} 
                    alt={oeuvre.titre} 
                    className="w-full rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-default-100 rounded-lg flex items-center justify-center">
                    <LuImage className="size-16 text-default-300" />
                  </div>
                )}
              </div>

              {/* Informations */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-default-800 mb-2">
                    {oeuvre.titre}
                  </h2>
                  {oeuvre.description && (
                    <p className="text-default-600 text-sm leading-relaxed">
                      {oeuvre.description}
                    </p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-3">
                  {oeuvre.artiste_nom && (
                    <div className="flex items-center gap-3">
                      <div className="size-10 flex items-center justify-center rounded-full bg-primary/10">
                        <LuUser className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Artiste</p>
                        <p className="font-semibold text-default-800">{oeuvre.artiste_nom}</p>
                      </div>
                    </div>
                  )}

                  {oeuvre.technique && (
                    <div className="flex items-center gap-3">
                      <div className="size-10 flex items-center justify-center rounded-full bg-info/10">
                        <LuPaintbrush className="size-5 text-info" />
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Technique</p>
                        <p className="font-semibold text-default-800">{oeuvre.technique}</p>
                      </div>
                    </div>
                  )}

                  {oeuvre.dimensions && (
                    <div className="flex items-center gap-3">
                      <div className="size-10 flex items-center justify-center rounded-full bg-warning/10">
                        <LuRuler className="size-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Dimensions</p>
                        <p className="font-semibold text-default-800">{oeuvre.dimensions}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="size-10 flex items-center justify-center rounded-full bg-success/10">
                      <LuCalendar className="size-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Date de Création</p>
                      <p className="font-semibold text-default-800">
                        {new Date(oeuvre.date_creation).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Galeries associées */}
                {oeuvre.galeries_associees && oeuvre.galeries_associees.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-default-700 mb-2">
                      Galeries ({oeuvre.galeries_associees.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {oeuvre.galeries_associees.map(galerieId => (
                        <span 
                          key={galerieId}
                          className="py-1 px-3 inline-flex items-center gap-x-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                        >
                          Galerie #{galerieId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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

export default OeuvreDetailsModal;


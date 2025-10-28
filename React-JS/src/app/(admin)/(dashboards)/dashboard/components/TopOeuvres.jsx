const TopOeuvres = ({ oeuvres = [] }) => {
  // Trier les œuvres par date de création (les plus récentes)
  const topOeuvres = [...oeuvres]
    .sort((a, b) => new Date(b.date_ajout || b.id) - new Date(a.date_ajout || a.id))
    .slice(0, 10)
    .map((oeuvre, index) => {
      // Safe artist name resolution (backend may provide auteur_nom or nested auteur)
      let artisteName = 'Inconnu'
      if (oeuvre.auteur_nom) {
        artisteName = oeuvre.auteur_nom
      } else if (oeuvre.auteur && typeof oeuvre.auteur === 'object') {
        const prenom = oeuvre.auteur.prenom || ''
        const nom = oeuvre.auteur.nom || ''
        const full = `${prenom} ${nom}`.trim()
        if (full) artisteName = full
      } else if (typeof oeuvre.auteur === 'string' && oeuvre.auteur.trim()) {
        artisteName = oeuvre.auteur
      } else if (oeuvre.artiste) {
        artisteName = oeuvre.artiste
      }

      return {
        id: oeuvre.id,
        titre: oeuvre.titre || 'Sans titre',
        artiste: artisteName,
        annee: oeuvre.annee_creation || '-',
        technique: oeuvre.technique || '-',
        rank: index + 1
      }
    });

  if (topOeuvres.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <h5 className="text-xl font-semibold text-default-800 mb-4">Dernières Œuvres</h5>
          <div className="text-center py-8">
            <p className="text-default-500">Aucune œuvre disponible</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="text-xl font-semibold text-default-800 mb-4">Dernières Œuvres Ajoutées</h5>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-default-200">
                <th className="text-left py-3 px-2 text-sm font-semibold text-default-600">#</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-default-600">Titre</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-default-600">Artiste</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-default-600">Année</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-default-600">Technique</th>
              </tr>
            </thead>
            <tbody>
              {topOeuvres.map((oeuvre) => (
                <tr key={oeuvre.id} className="border-b border-default-200 hover:bg-default-50 transition-colors">
                  <td className="py-3 px-2 text-sm text-default-600">{oeuvre.rank}</td>
                  <td className="py-3 px-2 text-sm font-medium text-default-800">{oeuvre.titre}</td>
                  <td className="py-3 px-2 text-sm text-default-600">{oeuvre.artiste}</td>
                  <td className="py-3 px-2 text-sm text-center text-default-600">{oeuvre.annee}</td>
                  <td className="py-3 px-2 text-sm text-default-600">{oeuvre.technique}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopOeuvres;


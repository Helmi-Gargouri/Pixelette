import { LuImage, LuPalette } from 'react-icons/lu';

const ActivityItem = ({ icon: Icon, title, description, time, bgClass, iconClass }) => {
  return (
    <div className="flex items-start gap-3 pb-4 mb-4 border-b border-default-200 last:border-0 last:pb-0 last:mb-0">
      <div className={`p-2 rounded-lg ${bgClass}`}>
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>
      <div className="flex-1">
        <h6 className="text-sm font-semibold text-default-800 mb-1">{title}</h6>
        <p className="text-xs text-default-600">{description}</p>
      </div>
      <span className="text-xs text-default-500">{time}</span>
    </div>
  );
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  return new Date(date).toLocaleDateString('fr-FR');
};

const RecentActivity = ({ oeuvres = [], galeries = [] }) => {
  // Combiner les œuvres et galeries récentes
  const recentItems = [];
  
  // Ajouter les 3 dernières œuvres
  const recentOeuvres = [...oeuvres]
    .sort((a, b) => new Date(b.date_ajout || b.id) - new Date(a.date_ajout || a.id))
    .slice(0, 3);
  
  recentOeuvres.forEach(oeuvre => {
    // Determine a safe display name for the author. API may return:
    // - oeuvre.auteur_nom (string)
    // - oeuvre.auteur as an object { prenom, nom }
    // - oeuvre.auteur as a numeric id
    // - oeuvre.artiste as legacy string
    let auteurName = 'Inconnu'
    if (oeuvre.auteur_nom) {
      auteurName = oeuvre.auteur_nom
    } else if (oeuvre.auteur && typeof oeuvre.auteur === 'object') {
      const prenom = oeuvre.auteur.prenom || ''
      const nom = oeuvre.auteur.nom || ''
      const full = `${prenom} ${nom}`.trim()
      if (full) auteurName = full
    } else if (typeof oeuvre.auteur === 'string' && oeuvre.auteur.trim()) {
      auteurName = oeuvre.auteur
    } else if (oeuvre.artiste) {
      auteurName = oeuvre.artiste
    }
    recentItems.push({
      type: 'oeuvre',
      icon: LuImage,
      title: 'Nouvelle œuvre ajoutée',
      description: `"${oeuvre.titre || 'Sans titre'}" par ${auteurName}`,
      time: formatTimeAgo(oeuvre.date_ajout || new Date()),
      date: new Date(oeuvre.date_ajout || new Date()),
      bgClass: 'bg-blue-100',
      iconClass: 'text-blue-600'
    });
  });

  // Ajouter les 2 dernières galeries
  const recentGaleries = [...galeries]
    .sort((a, b) => new Date(b.date_creation || b.id) - new Date(a.date_creation || a.id))
    .slice(0, 2);
  
  recentGaleries.forEach(galerie => {
    recentItems.push({
      type: 'galerie',
      icon: LuPalette,
      title: 'Galerie créée',
      description: `Galerie "${galerie.nom}" - ${galerie.privee ? 'Privée' : 'Publique'}`,
      time: formatTimeAgo(galerie.date_creation || new Date()),
      date: new Date(galerie.date_creation || new Date()),
      bgClass: 'bg-green-100',
      iconClass: 'text-green-600'
    });
  });

  // Trier par date décroissante et prendre les 5 plus récents
  const activities = recentItems
    .sort((a, b) => b.date - a.date)
    .slice(0, 5);

  if (activities.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <h5 className="text-xl font-semibold text-default-800 mb-4">Activités Récentes</h5>
          <div className="text-center py-8">
            <p className="text-default-500">Aucune activité récente</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="text-xl font-semibold text-default-800 mb-4">Activités Récentes</h5>
        <div className="space-y-0">
          {activities.map((activity, index) => (
            <ActivityItem key={index} {...activity} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;


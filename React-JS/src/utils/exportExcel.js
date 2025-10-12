/**
 * Exporte des données en fichier Excel avec métadonnées en en-tête
 * Utilise une approche simple sans librairie externe
 */

export const exportToExcel = (data, filename = 'export.xlsx', metadata = null) => {
  // Convertit les données en format CSV
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Extrait les en-têtes (clés du premier objet)
  const headers = Object.keys(data[0]);
  
  // Crée les lignes CSV
  let csvContent = '\uFEFF'; // BOM pour UTF-8
  
  // Ajoute les métadonnées en en-tête si fournies
  if (metadata) {
    if (metadata.exportedBy) {
      csvContent += `Exporté par;${metadata.exportedBy}\n`;
    }
    if (metadata.exportDate) {
      csvContent += `Date d'export;${metadata.exportDate}\n`;
    }
    // Ligne vide pour séparer les métadonnées des données
    csvContent += '\n';
  }
  
  // Ajoute les en-têtes des colonnes
  csvContent += headers.join(';') + '\n';
  
  // Ajoute les données
  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header];
      
      // Gère les valeurs null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Gère les objets/arrays
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      
      // Échappe les guillemets et entoure de guillemets si contient ;
      value = String(value).replace(/"/g, '""');
      if (value.includes(';') || value.includes('\n') || value.includes('"')) {
        value = `"${value}"`;
      }
      
      return value;
    });
    
    csvContent += values.join(';') + '\n';
  });

  // Crée un blob et télécharge
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename.replace('.xlsx', '.csv'));
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Formate les données de galeries pour l'export
 * Retourne un objet avec les données et les métadonnées séparées
 */
export const formatGaleriesForExport = (galeries, exportedBy = 'Administrateur') => {
  const exportDate = new Date().toLocaleString('fr-FR');
  
  // Formate les données des galeries sans les métadonnées d'export
  const formattedData = galeries.map(galerie => {
    // Récupère les noms des œuvres si disponibles
    let oeuvresNames = 'Aucune œuvre';
    let oeuvresList = galerie.oeuvres_list || galerie.oeuvres;
    
    if (oeuvresList && Array.isArray(oeuvresList) && oeuvresList.length > 0) {
      oeuvresNames = oeuvresList.map(oeuvre => {
        if (typeof oeuvre === 'object' && oeuvre.titre) {
          return oeuvre.titre;
        }
        return '';
      }).filter(name => name).join(', ');
      
      // Si pas de titres trouvés
      if (!oeuvresNames) {
        oeuvresNames = `${oeuvresList.length} œuvre(s) sans titre`;
      }
    }
    
    return {
      'ID': galerie.id,
      'Nom de la galerie': galerie.nom,
      'Description': (galerie.description || '').substring(0, 100) + (galerie.description?.length > 100 ? '...' : ''),
      'Thème': galerie.theme || 'Non défini',
      'Visibilité': galerie.privee ? 'Privée' : 'Publique',
      'Nombre d\'œuvres': galerie.oeuvres_count || (oeuvresList?.length || 0),
      'Noms des œuvres': oeuvresNames,
      'Propriétaire': galerie.proprietaire_nom || `ID: ${galerie.proprietaire}`,
      'Date de création': new Date(galerie.date_creation).toLocaleString('fr-FR')
    };
  });
  
  return {
    data: formattedData,
    metadata: {
      exportedBy,
      exportDate
    }
  };
};

/**
 * Formate les données d'œuvres pour l'export
 */
export const formatOeuvresForExport = (oeuvres) => {
  return oeuvres.map(oeuvre => ({
    'ID': oeuvre.id,
    'Titre': oeuvre.titre,
    'Description': oeuvre.description || '',
    'Artiste': oeuvre.artiste_nom || '',
    'Date de création': new Date(oeuvre.date_creation).toLocaleDateString('fr-FR'),
    'Image': oeuvre.image ? 'Oui' : 'Non'
  }));
};


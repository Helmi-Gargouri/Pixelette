import { useState, useEffect } from 'react';
import { LuX, LuImage, LuCheck } from 'react-icons/lu';
import axios from 'axios';

const GalerieEditModal = ({ show, onClose, galerie, onSuccess }) => {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    theme: '',
    privee: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allOeuvres, setAllOeuvres] = useState([]);
  const [selectedOeuvres, setSelectedOeuvres] = useState([]);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  useEffect(() => {
    if (galerie) {
      setFormData({
        nom: galerie.nom || '',
        description: galerie.description || '',
        theme: galerie.theme || '',
        privee: galerie.privee || false
      });
      
      // Charge les œuvres déjà associées
      if (galerie.oeuvres) {
        setSelectedOeuvres(galerie.oeuvres);
      }
    }
  }, [galerie]);

  useEffect(() => {
    if (show) {
      fetchAllOeuvres();
    }
  }, [show]);


  const fetchAllOeuvres = async () => {
    try {
      const response = await axios.get(`${API_BASE}/oeuvres/`, {
        withCredentials: true
      });
      setAllOeuvres(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des œuvres:', error);
    }
  };

  const toggleOeuvre = (oeuvreId) => {
    setSelectedOeuvres(prev => {
      if (prev.includes(oeuvreId)) {
        return prev.filter(id => id !== oeuvreId);
      } else {
        return [...prev, oeuvreId];
      }
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Inclut le proprietaire et les œuvres
      const submitData = {
        ...formData,
        proprietaire: galerie.proprietaire,
        oeuvres: selectedOeuvres  // Ajoute les œuvres sélectionnées
      };

      await axios.put(`${API_BASE}/galeries/${galerie.id}/`, submitData, {
        withCredentials: true
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
      console.error('Détails erreur:', err.response?.data);
      setError(err.response?.data?.error || JSON.stringify(err.response?.data) || 'Erreur lors de la modification de la galerie');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !galerie) return null;

  return (
    <div className="hs-overlay size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none flex items-center justify-center bg-black/50">
      <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-100 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto pointer-events-auto">
        <div className="flex flex-col bg-white border shadow-sm rounded-xl">
          {/* Header */}
          <div className="flex justify-between items-center py-3 px-4 border-b">
            <h3 className="font-bold text-default-800">
              Modifier la Galerie
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
          <form onSubmit={handleSubmit}>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {error && (
                <div className="bg-danger/10 text-danger px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="grid gap-4">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-default-800 mb-2">
                    Nom de la Galerie <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="nom"
                    className="form-input" 
                    placeholder="Ex: Mes Paysages"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-default-800 mb-2">
                    Description
                  </label>
                  <textarea 
                    name="description"
                    className="form-input" 
                    rows={4}
                    placeholder="Description de la galerie"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                {/* Thème */}
                <div>
                  <label className="block text-sm font-medium text-default-800 mb-2">
                    Thème
                  </label>
                  <input 
                    type="text" 
                    name="theme"
                    className="form-input" 
                    placeholder="Ex: Paysages, Portraits, Abstrait..."
                    value={formData.theme}
                    onChange={handleChange}
                  />
                </div>

                {/* Visibilité */}
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    name="privee"
                    id="privee-edit"
                    className="form-checkbox text-primary"
                    checked={formData.privee}
                    onChange={handleChange}
                  />
                  <label htmlFor="privee-edit" className="ms-2 text-sm text-default-800">
                    Galerie Privée
                  </label>
                </div>

                {/* Gestion des œuvres */}
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-default-800 mb-3">
                    Œuvres de la galerie ({selectedOeuvres.length})
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-default-200 rounded-lg p-3">
                    {allOeuvres.length === 0 ? (
                      <p className="text-sm text-default-500 text-center py-4">
                        Aucune œuvre disponible
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {allOeuvres.map(oeuvre => {
                          const isSelected = selectedOeuvres.includes(oeuvre.id);
                          return (
                            <div 
                              key={oeuvre.id}
                              onClick={() => toggleOeuvre(oeuvre.id)}
                              className={`relative rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                                isSelected ? 'border-primary' : 'border-transparent'
                              }`}
                            >
                              {oeuvre.image ? (
                                <img 
                                  src={oeuvre.image} 
                                  alt={oeuvre.titre}
                                  className="w-full h-20 object-cover"
                                />
                              ) : (
                                <div className="w-full h-20 bg-default-100 flex items-center justify-center">
                                  <LuImage className="size-6 text-default-300" />
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-1">
                                  <LuCheck className="size-3" />
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1.5">
                                <p className="text-xs truncate">{oeuvre.titre}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-default-500 mt-2">
                    Cliquez sur les œuvres pour les ajouter/retirer de la galerie
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-x-2 py-3 px-4 border-t">
              <button 
                type="button" 
                className="btn bg-default-200 text-default-800 hover:bg-default-300"
                onClick={onClose}
                disabled={loading}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="btn bg-primary text-white hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? 'Modification...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GalerieEditModal;


import { useState, useEffect } from 'react';
import { LuX, LuImage, LuCheck } from 'react-icons/lu';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

const GalerieAddModal = ({ show, onClose, onSuccess }) => {
  const { user } = useAuth();
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

    if (!user) {
      setError('Vous devez être connecté pour créer une galerie');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        proprietaire: user.id,  // Ajoute le propriétaire automatiquement
        oeuvres: selectedOeuvres  // Ajoute les œuvres sélectionnées
      };

      await axios.post(`${API_BASE}/galeries/`, submitData, {
        withCredentials: true
      });

      // Reset form
      setFormData({
        nom: '',
        description: '',
        theme: '',
        privee: false
      });
      setSelectedOeuvres([]);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      setError(err.response?.data?.error || err.response?.data?.proprietaire?.[0] || 'Erreur lors de la création de la galerie');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="hs-overlay size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none flex items-center justify-center bg-black/50">
      <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-100 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto pointer-events-auto">
        <div className="flex flex-col bg-white border shadow-sm rounded-xl">
          {/* Header */}
          <div className="flex justify-between items-center py-3 px-4 border-b">
            <h3 className="font-bold text-default-800">
              Créer une Galerie
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
                    id="privee"
                    className="form-checkbox text-primary"
                    checked={formData.privee}
                    onChange={handleChange}
                  />
                  <label htmlFor="privee" className="ms-2 text-sm text-default-800">
                    Galerie Privée
                  </label>
                </div>

                {/* Sélection des œuvres */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-default-800 mb-2">
                    Œuvres à inclure <span className="text-default-500 font-normal">({selectedOeuvres.length})</span>
                  </label>
                  
                  {allOeuvres.length === 0 ? (
                    <div className="text-center py-6 bg-default-50 rounded-lg">
                      <LuImage className="size-10 text-default-300 mx-auto mb-2" />
                      <p className="text-default-500 text-sm">Aucune œuvre disponible</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-default-200 rounded-lg p-3 bg-default-50">
                      {allOeuvres.map(oeuvre => (
                        <div 
                          key={oeuvre.id} 
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            selectedOeuvres.includes(oeuvre.id) 
                              ? 'border-primary shadow-lg' 
                              : 'border-default-200 hover:border-default-400'
                          }`}
                          onClick={() => toggleOeuvre(oeuvre.id)}
                        >
                          {oeuvre.image ? (
                            <img 
                              src={oeuvre.image} 
                              alt={oeuvre.titre}
                              className="w-full h-28 object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-28 bg-default-100 flex items-center justify-center">
                              <LuImage className="size-8 text-default-400" />
                            </div>
                          )}
                          
                          {selectedOeuvres.includes(oeuvre.id) && (
                            <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1.5 shadow-md">
                              <LuCheck className="size-4" />
                            </div>
                          )}
                          
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2 py-2">
                            <p className="text-white text-xs font-medium truncate">{oeuvre.titre}</p>
                          </div>
                        </div>
                      ))}
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
                disabled={loading}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="btn bg-primary text-white hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer la galerie'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GalerieAddModal;

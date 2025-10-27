import { useState } from 'react';
import { LuX, LuImage, LuUpload } from 'react-icons/lu';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

const OeuvreAddModal = ({ show, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date_creation: new Date().toISOString().split('T')[0],
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setError('Vous devez être connecté pour créer une œuvre');
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('titre', formData.titre);
      submitData.append('description', formData.description);
      submitData.append('auteur', user.id);  // Ajoute l'auteur automatiquement
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      await axios.post(`${API_BASE}/oeuvres/`, submitData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form
      setFormData({
        titre: '',
        description: '',
        date_creation: new Date().toISOString().split('T')[0],
        image: null
      });
      setImagePreview(null);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      setError(err.response?.data?.error || err.response?.data?.auteur?.[0] || 'Erreur lors de la création de l\'œuvre');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="hs-overlay size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none flex items-center justify-center bg-black/50">
      <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-100 ease-out transition-all sm:max-w-2xl sm:w-full m-3 sm:mx-auto pointer-events-auto">
        <div className="flex flex-col bg-white border shadow-sm rounded-xl">
          {/* Header */}
          <div className="flex justify-between items-center py-3 px-4 border-b">
            <h3 className="font-bold text-default-800">
              Ajouter une Œuvre
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
                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-default-800 mb-2">
                    Titre <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="titre"
                    className="form-input" 
                    placeholder="Titre de l'œuvre"
                    value={formData.titre}
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
                    placeholder="Description de l'œuvre"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-default-800 mb-2">
                    Image
                  </label>
                  <div className="border-2 border-dashed border-default-200 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Aperçu" 
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 btn btn-sm bg-danger text-white"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, image: null }));
                            setImagePreview(null);
                          }}
                        >
                          <LuX className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <LuUpload className="size-12 text-default-300 mx-auto mb-2" />
                        <p className="text-sm text-default-600 mb-1">Cliquez pour uploader une image</p>
                        <p className="text-xs text-default-400">PNG, JPG, JPEG (max 10MB)</p>
                        <input 
                          type="file" 
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
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
                {loading ? 'Création...' : 'Créer l\'œuvre'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OeuvreAddModal;


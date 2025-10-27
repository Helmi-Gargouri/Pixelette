import { useState, useEffect } from 'react';
import { LuX, LuUpload } from 'react-icons/lu';
import axios from 'axios';

const OeuvreEditModal = ({ show, onClose, oeuvre, onSuccess }) => {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (oeuvre) {
      setFormData({
        titre: oeuvre.titre || '',
        description: oeuvre.description || '',
        image: null
      });
      setImagePreview(oeuvre.image || null);
    }
  }, [oeuvre]);

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

    try {
      const submitData = new FormData();
      submitData.append('titre', formData.titre);
      submitData.append('description', formData.description);
      submitData.append('auteur', oeuvre.auteur);  // Garde l'auteur original
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      await axios.put(`http://localhost:8000/api/oeuvres/${oeuvre.id}/`, submitData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
      console.error('Détails erreur:', err.response?.data);
      setError(err.response?.data?.error || JSON.stringify(err.response?.data) || 'Erreur lors de la modification de l\'œuvre');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !oeuvre) return null;

  return (
    <div className="hs-overlay size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none flex items-center justify-center bg-black/50">
      <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-100 ease-out transition-all sm:max-w-2xl sm:w-full m-3 sm:mx-auto pointer-events-auto">
        <div className="flex flex-col bg-white border shadow-sm rounded-xl">
          {/* Header */}
          <div className="flex justify-between items-center py-3 px-4 border-b">
            <h3 className="font-bold text-default-800">
              Modifier l'Œuvre
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
                  <div className="border-2 border-dashed border-default-200 rounded-lg p-4">
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
                            setImagePreview(oeuvre.image || null);
                          }}
                        >
                          <LuX className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer text-center block">
                        <LuUpload className="size-12 text-default-300 mx-auto mb-2" />
                        <p className="text-sm text-default-600">Changer l'image</p>
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
            <div className="flex justify-end items-center gap-x-2 pt-4 border-t mt-4">
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

export default OeuvreEditModal;


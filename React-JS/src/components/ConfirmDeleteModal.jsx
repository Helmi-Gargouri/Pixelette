import { LuTriangleAlert } from 'react-icons/lu';

const ConfirmDeleteModal = ({ show, onClose, onConfirm, title, message, itemName }) => {
  if (!show) return null;

  return (
    <div id="confirmDeleteModal" className="hs-overlay size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none flex items-center justify-center bg-black/50">
      <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-100 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto pointer-events-auto">
        <div className="flex flex-col bg-white border shadow-sm rounded-xl">
          <div className="flex justify-between items-center py-3 px-4 border-b">
            <h3 className="font-bold text-default-800 flex items-center gap-2">
              <LuTriangleAlert className="size-5 text-danger" />
              {title || 'Confirmer la suppression'}
            </h3>
            <button 
              type="button" 
              className="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-default-100 text-default-800 hover:bg-default-200"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 overflow-y-auto">
            <p className="text-default-800">
              {message || `Êtes-vous sûr de vouloir supprimer ${itemName ? `"${itemName}"` : 'cet élément'} ?`}
            </p>
            <p className="text-sm text-danger mt-2">
              ⚠️ Cette action est irréversible.
            </p>
          </div>
          <div className="flex justify-end items-center gap-x-2 py-3 px-4 border-t">
            <button 
              type="button" 
              className="btn bg-default-200 text-default-800 hover:bg-default-300"
              onClick={onClose}
            >
              Annuler
            </button>
            <button 
              type="button" 
              className="btn bg-danger text-white hover:bg-danger/90"
              onClick={onConfirm}
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;


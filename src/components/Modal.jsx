function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-xl p-6 relative shadow-lg overflow-y-auto">

        <button
          onClick={onClose}
          className="sticky top-0 float-right -mt-2 -mr-2 text-gray-500 bg-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-100"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}

export default Modal;

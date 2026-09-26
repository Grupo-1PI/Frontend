import { X } from "lucide-react";

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  onConfirm,
  onCancel,
  confirmText = "Salvar alterações",
  cancelText = "Cancelar",
  confirmVariant = "primary", // primary | danger
  loading = false,
  showFooter = true,
}) {
  if (!isOpen) return null;

  const confirmBtnClass =
    confirmVariant === "danger"
      ? "bg-status-cancelado hover:bg-status-cancelado/90 text-white"
      : "bg-[#333E33] hover:bg-[#252E25] text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>

        {title && (
          <div className="mb-6 pr-8">
            <h2 className="font-heading text-2xl font-bold text-[#333E33]">{title}</h2>
            {subtitle && <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mt-1">{subtitle}</p>}
          </div>
        )}

        <div className="mb-6">{children}</div>

        {showFooter && (
          <div className="flex flex-col gap-3 pt-2">
            {onConfirm && (
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className={`w-full rounded-xl py-3.5 text-sm font-semibold transition shadow-sm disabled:opacity-50 ${confirmBtnClass}`}
              >
                {loading ? "Salvando..." : confirmText}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel || onClose}
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-[#333E33] transition hover:bg-gray-50"
            >
              {cancelText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BaseModal;

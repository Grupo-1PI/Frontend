import { Plus } from "lucide-react";

export function ManagementHeader({ title, subtitle = "PAINEL DE GESTÃO", buttonText, onButtonClick, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-[#333E33] tracking-tight">{title}</h1>
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mt-1">{subtitle}</p>
      </div>
      {(children || (buttonText && onButtonClick)) && (
        <div className="flex flex-wrap items-center gap-3">
          {children}
          {buttonText && onButtonClick && (
            <button
              type="button"
              onClick={onButtonClick}
              className="flex items-center gap-2 rounded-xl bg-[#333E33] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#252E25] transition"
            >
              <Plus size={18} /> {buttonText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ManagementHeader;

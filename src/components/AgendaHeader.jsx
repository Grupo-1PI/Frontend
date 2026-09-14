import { LogOut } from "lucide-react";

function AgendaHeader({ nome, subtitulo, onSair }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-border bg-brand-surface px-6 py-3.5">
      <div className="flex items-center gap-2">
        <img src="/logo.svg" alt="Tao Tenshin" className="h-7 w-auto" />
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-semibold text-brand-text">{nome}</div>
          <div className="text-xs text-brand-muted">{subtitulo}</div>
        </div>
        <button
          type="button"
          onClick={onSair}
          title="Sair"
          className="rounded-lg p-2 text-brand-muted transition hover:bg-brand-bg hover:text-status-cancelado"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default AgendaHeader;

import { LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function AgendaHeader({ nome, subtitulo, onSair, showNav = false }) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E0D8] bg-[#F5F0E6] px-6 py-3.5 shadow-xs">
      <div className="flex items-center gap-8">
        <Link to="/">
          <img src="/logo.svg" alt="Tao Tenshin" className="h-7 w-auto" />
        </Link>

        {showNav && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#333E33]">
            <Link
              to="/disponibilidade"
              className={`hover:opacity-80 transition ${
                location.pathname.startsWith("/disponibilidade") ? "font-bold underline underline-offset-4" : ""
              }`}
            >
              Disponibilidade
            </Link>
            <Link
              to="/dashboard"
              className={`hover:opacity-80 transition ${
                location.pathname.startsWith("/dashboard") ? "font-bold underline underline-offset-4" : ""
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/gerenciamento"
              className={`hover:opacity-80 transition ${
                location.pathname.startsWith("/gerenciamento") ? "font-bold underline underline-offset-4" : ""
              }`}
            >
              Gerenciamento
            </Link>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        {showNav && (
          <Link
            to="/agendamentos"
            className={`rounded-xl border border-[#333E33] px-5 py-2 text-sm font-semibold transition ${
              location.pathname === "/agendamentos"
                ? "bg-[#333E33] text-white"
                : "text-[#333E33] hover:bg-[#333E33]/5"
            }`}
          >
            Agendamentos
          </Link>
        )}

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-[#333E33]">{nome}</div>
            <div className="text-xs text-gray-500">{subtitulo}</div>
          </div>
          <button
            type="button"
            onClick={onSair}
            title="Sair"
            className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-status-cancelado"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default AgendaHeader;

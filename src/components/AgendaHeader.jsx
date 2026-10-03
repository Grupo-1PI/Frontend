import { LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import BaseModal from "./BaseModal";
import {
  podeVerAgendamentos,
  podeVerDisponibilidade,
  podeVerDashboard,
  podeGerenciarAlgumCadastro,
} from "../services/permissoes";

export function AgendaHeader({ nome, subtitulo, onSair, showNav = false }) {
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    if (onSair) onSair();
  };

  // Só entram no menu as telas que o usuário realmente pode acessar.
  const links = [
    { to: "/disponibilidade", label: "Disponibilidade", mostrar: podeVerDisponibilidade() },
    { to: "/dashboard", label: "Dashboard", mostrar: podeVerDashboard() },
    { to: "/gerenciamento", label: "Gerenciamento", mostrar: podeGerenciarAlgumCadastro() },
  ].filter((link) => link.mostrar);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E0D8] bg-[#F5F0E6] px-6 py-3.5 shadow-xs">
        <div className="flex items-center gap-8">
          <Link to="/">
            <img src="/logo.svg" alt="Tao Tenshin" className="h-7 w-auto" />
          </Link>

          {showNav && links.length > 0 && (
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#333E33]">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`hover:opacity-80 transition ${
                    location.pathname.startsWith(link.to) ? "font-bold underline underline-offset-4" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {showNav && podeVerAgendamentos() && (
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
              onClick={() => setShowLogoutModal(true)}
              title="Sair"
              className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-status-cancelado"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <BaseModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sair do Sistema"
        subtitle="CONFIRMAÇÃO DE SAÍDA"
        confirmText="Sim"
        cancelText="Não"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
      >
        <div className="text-center py-4 font-heading text-xl font-bold text-[#333E33]">
          TEM CERTEZA DE QUE DESEJA SAIR DO SISTEMA?
        </div>
      </BaseModal>
    </>
  );
}

export default AgendaHeader;

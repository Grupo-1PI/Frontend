import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import { Briefcase, Users, Star, DoorOpen, ClipboardList } from "lucide-react";
import { getUsuarioLogado, logout } from "../services/auth";

export function GerenciamentoHub() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  const cards = [
    { title: "Cargos", path: "/gerenciamento/cargos", icon: Briefcase },
    { title: "Funcionários", path: "/gerenciamento/funcionarios", icon: Users },
    { title: "Especialidades", path: "/gerenciamento/especialidades", icon: Star },
    { title: "Salas", path: "/gerenciamento/salas", icon: DoorOpen },
    { title: "Serviços", path: "/gerenciamento/servicos", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Painel Administrativo" onSair={async () => { await logout(); navigate("/login"); }} />

      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <h1 className="font-heading text-4xl font-bold text-[#333E33]">Gerenciamento</h1>
        <p className="text-sm text-gray-500 mt-1 mb-8">Gerencie sua clínica de maneira eficiente</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.path}
                type="button"
                onClick={() => navigate(card.path)}
                className="group flex flex-col justify-between h-48 rounded-[24px] bg-[#333E33] p-6 text-left text-white shadow-lg transition hover:bg-[#252E25]"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Icon size={24} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xl font-semibold">{card.title}</span>
                  <span className="text-lg transition transform group-hover:translate-x-1">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GerenciamentoHub;

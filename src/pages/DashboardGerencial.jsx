import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import { getUsuarioLogado, logout } from "../services/auth";
import { Calendar, TrendingUp, Users, UserPlus } from "lucide-react";

export function DashboardGerencial() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  const kpis = [
    { title: "Agendamentos no período", value: "312", change: "18% vs mês anterior", icon: Calendar },
    { title: "Taxa de cancelamento", value: "8.3%", change: "26 cancelamentos", icon: TrendingUp },
    { title: "Pacientes ativos", value: "184", change: "12% vs mês anterior", icon: Users },
    { title: "Novos pacientes", value: "46", change: "15% vs mês anterior", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Dashboard" onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="font-heading text-4xl font-bold text-[#333E33]">Dashboard</h1>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#333E33] shadow-xs">
            01/05/2026 - 30/05/2026 📅
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#333E33] mb-4">
                  <Icon size={20} />
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{kpi.title}</div>
                <div className="text-3xl font-bold text-[#333E33] my-1">{kpi.value}</div>
                <div className="text-xs font-semibold text-emerald-600">{kpi.change}</div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-6">
          <button type="button" className="rounded-xl bg-white border border-gray-200 px-6 py-3 text-sm font-semibold text-[#333E33] shadow-sm hover:bg-gray-50 transition">
            ✨ Insights da IA
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardGerencial;

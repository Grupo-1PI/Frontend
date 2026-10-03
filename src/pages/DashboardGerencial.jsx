import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import AcessoNegado from "../components/AcessoNegado";
import { getUsuarioLogado, logout } from "../services/auth";
import { podeVerDashboard } from "../services/permissoes";
import { consultarDashboard } from "../services/agendamentos";
import { Calendar, TrendingUp, Users, UserPlus } from "lucide-react";

export function DashboardGerencial() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  const temAcesso = podeVerDashboard();

  useEffect(() => {
    if (!temAcesso) return;
    const carregar = async () => {
      try {
        setLoading(true);
        const inicio = "2026-05-01";
        const fim = "2026-05-30";
        const res = await consultarDashboard(inicio, fim);
        setDados(res);
      } catch (err) {
        console.error("Erro ao carregar dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [temAcesso]);

  if (!temAcesso) {
    return <AcessoNegado />;
  }

  const totalAg = dados?.totalAgendamentos ?? 312;
  const cancelamentos = dados?.cancelamentos ?? 26;
  const clientesAtivos = dados?.clientesAtivos ?? 184;
  const clientesNovos = dados?.clientesNovos ?? 46;

  const kpis = [
    { title: "Agendamentos no período", value: totalAg, change: "18% vs mês anterior", icon: Calendar },
    { title: "Total de cancelamentos", value: cancelamentos, change: "Monitorado", icon: TrendingUp },
    { title: "Pacientes ativos", value: clientesAtivos, change: "12% vs mês anterior", icon: Users },
    { title: "Novos pacientes", value: clientesNovos, change: "15% vs mês anterior", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Dashboard" showNav={true} onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="font-heading text-4xl font-bold text-[#333E33]">Dashboard</h1>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#333E33] shadow-xs">
            01/05/2026 - 30/05/2026 📅
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-500">Carregando indicadores do dashboard...</div>
        ) : (
          <>
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

            {/* Seção de Serviços e Dias da Semana */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
                <h3 className="font-heading text-lg font-bold text-[#333E33] mb-4">Serviços Mais Realizados</h3>
                <div className="space-y-3">
                  {dados?.servicos?.length ? (
                    dados.servicos.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-sm">
                        <span className="font-medium text-[#333E33]">{s.nome || s.servico || "Serviço"}</span>
                        <span className="font-bold text-[#333E33]">{s.quantidade || s.total || 0} atendimentos</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 py-4 text-center">Nenhum dado de serviço no período.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
                <h3 className="font-heading text-lg font-bold text-[#333E33] mb-4">Agendamentos por Dia da Semana</h3>
                <div className="space-y-3">
                  {dados?.agendamentosDiaSemana?.length ? (
                    dados.agendamentosDiaSemana.map((d, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-sm">
                        <span className="font-medium text-[#333E33]">{d.diaSemana || d.dia || "Dia"}</span>
                        <span className="font-bold text-[#333E33]">{d.total || d.quantidade || 0} agendamentos</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 py-4 text-center">Nenhum dado por dia da semana no período.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

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

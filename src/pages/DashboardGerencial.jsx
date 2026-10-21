import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CalendarX, Users, UserPlus, Sparkles } from "lucide-react";
import AgendaHeader from "../components/AgendaHeader";
import AcessoNegado from "../components/AcessoNegado";
import { GraficoSemana, GraficoServicos, GraficoRetorno } from "../components/DashboardGraficos";
import { getUsuarioLogado, logout } from "../services/auth";
import { podeVerDashboard } from "../services/permissoes";
import { carregarDashboard } from "../services/dashboard";
import "./dashboard.css";

const isoLocal = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const formatar = n => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
function comparar(atual, anterior) {
  if (anterior == null) return "Comparação indisponível";
  if (!anterior) return atual ? "Sem base de comparação" : "Sem variação";
  const variacao = (atual - anterior) / anterior * 100;
  return `${variacao > 0 ? "+" : ""}${formatar(variacao)}% vs período anterior`;
}

export function DashboardGerencial() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  const temAcesso = podeVerDashboard();
  const [periodo, setPeriodo] = useState(() => {
    const hoje = new Date();
    return { inicio: isoLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), fim: isoLocal(hoje) };
  });
  const [rascunho, setRascunho] = useState(periodo);
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [tentativa, setTentativa] = useState(0);
  const dias = (new Date(rascunho.fim) - new Date(rascunho.inicio)) / 86400000;
  const valido = rascunho.inicio && rascunho.fim && dias >= 0 && dias <= 366;
  useEffect(() => {
    if (!temAcesso) return;
    const controller = new AbortController();
    async function buscar() {
      setLoading(true);
      setErro("");
      try { setDados(await carregarDashboard(periodo, controller.signal)); }
      catch { if (!controller.signal.aborted) setErro("Não foi possível carregar os indicadores. Tente novamente."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    buscar();
    return () => controller.abort();
  }, [periodo, temAcesso, tentativa]);
  if (!temAcesso) return <AcessoNegado />;
  const atual = dados?.atual;
  const kpis = atual ? [
    { titulo: "Agendamentos no período", valor: atual.total == null ? "—" : formatar(atual.total), detalhe: atual.total == null ? "Dado indisponível" : comparar(atual.total, dados.anterior.total), Icone: CalendarDays, cor: "verde" },
    { titulo: "Taxa de cancelamento", valor: atual.total == null || atual.cancelamentos == null ? "—" : `${formatar(atual.total ? atual.cancelamentos / atual.total * 100 : 0)}%`, detalhe: atual.cancelamentos == null ? "Dado indisponível" : `${atual.cancelamentos} cancelamentos`, Icone: CalendarX, cor: "laranja" },
    { titulo: "Pacientes ativos", valor: atual.ativos == null ? "—" : formatar(atual.ativos), detalhe: atual.ativos == null ? "Dado indisponível" : comparar(atual.ativos, dados.anterior.ativos), Icone: Users, cor: "roxo" },
    { titulo: "Novos pacientes", valor: atual.novos == null ? "—" : formatar(atual.novos), detalhe: atual.novos == null ? "Aguardando dados do backend" : comparar(atual.novos, dados.anterior.novos), Icone: UserPlus, cor: "verde" },
  ] : [];
  return <div className="dashboard-page">
    <AgendaHeader variante="dashboard" nome={usuario?.nome ?? "Gestão"} subtitulo="Dashboard" showNav onSair={async () => { await logout(); navigate("/login"); }} />
    <main className="dashboard-main">
      <div className="dashboard-titulo"><h1>Dashboard</h1><div className="dashboard-periodo">
        <button className="dashboard-botao" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>{periodo.inicio.split("-").reverse().join("/")} - {periodo.fim.split("-").reverse().join("/")} <CalendarDays size={15} /></button>
        {aberto && <form className="dashboard-filtro" onKeyDown={e => { if (e.key === "Escape") setAberto(false); }} onSubmit={e => { e.preventDefault(); if (valido) { setPeriodo({ ...rascunho }); setAberto(false); } }}>
          <label>Início<input type="date" required value={rascunho.inicio} onChange={e => setRascunho({ ...rascunho, inicio: e.target.value })} /></label>
          <label>Fim<input type="date" required min={rascunho.inicio} value={rascunho.fim} onChange={e => setRascunho({ ...rascunho, fim: e.target.value })} /></label>
          {!valido && <small role="alert">Selecione um intervalo válido de até 367 dias.</small>}
          <button className="dashboard-botao" disabled={!valido}>Aplicar período</button>
        </form>}
      </div></div>
      {loading ? <p className="dashboard-mensagem" role="status">Carregando indicadores...</p> : erro ? <div className="dashboard-mensagem" role="alert"><p>{erro}</p><button className="dashboard-botao" onClick={() => setTentativa(tentativa + 1)}>Tentar novamente</button></div> : dados && <>
        <div className="dashboard-kpis">{kpis.map(({ titulo, valor, detalhe, Icone: icone, cor }) => { const Icone = icone; return <article className="dashboard-kpi" key={titulo}><span className={`dashboard-icone ${cor}`}><Icone size={29} strokeWidth={1.6} /></span><div><h2>{titulo}</h2><strong>{valor}</strong><p>{detalhe}</p></div></article>; })}</div>
        {atual.total === 0 && <p role="status">Nenhum agendamento encontrado no período selecionado.</p>}
        <div className="dashboard-graficos">
          <section className="dashboard-painel"><h2>Agendamento por dia da semana</h2><GraficoSemana dados={dados.semana} /></section>
          <section className="dashboard-painel dashboard-painel-direito"><div><h2>Serviços Mais Frequentados</h2><GraficoServicos dados={dados.servicos} /></div><div><h2>Taxa de Retorno de Pacientes</h2><GraficoRetorno dados={dados.retorno} /></div></section>
        </div>
        <p className="dashboard-legenda">Novos pacientes: primeiro atendimento finalizado no período. Retorno: pacientes atendidos na semana com atendimento finalizado antes dela. Comparação com o intervalo anterior de mesma duração.</p>
      </>}
      <div className="dashboard-insights"><button className="dashboard-botao" disabled title="Integração de IA ainda não disponível"><Sparkles size={18} />Insights da IA</button><small>Em breve</small></div>
    </main>
  </div>;
}
export default DashboardGerencial;


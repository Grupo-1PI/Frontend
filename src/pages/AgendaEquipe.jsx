import { useEffect, useMemo, useState } from "react";
import { Calendar, CalendarOff, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AgendaHeader from "../components/AgendaHeader";
import GradeSemanal from "../components/GradeSemanal";
import AbaExcecoes from "../components/AbaExcecoes";
import ModalDetalheAgendamento from "../components/ModalDetalheAgendamento";
import { useDadosBase } from "../hooks/useDadosBase";
import { getUsuarioLogado, logout } from "../services/auth";
import { listarAgendamentos, atualizarStatusAgendamento, atualizarAgendamento, listarExcecoesPorFuncionario } from "../services/agendamentos";
import { extrairHora, todayISO, segundaFeiraDaSemana, diasUteisDaSemana, addDaysISO, formatDiaCurto } from "../utils/agenda";

export function AgendaEquipe() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  const { funcionarios, servicos, salas, status: statusLista } = useDadosBase();

  useEffect(() => {
    if (!usuario) navigate("/login");
  }, [usuario, navigate]);

  const [aba, setAba] = useState("agenda"); // agenda | excecoes
  const [segunda, setSegunda] = useState(segundaFeiraDaSemana(todayISO()));
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [agendamentosDaSemana, setAgendamentosDaSemana] = useState([]);
  const [loadingSemana, setLoadingSemana] = useState(true);
  const [erroSemana, setErroSemana] = useState(null);
  const [agendamentoAberto, setAgendamentoAberto] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const [funcionarioExcecoes, setFuncionarioExcecoes] = useState(null);
  const [excecoes, setExcecoes] = useState([]);
  const [loadingExcecoes, setLoadingExcecoes] = useState(false);

  const dias = useMemo(() => diasUteisDaSemana(segunda), [segunda]);

  useEffect(() => {
    let cancelado = false;
    setLoadingSemana(true);
    setErroSemana(null);
    const fimSemana = addDaysISO(segunda, 4);
    listarAgendamentos({ inicio: `${segunda}T00:00:00`, fim: `${fimSemana}T23:59:59` })
      .then((res) => {
        if (!cancelado) setAgendamentosDaSemana(res || []);
      })
      .catch((err) => {
        if (!cancelado) setErroSemana(err);
      })
      .finally(() => {
        if (!cancelado) setLoadingSemana(false);
      });
    return () => {
      cancelado = true;
    };
  }, [segunda]);

  useEffect(() => {
    if (!funcionarioExcecoes) {
      setExcecoes([]);
      return;
    }
    let cancelado = false;
    setLoadingExcecoes(true);
    listarExcecoesPorFuncionario(funcionarioExcecoes)
      .then((res) => {
        if (!cancelado) setExcecoes(res || []);
      })
      .finally(() => {
        if (!cancelado) setLoadingExcecoes(false);
      });
    return () => {
      cancelado = true;
    };
  }, [funcionarioExcecoes]);

  const agendamentosFiltrados = useMemo(() => {
    if (filtroStatus === "todos") return agendamentosDaSemana;
    return agendamentosDaSemana.filter((a) => (a.statusNome || "").toLowerCase() === filtroStatus);
  }, [agendamentosDaSemana, filtroStatus]);

  const pendentesCount = agendamentosDaSemana.filter((a) => (a.statusNome || "").toLowerCase() === "pendente").length;

  const grade = useMemo(() => {
    const mapa = {};
    agendamentosFiltrados.forEach((a) => {
      const data = a.dataHoraInicio.slice(0, 10);
      const hora = extrairHora(a.dataHoraInicio);
      const chave = `${data}|${hora}`;
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(a);
    });
    return mapa;
  }, [agendamentosFiltrados]);

  async function mudarStatus(id, statusId) {
    setSalvando(true);
    try {
      const atualizado = await atualizarStatusAgendamento(id, statusId);
      setAgendamentosDaSemana((prev) => prev.map((a) => (a.id === id ? atualizado : a)));
      setAgendamentoAberto((cur) => (cur && cur.id === id ? atualizado : cur));
    } finally {
      setSalvando(false);
    }
  }

  async function atribuirDetalhes(id, { funcionarioId, salaId, servicoId }) {
    setSalvando(true);
    try {
      const atualizado = await atualizarAgendamento(id, { funcionarioId, salaId, servicoId });
      setAgendamentosDaSemana((prev) => prev.map((a) => (a.id === id ? atualizado : a)));
      setAgendamentoAberto((cur) => (cur && cur.id === id ? atualizado : cur));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <AgendaHeader nome={usuario?.nome ?? "Equipe"} subtitulo={usuario?.cargo?.nome ?? "Equipe"} onSair={async () => { await logout(); navigate("/login"); }} />

      <div className="mx-auto max-w-6xl px-5 pb-20 pt-7">
        <div className="mb-6 flex w-fit gap-1.5 rounded-full bg-brand-border/60 p-1.5">
          <button
            type="button"
            onClick={() => setAba("agenda")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              aba === "agenda" ? "bg-brand-surface text-brand-text shadow-sm" : "text-brand-muted"
            }`}
          >
            <Calendar size={16} /> Agenda
          </button>
          <button
            type="button"
            onClick={() => setAba("excecoes")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              aba === "excecoes" ? "bg-brand-surface text-brand-text shadow-sm" : "text-brand-muted"
            }`}
          >
            <CalendarOff size={16} /> Folgas &amp; exceções
          </button>
        </div>

        {aba === "agenda" && (
          <div>
            <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-heading text-3xl font-bold text-brand-text">Agendamentos</h1>
                <p className="text-sm text-brand-muted">Visualização semanal</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="rounded-lg border border-brand-border bg-brand-surface px-3.5 py-2.5 text-[13px] font-medium text-brand-text"
                >
                  <option value="todos">Todos os agendamentos</option>
                  <option value="pendente">Agendamentos a confirmar{pendentesCount ? ` (${pendentesCount})` : ""}</option>
                  {statusLista
                    .filter((s) => s.nome.toLowerCase() !== "pendente")
                    .map((s) => (
                      <option key={s.id} value={s.nome.toLowerCase()}>{s.nome}</option>
                    ))}
                </select>

                <div className="flex items-center gap-1 rounded-lg border border-brand-border bg-brand-surface px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setSegunda((s) => addDaysISO(s, -7))}
                    className="rounded-md p-1.5 text-brand-primary transition hover:bg-brand-bg"
                    aria-label="Semana anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-1 text-[13px] font-medium text-brand-text">
                    {formatDiaCurto(dias[0]).data} – {formatDiaCurto(dias[4]).data}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSegunda((s) => addDaysISO(s, 7))}
                    className="rounded-md p-1.5 text-brand-primary transition hover:bg-brand-bg"
                    aria-label="Próxima semana"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-primary-hover"
                >
                  <Plus size={16} /> Novo agendamento
                </button>
              </div>
            </div>

            {loadingSemana ? (
              <div className="py-16 text-center text-sm text-brand-muted">Carregando agenda da semana...</div>
            ) : erroSemana ? (
              <div className="mt-6 rounded-2xl border border-dashed border-status-cancelado/40 bg-status-cancelado/5 py-10 text-center text-sm text-status-cancelado">
                Não foi possível carregar a agenda desta semana.
              </div>
            ) : (
              <GradeSemanal dias={dias} grade={grade} onAbrirAgendamento={setAgendamentoAberto} />
            )}
          </div>
        )}

        {aba === "excecoes" && (
          <AbaExcecoes
            funcionarios={funcionarios}
            funcionarioSelecionado={funcionarioExcecoes}
            onSelecionarFuncionario={setFuncionarioExcecoes}
            excecoes={excecoes}
            loading={loadingExcecoes}
          />
        )}
      </div>

      {agendamentoAberto && (
        <ModalDetalheAgendamento
          agendamento={agendamentoAberto}
          funcionarios={funcionarios}
          servicos={servicos}
          salas={salas}
          salvando={salvando}
          onFechar={() => setAgendamentoAberto(null)}
          onMudarStatus={mudarStatus}
          onAtribuirDetalhes={atribuirDetalhes}
        />
      )}
    </div>
  );
}

export default AgendaEquipe;

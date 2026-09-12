import { useMemo, useState } from "react";
import { AlertCircle, Calendar, CalendarOff, CheckCircle2, ChevronLeft, ChevronRight, MapPin, XCircle } from "lucide-react";

import Modal from "../components/Modal";
import AgendaHeader from "../components/AgendaHeader";
import Linha from "../components/Linha";
import StatusBadge from "../components/StatusBadge";
import { useAgendamentosData } from "../hooks/useAgendamentosData";
import { addDays, formatDateLong } from "../utils/agenda";

// TODO: substituir pelo funcionário autenticado (contexto/sessão de login).
const FUNCIONARIO_LOGADO_ID = 2;

export function AgendaEquipe() {
  const { data, loading, error, atualizarStatusAgendamento } = useAgendamentosData();
  const { servicos, salas, funcionarios, clientes, agendaExcecoes, agendamentos } = data;

  const funcionarioLogado = funcionarios.find((f) => f.id === FUNCIONARIO_LOGADO_ID);

  const [aba, setAba] = useState("agenda"); // agenda | excecoes
  const [dataSel, setDataSel] = useState("2026-09-02");
  const [filtroFuncionario, setFiltroFuncionario] = useState("todos");
  const [agendamentoAberto, setAgendamentoAberto] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const agendamentosDoDia = useMemo(() => {
    return agendamentos
      .filter((a) => a.data === dataSel)
      .filter((a) => filtroFuncionario === "todos" || a.fkFuncionario === Number(filtroFuncionario))
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }, [agendamentos, dataSel, filtroFuncionario]);

  const contagemStatusDia = agendamentosDoDia.reduce((acc, a) => {
    acc[a.fkStatus] = (acc[a.fkStatus] || 0) + 1;
    return acc;
  }, {});

  async function mudarStatus(id, novoStatus) {
    setSalvando(true);
    try {
      const atualizado = await atualizarStatusAgendamento(id, novoStatus);
      setAgendamentoAberto((cur) => (cur && cur.id === id ? atualizado : cur));
    } finally {
      setSalvando(false);
    }
  }

  function dadosApoio(agendamento) {
    return {
      servico: servicos.find((s) => s.id === agendamento.fkServico),
      funcionario: funcionarios.find((f) => f.id === agendamento.fkFuncionario),
      sala: salas.find((s) => s.id === agendamento.fkSala),
      cliente: clientes.find((c) => c.id === agendamento.fkCliente),
    };
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg text-brand-muted">
        Carregando agenda...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-6 text-center text-status-cancelado">
        Não foi possível carregar os dados de agendamento. Verifique se o json-server está rodando.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <AgendaHeader nome={funcionarioLogado?.nome ?? "Equipe"} subtitulo={funcionarioLogado?.cargo} onSair={() => {}} />

      <div className="mx-auto max-w-4xl px-5 pb-20 pt-7">
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
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex max-w-[260px] items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDataSel((d) => addDays(d, -1))}
                  className="rounded-lg border border-brand-border bg-brand-surface p-2 text-brand-primary transition hover:bg-brand-bg"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="text-sm font-semibold capitalize text-brand-text">{formatDateLong(dataSel)}</div>
                <button
                  type="button"
                  onClick={() => setDataSel((d) => addDays(d, 1))}
                  className="rounded-lg border border-brand-border bg-brand-surface p-2 text-brand-primary transition hover:bg-brand-bg"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <select
                value={filtroFuncionario}
                onChange={(e) => setFiltroFuncionario(e.target.value)}
                className="rounded-lg border border-brand-border bg-brand-surface px-3.5 py-2 text-[13px] font-medium text-brand-text"
              >
                <option value="todos">Todos os profissionais</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((statusId) => (
                <span key={statusId} className="inline-flex">
                  <StatusPill statusId={statusId} contagem={contagemStatusDia[statusId] || 0} />
                </span>
              ))}
            </div>

            {agendamentosDoDia.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface py-10 text-center text-sm text-brand-muted">
                Nenhum agendamento para este dia.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {agendamentosDoDia.map((a) => {
                  const { servico, funcionario, sala, cliente } = dadosApoio(a);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAgendamentoAberto(a)}
                      className="flex flex-wrap items-center gap-4 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-left transition hover:border-brand-primary/50"
                    >
                      <div className="w-14 flex-shrink-0">
                        <div className="text-sm font-bold text-brand-primary">{a.hora_inicio}</div>
                        <div className="text-[11px] font-medium text-brand-muted">{a.hora_fim}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-brand-text">{cliente?.nome}</div>
                        <div className="text-xs text-brand-muted">{servico?.nome} · {funcionario?.nome}</div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1 text-xs text-brand-muted">
                        <MapPin size={14} /> {sala?.descricao}
                      </div>
                      <StatusBadge fkStatus={a.fkStatus} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {aba === "excecoes" && (
          <div>
            <h2 className="font-heading mb-1 text-lg font-semibold text-brand-text">Folgas e horários especiais</h2>
            <p className="mb-5 text-sm text-brand-muted">
              Bloqueios e liberações extras registrados na agenda dos profissionais.
            </p>
            <div className="flex flex-col gap-3">
              {agendaExcecoes.map((exc) => {
                const func = funcionarios.find((f) => f.id === exc.fkFuncionario);
                return (
                  <div key={exc.id} className="flex items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                        exc.disponivel ? "bg-status-confirmado/10 text-status-confirmado" : "bg-status-cancelado/10 text-status-cancelado"
                      }`}
                    >
                      {exc.disponivel ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-brand-text">{func?.nome}</div>
                      <div className="text-xs text-brand-muted">
                        {new Date(exc.data + "T00:00").toLocaleDateString("pt-BR")} ·{" "}
                        {exc.hora_inicio ? `${exc.hora_inicio} – ${exc.hora_fim}` : "Dia todo"} ·{" "}
                        {exc.disponivel ? "Horário extra liberado" : "Indisponível"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {agendamentoAberto && (
        <ModalDetalheAgendamento
          agendamento={agendamentoAberto}
          {...dadosApoio(agendamentoAberto)}
          salvando={salvando}
          onFechar={() => setAgendamentoAberto(null)}
          onMudarStatus={mudarStatus}
        />
      )}
    </div>
  );
}

function StatusPill({ statusId, contagem }) {
  const CONFIG = {
    1: { texto: "agendado(s)", classe: "bg-status-agendado/10 text-status-agendado" },
    2: { texto: "confirmado(s)", classe: "bg-status-confirmado/10 text-status-confirmado" },
    3: { texto: "cancelado(s)", classe: "bg-status-cancelado/10 text-status-cancelado" },
    4: { texto: "finalizado(s)", classe: "bg-status-finalizado/10 text-status-finalizado" },
  }[statusId];

  return (
    <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${CONFIG.classe}`}>
      {contagem} {CONFIG.texto}
    </span>
  );
}

function ModalDetalheAgendamento({ agendamento, servico, funcionario, sala, cliente, salvando, onFechar, onMudarStatus }) {
  return (
    <Modal onClose={onFechar}>
      <div className="mb-4 flex items-start justify-between gap-3 pr-6">
        <h3 className="font-heading text-lg font-semibold text-brand-text">{servico?.nome}</h3>
        <StatusBadge fkStatus={agendamento.fkStatus} />
      </div>

      <Linha label="Paciente" valor={cliente?.nome} />
      <Linha label="Profissional" valor={funcionario?.nome} />
      <Linha label="Horário" valor={`${agendamento.hora_inicio} – ${agendamento.hora_fim}`} />
      <Linha label="Sala" valor={sala?.descricao} />
      <Linha label="Valor" valor={`R$ ${servico?.valor?.toFixed(2)}`} last />

      {cliente?.observacao && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-800">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {cliente.observacao}
        </div>
      )}
      {agendamento.observacao && (
        <div className="mt-2 rounded-xl bg-brand-bg p-3 text-[12.5px] text-brand-muted">{agendamento.observacao}</div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {agendamento.fkStatus === 1 && (
          <button
            type="button"
            disabled={salvando}
            onClick={() => onMudarStatus(agendamento.id, 2)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-primary py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
          >
            <CheckCircle2 size={16} /> Confirmar
          </button>
        )}
        {(agendamento.fkStatus === 1 || agendamento.fkStatus === 2) && (
          <>
            <button
              type="button"
              disabled={salvando}
              onClick={() => onMudarStatus(agendamento.id, 4)}
              className="flex-1 rounded-lg bg-brand-bg py-2.5 text-[13px] font-semibold text-brand-text transition hover:bg-brand-border disabled:opacity-50"
            >
              Finalizar
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={() => onMudarStatus(agendamento.id, 3)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-status-cancelado/10 py-2.5 text-[13px] font-semibold text-status-cancelado transition hover:bg-status-cancelado/20 disabled:opacity-50"
            >
              <XCircle size={16} /> Cancelar
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

export default AgendaEquipe;

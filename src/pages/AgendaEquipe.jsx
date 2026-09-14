import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, CalendarOff, CheckCircle2, ChevronLeft, ChevronRight, MapPin, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Modal from "../components/Modal";
import AgendaHeader from "../components/AgendaHeader";
import Linha from "../components/Linha";
import StatusBadge from "../components/StatusBadge";
import { useDadosBase } from "../hooks/useDadosBase";
import { getUsuarioLogado, logout } from "../services/auth";
import { listarAgendamentos, atualizarStatusAgendamento, atualizarAgendamento, listarExcecoesPorFuncionario } from "../services/agendamentos";
import { formatDateLong, extrairHora, todayISO, STATUS_ID } from "../utils/agenda";

function addDaysISO(dataISO, n) {
  const d = new Date(dataISO + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function AgendaEquipe() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  const { funcionarios, servicos, salas, status: statusLista } = useDadosBase();

  useEffect(() => {
    if (!usuario) navigate("/login");
  }, [usuario, navigate]);

  const [aba, setAba] = useState("agenda"); // agenda | excecoes
  const [dataSel, setDataSel] = useState(todayISO());
  const [filtroFuncionario, setFiltroFuncionario] = useState("todos");
  const [agendamentosDoDia, setAgendamentosDoDia] = useState([]);
  const [loadingDia, setLoadingDia] = useState(true);
  const [erroDia, setErroDia] = useState(null);
  const [agendamentoAberto, setAgendamentoAberto] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const [funcionarioExcecoes, setFuncionarioExcecoes] = useState(null);
  const [excecoes, setExcecoes] = useState([]);
  const [loadingExcecoes, setLoadingExcecoes] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setLoadingDia(true);
    setErroDia(null);
    listarAgendamentos({ inicio: `${dataSel}T00:00:00`, fim: `${dataSel}T23:59:59` })
      .then((res) => {
        if (!cancelado) setAgendamentosDoDia(res || []);
      })
      .catch((err) => {
        if (!cancelado) setErroDia(err);
      })
      .finally(() => {
        if (!cancelado) setLoadingDia(false);
      });
    return () => {
      cancelado = true;
    };
  }, [dataSel]);

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
    // OBS: AgendamentoResponseDto retorna `funcionarios: string[]` (nomes), não o ID —
    // então o filtro abaixo compara pelo nome do funcionário selecionado no <select>.
    const nomeFuncionarioSel =
      filtroFuncionario === "todos" ? null : funcionarios.find((f) => String(f.id) === filtroFuncionario)?.nome;
    return agendamentosDoDia
      .filter((a) => !nomeFuncionarioSel || (a.funcionarios || []).includes(nomeFuncionarioSel))
      .sort((a, b) => (a.dataHoraInicio > b.dataHoraInicio ? 1 : -1));
  }, [agendamentosDoDia, filtroFuncionario, funcionarios]);

  const contagemStatusDia = agendamentosFiltrados.reduce((acc, a) => {
    const nome = (a.statusNome || "").toLowerCase();
    acc[nome] = (acc[nome] || 0) + 1;
    return acc;
  }, {});

  async function mudarStatus(id, statusId) {
    setSalvando(true);
    try {
      const atualizado = await atualizarStatusAgendamento(id, statusId);
      setAgendamentosDoDia((prev) => prev.map((a) => (a.id === id ? atualizado : a)));
      setAgendamentoAberto((cur) => (cur && cur.id === id ? atualizado : cur));
    } finally {
      setSalvando(false);
    }
  }

  async function atribuirDetalhes(id, { funcionarioId, salaId, servicoId }) {
    setSalvando(true);
    try {
      const atualizado = await atualizarAgendamento(id, { funcionarioId, salaId, servicoId });
      setAgendamentosDoDia((prev) => prev.map((a) => (a.id === id ? atualizado : a)));
      setAgendamentoAberto((cur) => (cur && cur.id === id ? atualizado : cur));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <AgendaHeader nome={usuario?.nome ?? "Equipe"} subtitulo={usuario?.cargo?.nome ?? "Equipe"} onSair={async () => { await logout(); navigate("/login"); }} />

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
                  onClick={() => setDataSel((d) => addDaysISO(d, -1))}
                  className="rounded-lg border border-brand-border bg-brand-surface p-2 text-brand-primary transition hover:bg-brand-bg"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="text-sm font-semibold capitalize text-brand-text">{formatDateLong(dataSel)}</div>
                <button
                  type="button"
                  onClick={() => setDataSel((d) => addDaysISO(d, 1))}
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
              {(statusLista.length ? statusLista.map((s) => s.nome) : ["Agendado", "Confirmado", "Cancelado", "Finalizado"]).map(
                (nome) => (
                  <StatusPill key={nome} nome={nome} contagem={contagemStatusDia[nome.toLowerCase()] || 0} />
                )
              )}
            </div>

            {loadingDia ? (
              <div className="py-10 text-center text-sm text-brand-muted">Carregando agenda do dia...</div>
            ) : erroDia ? (
              <div className="rounded-2xl border border-dashed border-status-cancelado/40 bg-status-cancelado/5 py-10 text-center text-sm text-status-cancelado">
                Não foi possível carregar a agenda deste dia.
              </div>
            ) : agendamentosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface py-10 text-center text-sm text-brand-muted">
                Nenhum agendamento para este dia.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {agendamentosFiltrados.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAgendamentoAberto(a)}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-left transition hover:border-brand-primary/50"
                  >
                    <div className="w-14 flex-shrink-0">
                      <div className="text-sm font-bold text-brand-primary">{extrairHora(a.dataHoraInicio)}</div>
                      <div className="text-[11px] font-medium text-brand-muted">{extrairHora(a.dataHoraFim)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-brand-text">{a.clienteNome}</div>
                      <div className="text-xs text-brand-muted">
                        {a.servicos?.[0] || "Procedimento a definir"} · {a.funcionarios?.[0]}
                      </div>
                    </div>
                    {a.salaDescricao && (
                      <div className="flex flex-shrink-0 items-center gap-1 text-xs text-brand-muted">
                        <MapPin size={14} /> {a.salaDescricao}
                      </div>
                    )}
                    <StatusBadge statusNome={a.statusNome} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {aba === "excecoes" && (
          <div>
            <h2 className="font-heading mb-1 text-lg font-semibold text-brand-text">Folgas e horários especiais</h2>
            <p className="mb-5 text-sm text-brand-muted">Selecione um profissional para ver seus bloqueios e liberações.</p>

            <select
              value={funcionarioExcecoes ?? ""}
              onChange={(e) => setFuncionarioExcecoes(e.target.value ? Number(e.target.value) : null)}
              className="mb-5 rounded-lg border border-brand-border bg-brand-surface px-3.5 py-2 text-[13px] font-medium text-brand-text"
            >
              <option value="">Selecione um profissional...</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>

            {loadingExcecoes ? (
              <div className="py-6 text-center text-sm text-brand-muted">Carregando...</div>
            ) : funcionarioExcecoes && excecoes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface py-10 text-center text-sm text-brand-muted">
                Nenhuma exceção registrada para este profissional.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {excecoes.map((exc) => (
                  <div key={exc.id} className="flex items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                        exc.disponivel ? "bg-status-confirmado/10 text-status-confirmado" : "bg-status-cancelado/10 text-status-cancelado"
                      }`}
                    >
                      {exc.disponivel ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-brand-text">
                        {new Date(exc.data + "T00:00").toLocaleDateString("pt-BR")}
                      </div>
                      <div className="text-xs text-brand-muted">
                        {exc.horaInicio ? `${exc.horaInicio} – ${exc.horaFim}` : "Dia todo"} ·{" "}
                        {exc.disponivel ? "Horário extra liberado" : "Indisponível"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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

function StatusPill({ nome, contagem }) {
  const chave = nome.toLowerCase();
  const CLASSES = {
    agendado: "bg-status-agendado/10 text-status-agendado",
    confirmado: "bg-status-confirmado/10 text-status-confirmado",
    cancelado: "bg-status-cancelado/10 text-status-cancelado",
    finalizado: "bg-status-finalizado/10 text-status-finalizado",
  };
  return (
    <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${CLASSES[chave] ?? "bg-brand-border text-brand-muted"}`}>
      {contagem} {nome.toLowerCase()}(s)
    </span>
  );
}

function ModalDetalheAgendamento({ agendamento, funcionarios, servicos, salas, salvando, onFechar, onMudarStatus, onAtribuirDetalhes }) {
  const statusAtual = (agendamento.statusNome || "").toLowerCase();
  const temServico = (agendamento.servicos || []).length > 0;
  const temFuncionario = (agendamento.funcionarios || []).length > 0;
  const temSala = !!agendamento.salaDescricao;
  const precisaAtribuir = !temServico || !temFuncionario || !temSala;

  const [funcionarioId, setFuncionarioId] = useState("");
  const [salaId, setSalaId] = useState("");
  const [servicoId, setServicoId] = useState("");

  const podeConfirmarAtribuicao = funcionarioId && salaId && servicoId;

  return (
    <Modal onClose={onFechar}>
      <div className="mb-4 flex items-start justify-between gap-3 pr-6">
        <h3 className="font-heading text-lg font-semibold text-brand-text">
          {agendamento.servicos?.[0] ?? "Procedimento a definir"}
        </h3>
        <StatusBadge statusNome={agendamento.statusNome} />
      </div>

      <Linha label="Paciente" valor={agendamento.clienteNome} />
      <Linha label="Profissional" valor={agendamento.funcionarios?.[0] ?? "A definir"} />
      <Linha label="Horário" valor={`${extrairHora(agendamento.dataHoraInicio)} – ${extrairHora(agendamento.dataHoraFim)}`} />
      <Linha label="Sala" valor={agendamento.salaDescricao ?? "A definir"} />
      {!temServico && <Linha label="Valor" valor="Taxa de reserva: R$ 50,00" last />}

      {agendamento.observacao && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-800">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {agendamento.observacao}
        </div>
      )}

      {precisaAtribuir && (
        <div className="mt-4 rounded-xl border border-brand-border bg-brand-bg p-4">
          <div className="mb-3 text-[13px] font-bold text-brand-text">Definir atendimento</div>
          <div className="flex flex-col gap-2.5">
            <select
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-[13px] text-brand-text"
            >
              <option value="">Procedimento...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
            <select
              value={funcionarioId}
              onChange={(e) => setFuncionarioId(e.target.value)}
              className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-[13px] text-brand-text"
            >
              <option value="">Profissional...</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
            <select
              value={salaId}
              onChange={(e) => setSalaId(e.target.value)}
              className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-[13px] text-brand-text"
            >
              <option value="">Sala...</option>
              {salas.map((s) => (
                <option key={s.id} value={s.id}>{s.descricao}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={!podeConfirmarAtribuicao || salvando}
            onClick={() =>
              onAtribuirDetalhes(agendamento.id, {
                funcionarioId: Number(funcionarioId),
                salaId: Number(salaId),
                servicoId: Number(servicoId),
              })
            }
            className="mt-3 w-full rounded-lg bg-brand-primary py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar atendimento"}
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {statusAtual === "agendado" && (
          <button
            type="button"
            disabled={salvando}
            onClick={() => onMudarStatus(agendamento.id, STATUS_ID.CONFIRMADO)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-primary py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
          >
            <CheckCircle2 size={16} /> Confirmar
          </button>
        )}
        {(statusAtual === "agendado" || statusAtual === "confirmado") && (
          <>
            <button
              type="button"
              disabled={salvando}
              onClick={() => onMudarStatus(agendamento.id, STATUS_ID.FINALIZADO)}
              className="flex-1 rounded-lg bg-brand-bg py-2.5 text-[13px] font-semibold text-brand-text transition hover:bg-brand-border disabled:opacity-50"
            >
              Finalizar
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={() => onMudarStatus(agendamento.id, STATUS_ID.CANCELADO)}
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

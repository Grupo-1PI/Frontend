import { useMemo, useState } from "react";
import { Calendar, CalendarPlus, CheckCircle2, Clock, XCircle } from "lucide-react";

import Modal from "../components/Modal";
import AgendaHeader from "../components/AgendaHeader";
import Secao from "../components/Secao";
import Linha from "../components/Linha";
import CalendarioMensal from "../components/CalendarioMensal";
import CardAgendamentoCliente from "../components/CardAgendamentoCliente";
import { useAgendamentosData } from "../hooks/useAgendamentosData";
import {
  primeiroDiaDoMes,
  todayISO,
  calcularSlotsLivres,
  primeiraSalaLivre,
  formatDateLong,
} from "../utils/agenda";

// TODO: substituir pelo cliente autenticado (contexto/sessão de login).
const CLIENTE_LOGADO_ID = 1;

export function AgendamentoCliente() {
  const { data, loading, error, criarAgendamento, atualizarStatusAgendamento } = useAgendamentosData();
  const { servicos, salas, funcionarios, clientes, agendaExcecoes, agendamentos } = data;

  const cliente = clientes.find((c) => c.id === CLIENTE_LOGADO_ID);

  const [aba, setAba] = useState("agendar");
  const [especialidadeSel, setEspecialidadeSel] = useState(null);
  const [servicoSel, setServicoSel] = useState(null);
  const [dataSel, setDataSel] = useState(null);
  const [mesRef, setMesRef] = useState(primeiroDiaDoMes(todayISO()));
  const [funcionarioSel, setFuncionarioSel] = useState(null);
  const [slotSel, setSlotSel] = useState(null);
  const [observacaoInput, setObservacaoInput] = useState("");
  const [modalHorarios, setModalHorarios] = useState(false);
  const [confirmado, setConfirmado] = useState(null);
  const [modalSucesso, setModalSucesso] = useState(false);
  const [cancelamentoPendente, setCancelamentoPendente] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Especialidades derivadas dos serviços cadastrados (sem endpoint próprio no db.json ainda).
  const especialidadesLista = useMemo(() => {
    const mapa = new Map();
    servicos.forEach((s) => {
      (s.especialidades || []).forEach((espId) => {
        if (!mapa.has(espId)) mapa.set(espId, espId);
      });
    });
    return Array.from(mapa.keys());
  }, [servicos]);

  const NOMES_ESPECIALIDADE = {
    1: "Dor muscular",
    2: "Ansiedade",
    3: "Insônia",
    4: "Reabilitação",
  };

  const servicosDaEspecialidade = useMemo(() => {
    if (!especialidadeSel) return [];
    return servicos.filter((s) => (s.especialidades || []).includes(especialidadeSel));
  }, [especialidadeSel, servicos]);

  const funcionariosQueAtendem = useMemo(() => {
    if (!servicoSel) return [];
    const servico = servicos.find((s) => s.id === servicoSel);
    if (!servico) return [];
    return funcionarios.filter((f) => (f.especialidades || []).some((e) => servico.especialidades.includes(e)));
  }, [servicoSel, servicos, funcionarios]);

  const funcionariosParaCalendario = useMemo(() => {
    if (funcionarioSel) return funcionarios.filter((f) => f.id === funcionarioSel);
    return funcionariosQueAtendem;
  }, [funcionarioSel, funcionariosQueAtendem, funcionarios]);

  const servicoAtual = servicos.find((s) => s.id === servicoSel);

  const slotsPorFuncionario = useMemo(() => {
    if (!servicoAtual || !dataSel) return [];
    const alvo = funcionarioSel ? funcionarios.filter((f) => f.id === funcionarioSel) : funcionariosQueAtendem;
    return alvo.map((f) => ({
      funcionario: f,
      slots: calcularSlotsLivres(f, dataSel, servicoAtual.tempoMedio, agendamentos, agendaExcecoes),
    }));
  }, [servicoAtual, dataSel, funcionarioSel, funcionarios, funcionariosQueAtendem, agendamentos, agendaExcecoes]);

  function resetFluxo() {
    setEspecialidadeSel(null);
    setServicoSel(null);
    setFuncionarioSel(null);
    setSlotSel(null);
    setDataSel(null);
    setMesRef(primeiroDiaDoMes(todayISO()));
    setConfirmado(null);
    setModalHorarios(false);
    setModalSucesso(false);
    setObservacaoInput("");
  }

  async function confirmarAgendamento() {
    if (!slotSel || salvando) return;
    setSalvando(true);
    try {
      const salaId = primeiraSalaLivre(salas, servicoSel, dataSel, slotSel.slot.inicio, slotSel.slot.fim, agendamentos);
      const novo = await criarAgendamento({
        data: dataSel,
        hora_inicio: slotSel.slot.inicio,
        hora_fim: slotSel.slot.fim,
        observacao: observacaoInput,
        fkCliente: CLIENTE_LOGADO_ID,
        fkSala: salaId,
        fkStatus: 1,
        fkFuncionario: slotSel.funcionarioId,
        fkServico: servicoSel,
      });
      setConfirmado(novo);
      setModalHorarios(false);
      setModalSucesso(true);
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarCancelamento() {
    if (!cancelamentoPendente || salvando) return;
    setSalvando(true);
    try {
      await atualizarStatusAgendamento(cancelamentoPendente.id, 3);
      setCancelamentoPendente(null);
    } finally {
      setSalvando(false);
    }
  }

  const meusAgendamentos = agendamentos
    .filter((a) => a.fkCliente === CLIENTE_LOGADO_ID)
    .sort((a, b) => (a.data + a.hora_inicio > b.data + b.hora_inicio ? -1 : 1));

  const futuros = meusAgendamentos.filter((a) => a.data + "T" + a.hora_inicio >= todayISO() + "T00:00" && a.fkStatus !== 3);
  const passados = meusAgendamentos.filter((a) => !(a.data + "T" + a.hora_inicio >= todayISO() + "T00:00") || a.fkStatus === 3);

  function dadosApoio(agendamento) {
    return {
      servico: servicos.find((s) => s.id === agendamento.fkServico),
      funcionario: funcionarios.find((f) => f.id === agendamento.fkFuncionario),
      sala: salas.find((s) => s.id === agendamento.fkSala),
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
      <AgendaHeader nome={cliente?.nome ?? "Paciente"} subtitulo="Área do paciente" onSair={() => {}} />

      <div className="mx-auto max-w-3xl px-5 pb-20 pt-7">
        <div className="mb-7 flex w-fit gap-1.5 rounded-full bg-brand-border/60 p-1.5">
          <button
            type="button"
            onClick={() => { setAba("agendar"); resetFluxo(); }}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              aba === "agendar" ? "bg-brand-surface text-brand-text shadow-sm" : "text-brand-muted"
            }`}
          >
            <CalendarPlus size={16} /> Agendar
          </button>
          <button
            type="button"
            onClick={() => setAba("meus")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              aba === "meus" ? "bg-brand-surface text-brand-text shadow-sm" : "text-brand-muted"
            }`}
          >
            <Calendar size={16} /> Meus agendamentos
            {futuros.length > 0 && (
              <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[11px] font-bold text-white">
                {futuros.length}
              </span>
            )}
          </button>
        </div>

        {aba === "agendar" && (
          <div>
            <Secao numero={1} titulo="Qual é a sua necessidade?">
              <div className="grid grid-cols-2 gap-3">
                {especialidadesLista.map((espId) => (
                  <button
                    key={espId}
                    type="button"
                    onClick={() => {
                      setEspecialidadeSel(espId);
                      setServicoSel(null);
                      setFuncionarioSel(null);
                      setSlotSel(null);
                    }}
                    className={`rounded-2xl border px-5 py-4 text-left text-[15px] font-medium transition ${
                      especialidadeSel === espId
                        ? "border-brand-primary bg-brand-primary/10 text-brand-text"
                        : "border-brand-border bg-brand-surface text-brand-text hover:border-brand-primary/50"
                    }`}
                  >
                    {NOMES_ESPECIALIDADE[espId] ?? `Especialidade ${espId}`}
                  </button>
                ))}
              </div>
            </Secao>

            {especialidadeSel && (
              <Secao numero={2} titulo="Escolha o serviço">
                <div className="flex flex-col gap-2.5">
                  {servicosDaEspecialidade.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setServicoSel(s.id); setFuncionarioSel(null); setSlotSel(null); }}
                      className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition ${
                        servicoSel === s.id
                          ? "border-brand-primary bg-brand-primary/10"
                          : "border-brand-border bg-brand-surface hover:border-brand-primary/50"
                      }`}
                    >
                      <div>
                        <div className="text-[15px] font-semibold text-brand-text">{s.nome}</div>
                        <div className="mt-0.5 text-[13px] text-brand-muted">{s.descricao}</div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-brand-muted">
                          <Clock size={13} /> {s.tempoMedio} min
                        </div>
                      </div>
                      <div className="font-heading whitespace-nowrap text-lg font-semibold text-brand-primary">
                        R$ {s.valor.toFixed(0)}
                      </div>
                    </button>
                  ))}
                </div>
              </Secao>
            )}

            {servicoSel && (
              <Secao numero={3} titulo="Escolha um dia disponível no calendário">
                {funcionariosQueAtendem.length > 1 && (
                  <div className="mb-4">
                    <div className="mb-2 text-[13.5px] font-semibold text-brand-muted">Profissional (opcional)</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => { setFuncionarioSel(null); setSlotSel(null); setDataSel(null); }}
                        className={`rounded-full border px-4 py-2 text-[13.5px] font-semibold transition ${
                          !funcionarioSel
                            ? "border-brand-primary bg-brand-primary/10 text-brand-text"
                            : "border-brand-border bg-brand-surface text-brand-muted"
                        }`}
                      >
                        Qualquer um
                      </button>
                      {funcionariosQueAtendem.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => { setFuncionarioSel(f.id); setSlotSel(null); setDataSel(null); }}
                          className={`rounded-full border px-4 py-2 text-[13.5px] font-semibold transition ${
                            funcionarioSel === f.id
                              ? "border-brand-primary bg-brand-primary/10 text-brand-text"
                              : "border-brand-border bg-brand-surface text-brand-muted"
                          }`}
                        >
                          {f.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <CalendarioMensal
                  mesRef={mesRef}
                  onMudarMes={setMesRef}
                  dataSel={dataSel}
                  funcionarios={funcionariosParaCalendario}
                  duracaoMin={servicoAtual.tempoMedio}
                  agendamentos={agendamentos}
                  excecoes={agendaExcecoes}
                  onSelecionarDia={(d) => {
                    setDataSel(d);
                    setSlotSel(null);
                    setModalHorarios(true);
                  }}
                />
              </Secao>
            )}
          </div>
        )}

        {aba === "meus" && (
          <div>
            <h2 className="font-heading mb-3.5 text-lg font-semibold text-brand-text">Próximos agendamentos</h2>
            {futuros.length === 0 ? (
              <EmptyState texto="Você ainda não tem agendamentos futuros." />
            ) : (
              <div className="mb-9 flex flex-col gap-3">
                {futuros.map((a) => (
                  <CardAgendamentoCliente
                    key={a.id}
                    agendamento={a}
                    {...dadosApoio(a)}
                    onCancelar={() => setCancelamentoPendente(a)}
                  />
                ))}
              </div>
            )}

            <h2 className="font-heading mb-3.5 text-lg font-semibold text-brand-text">Histórico</h2>
            {passados.length === 0 ? (
              <EmptyState texto="Nenhum agendamento anterior." />
            ) : (
              <div className="flex flex-col gap-3">
                {passados.map((a) => (
                  <CardAgendamentoCliente key={a.id} agendamento={a} {...dadosApoio(a)} historico />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: horários disponíveis para o dia selecionado */}
      {modalHorarios && dataSel && servicoAtual && (
        <Modal onClose={() => setModalHorarios(false)}>
          <h3 className="font-heading pr-6 text-xl font-semibold text-brand-text">Horários disponíveis</h3>
          <div className="mt-1 mb-5 text-[13.5px] capitalize text-brand-muted">Para o dia {formatDateLong(dataSel)}</div>

          {slotsPorFuncionario.map(({ funcionario, slots }) => (
            <div key={funcionario.id} className="mb-4.5">
              {(funcionariosQueAtendem.length > 1 || !funcionarioSel) && (
                <div className="mb-2.5 text-[13.5px] font-bold text-brand-text">{funcionario.nome}</div>
              )}
              {slots.length === 0 ? (
                <div className="py-1.5 text-sm text-brand-muted">Sem horários livres com este profissional neste dia.</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => {
                    const isSel = slotSel && slotSel.funcionarioId === funcionario.id && slotSel.slot.inicio === s.inicio;
                    return (
                      <button
                        key={s.inicio}
                        type="button"
                        onClick={() => setSlotSel({ funcionarioId: funcionario.id, slot: s })}
                        className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${
                          isSel
                            ? "border-brand-primary bg-brand-primary text-white"
                            : "border-brand-border bg-brand-surface text-brand-text hover:border-brand-primary/50"
                        }`}
                      >
                        {s.inicio}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="mt-5 mb-5">
            <label className="mb-2 block text-[13.5px] font-bold text-brand-text">Observações</label>
            <textarea
              value={observacaoInput}
              onChange={(e) => setObservacaoInput(e.target.value)}
              placeholder="Descreva o que você está sentindo..."
              rows={3}
              className="w-full resize-y rounded-xl border border-brand-border p-3 text-sm text-brand-text outline-none focus:border-brand-primary"
            />
          </div>

          <button
            type="button"
            disabled={!slotSel || salvando}
            onClick={confirmarAgendamento}
            className="btn-login mb-2.5 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? "Agendando..." : "Agendar horário"}
          </button>
          <button
            type="button"
            onClick={() => setModalHorarios(false)}
            className="w-full rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
          >
            Cancelar
          </button>
        </Modal>
      )}

      {/* Modal: confirmação de sucesso */}
      {modalSucesso && confirmado && (
        <Modal onClose={() => { setModalSucesso(false); resetFluxo(); }}>
          <div className="mb-4 flex items-start gap-3 pr-6">
            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-status-confirmado/10 text-status-confirmado">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-brand-text">Agendamento realizado com sucesso</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-brand-muted">
                Seu horário foi reservado. Entraremos em contato com detalhes do procedimento e orientações pré-sessão.
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-2xl bg-brand-bg p-4.5">
            <div className="mb-2.5 text-[11px] font-bold tracking-wide text-brand-muted">RESUMO DA RESERVA</div>
            <Linha label="Procedimento" valor={servicos.find((s) => s.id === confirmado.fkServico)?.nome} />
            <Linha label="Data" valor={formatDateLong(confirmado.data)} />
            <Linha label="Horário" valor={`${confirmado.hora_inicio} – ${confirmado.hora_fim}`} />
            <Linha
              label="Profissional"
              valor={funcionarios.find((f) => f.id === confirmado.fkFuncionario)?.nome}
            />
            <Linha label="Local" valor={salas.find((s) => s.id === confirmado.fkSala)?.descricao} last />
          </div>

          <button
            type="button"
            onClick={() => { setModalSucesso(false); resetFluxo(); setAba("meus"); }}
            className="btn-login mb-2.5 w-full"
          >
            Ver meus agendamentos
          </button>
          <button
            type="button"
            onClick={() => { setModalSucesso(false); resetFluxo(); }}
            className="w-full rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
          >
            Voltar à página inicial
          </button>
        </Modal>
      )}

      {/* Modal: confirmação de cancelamento */}
      {cancelamentoPendente && (
        <Modal onClose={() => setCancelamentoPendente(null)}>
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-status-cancelado/10 text-status-cancelado">
              <XCircle size={26} />
            </div>
            <h3 className="font-heading text-lg font-semibold text-brand-text">Cancelar agendamento?</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              Você está prestes a cancelar esta consulta. Essa ação não pode ser desfeita e o horário voltará a ficar
              disponível para outros pacientes.
            </p>
          </div>

          <div className="mb-5 rounded-2xl bg-brand-bg p-4">
            <Linha label="Procedimento" valor={servicos.find((s) => s.id === cancelamentoPendente.fkServico)?.nome} />
            <Linha label="Data" valor={formatDateLong(cancelamentoPendente.data)} />
            <Linha
              label="Horário"
              valor={`${cancelamentoPendente.hora_inicio} – ${cancelamentoPendente.hora_fim}`}
            />
            <Linha
              label="Profissional"
              valor={funcionarios.find((f) => f.id === cancelamentoPendente.fkFuncionario)?.nome}
              last
            />
          </div>

          <button
            type="button"
            disabled={salvando}
            onClick={confirmarCancelamento}
            className="mb-2.5 w-full rounded-lg bg-status-cancelado py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {salvando ? "Cancelando..." : "Sim, cancelar consulta"}
          </button>
          <button
            type="button"
            onClick={() => setCancelamentoPendente(null)}
            className="w-full rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
          >
            Manter agendamento
          </button>
        </Modal>
      )}
    </div>
  );
}

function EmptyState({ texto }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface py-10 text-center text-sm text-brand-muted">
      {texto}
    </div>
  );
}

export default AgendamentoCliente;

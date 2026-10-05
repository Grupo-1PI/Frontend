import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import GradeMatricial from "../components/GradeMatricial";
import PeriodoIntervalo from "../components/PeriodoIntervalo";
import AcessoNegado from "../components/AcessoNegado";
import CalendarioMensal from "../components/CalendarioMensal";
import { alerta } from "../utils/alerta";
import { getUsuarioLogado, logout, temPermissao } from "../services/auth";
import { podeVerAgendamentos } from "../services/permissoes";
import { listarAgendamentosDoPeriodo, criarAgendamento, listarClientes, listarServicos, listarFuncionarios, listarSalas, excluirAgendamento, atualizarStatusAgendamento, consultarHorarios } from "../services/agendamentos";
import { addDiasISO, diasDoPeriodo, formatarDataHoraLocal, semanaAtual, primeiroDiaDoMes, todayISO, formatDateLong } from "../utils/agenda";

function maskCpf(value) {
  const numbers = String(value).replace(/\D/g, "").slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2");
}

export function AgendaClinica() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  const [periodo, setPeriodo] = useState(semanaAtual);
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [salaId, setSalaId] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [observacao, setObservacao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);

  // Estados da jornada visual estilo Calendário Mensal e Horários
  const [dataSel, setDataSel] = useState(null);
  const [mesRef, setMesRef] = useState(primeiroDiaDoMes(todayISO()));
  const [horarios, setHorarios] = useState([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [horarioSel, setHorarioSel] = useState(null);
  const [buscaCliente, setBuscaCliente] = useState("");

  useEffect(() => {
    if (!dataSel || !servicoId || !funcionarioId) return;
    let cancelado = false;
    setCarregandoHorarios(true);
    consultarHorarios(dataSel, servicoId, funcionarioId)
      .then((res) => {
        if (!cancelado) setHorarios((res || []).filter((h) => h.disponivel));
      })
      .catch((err) => {
        if (!cancelado) console.error("Erro ao consultar horários", err);
      })
      .finally(() => {
        if (!cancelado) setCarregandoHorarios(false);
      });
    return () => {
      cancelado = true;
    };
  }, [dataSel, servicoId, funcionarioId]);

  const temAcesso = podeVerAgendamentos();

  const dias = useMemo(() => diasDoPeriodo(periodo), [periodo]);

  const carregarAgendamentos = useCallback(async () => {
    if (!temAcesso) return;
    try {
      setCarregandoAgendamentos(true);
      const lista = await listarAgendamentosDoPeriodo({
        inicio: `${periodo.inicio}T00:00:00`,
        fim: `${periodo.fim}T23:59:59`,
      });
      setAgendamentos(lista);
    } catch (err) {
      console.error("Erro ao carregar agendamentos do período", err);
    } finally {
      setCarregandoAgendamentos(false);
    }
  }, [periodo, temAcesso]);

  const carregarDados = useCallback(async () => {
    if (!temAcesso) return;
    try {
      setLoading(true);
      const [cliList, servList, funcList, salaList] = await Promise.all([
        listarClientes(),
        listarServicos(),
        listarFuncionarios(),
        listarSalas(),
      ]);
      setClientes(cliList);
      setServicos(servList);
      setFuncionarios(funcList);
      setSalas(salaList);
      if (cliList.length) setClienteId(cliList[0].id);
      if (servList.length) setServicoId(servList[0].id);
      if (funcList.length) setFuncionarioId(funcList[0].id);
      if (salaList.length) setSalaId(salaList[0].id);
    } catch (err) {
      console.error("Erro ao carregar dados da agenda", err);
    } finally {
      setLoading(false);
    }
  }, [temAcesso]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  if (!temAcesso) {
    return <AcessoNegado />;
  }

  const moverSemana = (quantidade) => {
    setPeriodo((atual) => ({
      inicio: addDiasISO(atual.inicio, quantidade),
      fim: addDiasISO(atual.fim, quantidade),
    }));
  };


  const handleCriar = async () => {
    if (!dataHora || !clienteId) {
      alerta.aviso("Preencha a data/hora e selecione o cliente.");
      return;
    }
    try {
      setSubmitting(true);
      const inicio = new Date(dataHora);
      const fim = new Date(inicio.getTime() + 60 * 60 * 1000); // +1 hora

      await criarAgendamento({
        dataHoraInicio: formatarDataHoraLocal(inicio),
        dataHoraFim: formatarDataHoraLocal(fim),
        observacao: observacao || "Agendado pela Recepção",
        clienteId: Number(clienteId),
        funcionarioId: Number(funcionarioId),
        salaId: Number(salaId),
        servicoId: Number(servicoId),
        statusId: 5, // Agendado
      });
      setIsModalOpen(false);
      await carregarAgendamentos();
    } catch (err) {
      console.error("Erro ao criar agendamento", err);
      alerta.erro("Erro ao criar agendamento. Verifique conflitos de horário.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAprovar = async (id) => {
    try {
      await atualizarStatusAgendamento(id, 2);
      setAgendamentoSelecionado(null);
      await carregarAgendamentos();
    } catch (err) {
      console.error("Erro ao aprovar agendamento", err);
      alerta.erro("Erro ao aprovar agendamento.");
    }
  };

  const handleCancelarSoft = async (id) => {
    try {
      await atualizarStatusAgendamento(id, 3);
      setAgendamentoSelecionado(null);
      await carregarAgendamentos();
    } catch (err) {
      console.error("Erro ao cancelar agendamento", err);
      alerta.erro("Erro ao cancelar agendamento.");
    }
  };

  const handleExcluir = async (id) => {
    if (!confirm("Deseja excluir permanentemente este agendamento?")) return;
    try {
      await excluirAgendamento(id);
      setAgendamentoSelecionado(null);
      await carregarAgendamentos();
    } catch (err) {
      console.error("Erro ao excluir agendamento", err);
    }
  };

  const horariosGrade = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Agendamentos" showNav={true} onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-10">
        <ManagementHeader
          title="Agendamentos"
          subtitle="Grade Matricial Semanal"
          buttonText="Novo agendamento"
          onButtonClick={() => {
            setDataHora(`${periodo.inicio}T08:00`);
            setIsModalOpen(true);
          }}
        >
          <PeriodoIntervalo periodo={periodo} onChange={setPeriodo} />
        </ManagementHeader>

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-500">Carregando grade de agendamentos...</div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Semana anterior"
              onClick={() => moverSemana(-7)}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#333E33]/20 bg-white text-[#333E33] shadow-sm transition hover:bg-gray-50"
            >
              <ChevronLeft size={20} />
            </button>

            <div className={`min-w-0 flex-1 transition ${carregandoAgendamentos ? "opacity-60" : ""}`}>
              <GradeMatricial
                dias={dias}
                horarios={horariosGrade}
                agendamentos={agendamentos}
                onSelectAgendamento={(ag) => setAgendamentoSelecionado(ag)}
              />
            </div>

            <button
              type="button"
              aria-label="Próxima semana"
              onClick={() => moverSemana(7)}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#333E33]/20 bg-white text-[#333E33] shadow-sm transition hover:bg-gray-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Modal Novo Agendamento (Jornada em Etapas / Wizard) */}
        <BaseModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setModalStep(1); }}
          title={`Novo Agendamento — Passo ${modalStep} de 4`}
          subtitle={
            modalStep === 1 ? "1. Selecione o Serviço" :
            modalStep === 2 ? "2. Selecione Data/Horário e Cliente" :
            modalStep === 3 ? "3. Selecione Profissional e Sala" :
            "4. Confirmação e Observação"
          }
          showFooter={false}
        >
          <div className="space-y-4">
            {/* Indicador de Passos */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 text-xs font-semibold text-gray-400">
              <span className={modalStep === 1 ? "text-brand-primary font-bold underline" : ""}>1. Serviço</span>
              <span>→</span>
              <span className={modalStep === 2 ? "text-brand-primary font-bold underline" : ""}>2. Horário/Cliente</span>
              <span>→</span>
              <span className={modalStep === 3 ? "text-brand-primary font-bold underline" : ""}>3. Doutor/Sala</span>
              <span>→</span>
              <span className={modalStep === 4 ? "text-brand-primary font-bold underline" : ""}>4. Confirmar</span>
            </div>

            {modalStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Selecione o Serviço Desejado</label>
                  <select
                    value={servicoId}
                    onChange={(e) => setServicoId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#333E33] outline-none focus:border-[#333E33] transition"
                  >
                    {servicos.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} (R$ {s.valor}) — Duração: {s.tempoMedio || 50} min
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setModalStep(2)}
                  className="w-full rounded-xl bg-[#333E33] text-white py-3.5 text-sm font-semibold hover:bg-[#252E25] transition shadow-sm mt-4"
                >
                  Avançar para Data e Horário →
                </button>
              </div>
            )}

            {modalStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Buscar Cliente (Nome, E-mail ou CPF)</label>
                  <input
                    type="text"
                    placeholder="Digite nome, e-mail ou CPF (000.000.000-00)..."
                    value={buscaCliente}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Se parecer CPF, aplica máscara
                      setBuscaCliente(val.length > 9 && /\d/.test(val) ? maskCpf(val) : val);
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#333E33] outline-none focus:border-[#333E33] transition mb-2"
                  />
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#333E33] outline-none focus:border-[#333E33] transition"
                  >
                    <option value="">Selecione o cliente...</option>
                    {clientes
                      .filter((c) => {
                        const term = buscaCliente.toLowerCase();
                        const nome = (c.nome || "").toLowerCase();
                        const email = (c.email || "").toLowerCase();
                        const cpf = (c.cpf || "").toLowerCase();
                        return nome.includes(term) || email.includes(term) || cpf.includes(term);
                      })
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} — {c.email} {c.cpf ? `(CPF: ${c.cpf})` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                {temPermissao("CRUD_CLIENTE") && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate("/clientes")}
                      className="text-xs font-semibold text-brand-primary hover:underline"
                    >
                      + Cadastrar ou Gerenciar Clientes
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="w-1/2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-[#333E33] hover:bg-gray-50 transition"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!clienteId) {
                        alerta.aviso("Por favor, selecione um cliente.");
                        return;
                      }
                      setModalStep(3);
                    }}
                    className="w-1/2 rounded-xl bg-[#333E33] text-white py-3.5 text-sm font-semibold hover:bg-[#252E25] transition shadow-sm"
                  >
                    Avançar para Doutor e Horário →
                  </button>
                </div>
              </div>
            )}

            {modalStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Profissional (Doutor)</label>
                  <select
                    value={funcionarioId}
                    onChange={(e) => {
                      setFuncionarioId(e.target.value);
                      setDataSel(null);
                      setHorarioSel(null);
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#333E33] outline-none focus:border-[#333E33] transition"
                  >
                    <option value="">Selecione o profissional...</option>
                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome} ({f.cargo})
                      </option>
                    ))}
                  </select>
                </div>

                {funcionarioId && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Selecione o Dia no Calendário</label>
                    <CalendarioMensal
                      mesRef={mesRef}
                      onMudarMes={setMesRef}
                      dataSel={dataSel}
                      onSelecionarDia={(d) => {
                        setDataSel(d);
                        setHorarioSel(null);
                      }}
                      servicoId={servicoId}
                      funcionarioId={funcionarioId}
                    />
                  </div>
                )}

                {dataSel && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Horários Disponíveis em {formatDateLong(dataSel)}</label>
                    {carregandoHorarios ? (
                      <p className="text-xs text-gray-400">Carregando horários...</p>
                    ) : horarios.length === 0 ? (
                      <p className="text-xs text-red-500">Nenhum horário livre neste dia para este profissional.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {horarios.map((h, hIdx) => (
                          <button
                            key={hIdx}
                            type="button"
                            onClick={() => {
                              setHorarioSel(h);
                              setDataHora(`${dataSel}T${h.horario}`);
                            }}
                            className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
                              horarioSel?.horario === h.horario
                                ? "border-[#333E33] bg-[#333E33] text-white shadow-sm"
                                : "border-gray-200 bg-white text-[#333E33] hover:bg-gray-50"
                            }`}
                          >
                            {h.horario}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    className="w-1/2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-[#333E33] hover:bg-gray-50 transition"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!dataHora || !horarioSel) {
                        alerta.aviso("Por favor, selecione uma data e um horário disponível.");
                        return;
                      }
                      setModalStep(4);
                    }}
                    className="w-1/2 rounded-xl bg-[#333E33] text-white py-3.5 text-sm font-semibold hover:bg-[#252E25] transition shadow-sm"
                  >
                    Revisar e Concluir →
                  </button>
                </div>
              </div>
            )}

            {modalStep === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Sala de Atendimento</label>
                  <select
                    value={salaId}
                    onChange={(e) => setSalaId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#333E33] outline-none focus:border-[#333E33] transition"
                  >
                    {salas.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.descricao}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-xs text-[#333E33] border border-gray-200">
                  <div><strong>Serviço:</strong> {servicos.find(s => String(s.id) === String(servicoId))?.nome}</div>
                  <div><strong>Cliente:</strong> {clientes.find(c => String(c.id) === String(clienteId))?.nome}</div>
                  <div><strong>Profissional:</strong> {funcionarios.find(f => String(f.id) === String(funcionarioId))?.nome}</div>
                  <div><strong>Data/Hora:</strong> {dataHora}</div>
                  <div><strong>Sala:</strong> {salas.find(s => String(s.id) === String(salaId))?.descricao}</div>
                </div>

                <FloatingInput
                  label="Observação (Opcional)"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalStep(3)}
                    className="w-1/2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-[#333E33] hover:bg-gray-50 transition"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                      await handleCriar();
                      if (!submitting) {
                        setModalStep(1);
                        setDataSel(null);
                        setHorarioSel(null);
                      }
                    }}
                    className="w-1/2 rounded-xl bg-[#333E33] text-white py-3.5 text-sm font-semibold hover:bg-[#252E25] transition shadow-sm disabled:opacity-50"
                  >
                    {submitting ? "Criando..." : "Confirmar Agendamento"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </BaseModal>

        {/* Modal Detalhes / Aprovação / Cancelamento de Agendamento */}
        {agendamentoSelecionado && (
          <BaseModal
            isOpen={!!agendamentoSelecionado}
            onClose={() => setAgendamentoSelecionado(null)}
            title="Detalhes do Agendamento"
            subtitle={agendamentoSelecionado.clienteNome || "Paciente"}
            showFooter={false}
          >
            <div className="space-y-4 text-sm text-[#333E33]">
              <div className="rounded-xl bg-gray-50 p-4 space-y-2 border border-gray-200">
                <div><strong>Serviço:</strong> {agendamentoSelecionado.servicoNome || agendamentoSelecionado.servicos?.[0] || "Acupuntura"}</div>
                <div><strong>Profissional:</strong> {agendamentoSelecionado.funcionarios?.[0] || "Profissional"}</div>
                <div><strong>Sala:</strong> {agendamentoSelecionado.salaDescricao || "Sala"}</div>
                <div><strong>Data/Hora:</strong> {agendamentoSelecionado.dataHoraInicio}</div>
                <div><strong>Status atual:</strong> <span className="font-semibold text-brand-primary">{agendamentoSelecionado.statusNome || "Agendado"}</span></div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                {agendamentoSelecionado.statusNome !== "Confirmado" && (
                  <button
                    type="button"
                    onClick={() => handleAprovar(agendamentoSelecionado.id)}
                    className="w-full rounded-xl bg-green-600 text-white py-3 text-sm font-semibold hover:bg-green-700 transition shadow-sm"
                  >
                    Aprovar Horário (Confirmado)
                  </button>
                )}

                {agendamentoSelecionado.statusNome !== "Cancelado" && (
                  <button
                    type="button"
                    onClick={() => handleCancelarSoft(agendamentoSelecionado.id)}
                    className="w-full rounded-xl bg-amber-600 text-white py-3 text-sm font-semibold hover:bg-amber-700 transition shadow-sm"
                  >
                    Cancelar Horário (Liberar Slot)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleExcluir(agendamentoSelecionado.id)}
                  className="w-full rounded-xl bg-red-600 text-white py-3 text-sm font-semibold hover:bg-red-700 transition shadow-sm"
                >
                  Excluir Permanentemente
                </button>

                <button
                  type="button"
                  onClick={() => setAgendamentoSelecionado(null)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-[#333E33] hover:bg-gray-50 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </BaseModal>
        )}
      </div>
    </div>
  );
}

export default AgendaClinica;

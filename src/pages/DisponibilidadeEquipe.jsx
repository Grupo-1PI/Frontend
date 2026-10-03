import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Trash2, Clock, User, CalendarOff, CalendarCheck } from "lucide-react";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import CalendarioMensal from "../components/CalendarioMensal";
import AcessoNegado from "../components/AcessoNegado";
import { alerta } from "../utils/alerta";
import { getUsuarioLogado, logout } from "../services/auth";
import { podeVerDisponibilidade, podeGerenciarFuncionarios } from "../services/permissoes";
import { listarTodasAgendas, listarFuncionarios, criarAgendaFuncionario, deletarAgendaFuncionario, listarExcecoesPorFuncionario, criarExcecaoAgenda, excluirExcecaoAgenda } from "../services/agendamentos";
import { primeiroDiaDoMes, todayISO } from "../utils/agenda";

const TIPOS_EXCECAO = [
  {
    id: "folga",
    titulo: "Folga / dia indisponível",
    descricao: "O profissional não atende o dia inteiro (feriado, ausência).",
    disponivel: false,
    aceitaHorario: false,
    icone: CalendarOff,
  },
  {
    id: "periodo",
    titulo: "Bloquear um período",
    descricao: "Indisponibilidade apenas dentro de uma faixa de horas, por exemplo o almoço.",
    disponivel: false,
    aceitaHorario: true,
    icone: CalendarOff,
  },
  {
    id: "liberacao",
    titulo: "Liberação excepcional",
    descricao: "Abre um horário extra fora do padrão, por exemplo uma reposição de sábado. Pode ser o dia inteiro ou só uma faixa de horas.",
    disponivel: true,
    aceitaHorario: true,
    icone: CalendarCheck,
  },
];

/** Folga e liberação são sempre de dia inteiro; as outras duas aceitam faixa. */
const tipoAceitaHorario = (tipoId) =>
  TIPOS_EXCECAO.find((t) => t.id === tipoId)?.aceitaHorario ?? false;

/** 2026-10-07 -> 07/10/2026 (a API devolve LocalDate em ISO). */
function formatarDataExcecao(data) {
  if (!data) return "";
  const [ano, mes, dia] = String(data).slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

const ROTULO_TIPO_EXCECAO = {
  folga: "Folga",
  periodo: "Bloqueio de período",
  liberacao: "Liberação",
};

export function DisponibilidadeEquipe() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  const [agendas, setAgendas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Jornada: null = lista de funcionários; object = detalhe do funcionário selecionado
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [funcionarioId, setFuncionarioId] = useState("");
  const [diaSemana, setDiaSemana] = useState("2"); // Segunda por padrão
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFim, setHoraFim] = useState("18:00");
  const [submitting, setSubmitting] = useState(false);

  // Jornada de folgas / exceções
  const [excecoes, setExcecoes] = useState([]);
  const [modalExcecao, setModalExcecao] = useState(false);
  const [excecaoStep, setExcecaoStep] = useState(1);
  const [excecaoTipo, setExcecaoTipo] = useState("folga");
  const [excecaoData, setExcecaoData] = useState(null);
  const [excecaoMesRef, setExcecaoMesRef] = useState(primeiroDiaDoMes(todayISO()));
  const [excecaoHoraInicio, setExcecaoHoraInicio] = useState("12:00");
  const [excecaoHoraFim, setExcecaoHoraFim] = useState("13:00");

  const temAcesso = podeVerDisponibilidade();

  // Quem não é administrador vê apenas a própria disponibilidade (e a API de
  // funcionários é 403 para ele, então nem precisa ser chamada).
  const gerenciaTodos = podeGerenciarFuncionarios();

  const agendasVisiveis = gerenciaTodos
    ? agendas
    : agendas.filter((item) => item.funcionarioId === usuario?.funcionarioId);

  const carregarDados = async () => {
    if (!temAcesso) return;
    try {
      setLoading(true);
      // allSettled: uma falha isolada (ex.: /funcionarios 403 para um
      // funcionário) não pode derrubar a tela inteira.
      const [resultadoAgendas, resultadoFuncionarios] = await Promise.allSettled([
        listarTodasAgendas(),
        gerenciaTodos ? listarFuncionarios() : Promise.resolve([]),
      ]);

      const agendasData = resultadoAgendas.status === "fulfilled" ? resultadoAgendas.value || [] : [];
      const funcData = resultadoFuncionarios.status === "fulfilled" ? resultadoFuncionarios.value || [] : [];

      setAgendas(agendasData);
      setFuncionarios(funcData);
      if (funcData.length > 0 && !funcionarioId) setFuncionarioId(funcData[0].id);
    } catch (err) {
      console.error("Erro ao carregar disponibilidades", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Um funcionário que não administra outros abre direto a própria agenda.
  useEffect(() => {
    if (loading || gerenciaTodos || selectedFuncionario) return;
    const minha = agendasVisiveis.find((item) => item.funcionarioId === usuario?.funcionarioId);
    if (minha) setSelectedFuncionario(minha);
  }, [loading, gerenciaTodos, agendasVisiveis, usuario?.funcionarioId]);

  // Carrega as folgas/exceções do funcionário que está em detalhes
  useEffect(() => {
    if (selectedFuncionario?.funcionarioId) {
      carregarExcecoes(selectedFuncionario.funcionarioId);
    } else {
      setExcecoes([]);
    }
    }, [selectedFuncionario?.funcionarioId]);

  if (!temAcesso) {
    return <AcessoNegado />;
  }

  const handleCreate = async () => {
    const targetFuncId = selectedFuncionario ? selectedFuncionario.funcionarioId : funcionarioId;
    if (!targetFuncId) return;
    try {
      setSubmitting(true);
      await criarAgendaFuncionario({
        funcionarioId: Number(targetFuncId),
        diaSemana: Number(diaSemana),
        horaInicio,
        horaFim,
      });
      setIsModalOpen(false);
      await carregarDados();
      alerta.sucesso("Horário de trabalho cadastrado.");
      // Atualiza o selecionado se estiver na tela de detalhe
      if (selectedFuncionario) {
        const updated = await listarTodasAgendas();
        const found = updated.find((item) => item.funcionarioId === selectedFuncionario.funcionarioId);
        if (found) setSelectedFuncionario(found);
      }
    } catch (err) {
      console.error("Erro ao criar agenda", err);
      const msg = err.response?.data?.mensagem || err.response?.data?.message || "Erro ao cadastrar horário.";
      alerta.erro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (agendaId) => {
    const ok = await alerta.confirmar("Deseja remover este turno?", {
      titulo: "Remover horário",
      variante: "danger",
    });
    if (!ok) return;
    try {
      await deletarAgendaFuncionario(agendaId);
      await carregarDados();
      if (selectedFuncionario) {
        const updated = await listarTodasAgendas();
        const found = updated.find((item) => item.funcionarioId === selectedFuncionario.funcionarioId);
        if (found) setSelectedFuncionario(found);
      }
    } catch (err) {
      console.error("Erro ao excluir agenda", err);
      alerta.erro("Não foi possível remover este horário.");
    }
  };

  // ---------- Folgas / exceções ----------

  const carregarExcecoes = async (funcId) => {
    if (!funcId) return;
    try {
      const resposta = await listarExcecoesPorFuncionario(funcId);
      // A API pode devolver algo inesperado; .map nesse caso quebraria a tela inteira.
      setExcecoes(Array.isArray(resposta) ? resposta : []);
      if (!Array.isArray(resposta)) {
        alerta.erro("Não foi possível carregar as folgas deste profissional.");
      }
    } catch (err) {
      console.error("Erro ao carregar exceções", err);
      setExcecoes([]);
    }
  };

  const abrirJornadaExcecao = () => {
    setExcecaoStep(1);
    setExcecaoTipo("folga");
    setExcecaoData(null);
    setExcecaoMesRef(primeiroDiaDoMes(todayISO()));
    setExcecaoHoraInicio("12:00");
    setExcecaoHoraFim("13:00");
    setModalExcecao(true);
  };

  const handleCriarExcecao = async () => {
    const tipo = TIPOS_EXCECAO.find((t) => t.id === excecaoTipo);
    const funcId = selectedFuncionario?.funcionarioId ?? funcionarioId;
    const usaHorario = tipo.aceitaHorario;

    const payload = {
      funcionarioId: Number(funcId),
      data: excecaoData,
      horaInicio: usaHorario ? excecaoHoraInicio : null,
      horaFim: usaHorario ? excecaoHoraFim : null,
      disponivel: tipo.disponivel,
    };

    try {
      setSubmitting(true);
      await criarExcecaoAgenda(payload);
      setModalExcecao(false);
      await carregarExcecoes(funcId);
      alerta.sucesso(
        tipo.disponivel
          ? "Liberação excepcional cadastrada."
          : "Folga registrada na agenda do profissional.",
      );
    } catch (err) {
      console.error("Erro ao criar exceção", err);
      const msg = err.response?.data?.mensagem || err.response?.data?.message || "Não foi possível registrar a folga.";
      alerta.erro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcluirExcecao = async (excecao) => {
    const ok = await alerta.confirmar(
      `Remover a ${excecao.disponivel ? "liberação" : "folga"} de ${formatarDataExcecao(excecao.data)}?`,
      { titulo: "Remover exceção", variante: "danger" },
    );
    if (!ok) return;

    try {
      await excluirExcecaoAgenda(excecao.id);
      await carregarExcecoes(selectedFuncionario?.funcionarioId ?? funcionarioId);
      alerta.sucesso("Exceção removida.");
    } catch (err) {
      console.error("Erro ao excluir exceção", err);
      alerta.erro("Não foi possível remover a exceção.");
    }
  };

  // Mapeamento correto MySQL DAYOFWEEK: 1=Domingo, 2=Segunda, 3=Terça, 4=Quarta, 5=Quinta, 6=Sexta, 7=Sábado
  const diasSemanaMap = [
    { id: 1, nome: "Domingo" },
    { id: 2, nome: "Segunda-feira" },
    { id: 3, nome: "Terça-feira" },
    { id: 4, nome: "Quarta-feira" },
    { id: 5, nome: "Quinta-feira" },
    { id: 6, nome: "Sexta-feira" },
    { id: 7, nome: "Sábado" },
  ];

  const diasCurtoMap = {
    1: "dom",
    2: "seg",
    3: "ter",
    4: "qua",
    5: "qui",
    6: "sex",
    7: "sab",
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Disponibilidade" showNav={true} onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        
        {selectedFuncionario ? (
          /* Tela 2: Visualização específica do funcionário */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {gerenciaTodos && (
                <button
                  type="button"
                  onClick={() => setSelectedFuncionario(null)}
                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#333E33] shadow-xs hover:bg-gray-50 transition"
                >
                  <ChevronLeft size={18} /> Voltar à lista de funcionários
                </button>
              )}

              <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={abrirJornadaExcecao}
                className="flex items-center gap-2 rounded-xl border border-[#333E33]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#333E33] shadow-xs hover:bg-gray-50 transition"
              >
                <CalendarOff size={16} /> Adicionar folga
              </button>
              <button
                type="button"
                onClick={() => {
                  setFuncionarioId(selectedFuncionario.funcionarioId);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-[#333E33] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#252E25] transition"
              >
                <Plus size={18} /> Adicionar horário
              </button>
            </div>
          </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-8 shadow-sm">
              <div className="mb-6 border-b border-gray-100 pb-4">
                <h1 className="font-heading text-2xl font-bold text-[#333E33]">{selectedFuncionario.funcionarioNome}</h1>
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mt-1">
                  Especialidade: {selectedFuncionario.especialidadePrincipal || "Geral"}
                </p>
              </div>

              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map((dId) => {
                  const turnosDoDia = (selectedFuncionario.agendas || []).filter((ag) => ag.diaSemana === dId);

                  return (
                    <div key={dId} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition hover:bg-gray-50">
                      <div className="w-28 uppercase font-bold text-xs tracking-wider text-[#333E33]">
                        {diasCurtoMap[dId]}
                      </div>
                      <div className="flex-1 flex flex-wrap items-center gap-2 my-2 sm:my-0">
                        {turnosDoDia.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">Nenhum horário cadastrado</span>
                        ) : (
                          turnosDoDia.map((turno) => (
                            <div key={turno.id} className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#333E33] shadow-2xs">
                              <Clock size={14} className="text-brand-primary" />
                              <span>{turno.horaInicio} — {turno.horaFim}</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(turno.id)}
                                title="Remover turno"
                                className="ml-1 text-gray-400 hover:text-status-cancelado transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Folgas, bloqueios e liberações excepcionais */}
            <div className="rounded-[24px] border border-gray-200 bg-white p-8 shadow-sm">
              <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="font-heading text-lg font-bold text-[#333E33]">
                    Folgas e exceções
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Dias indisponíveis, bloqueios de período e liberações extras deste profissional.
                  </p>
                </div>
              </div>

              {excecoes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                  Nenhuma folga ou exceção cadastrada.
                </p>
              ) : (
                <ul className="space-y-2">
                  {excecoes.map((exc) => (
                    <li
                      key={exc.id}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                        exc.disponivel
                          ? "border-status-confirmado/30 bg-status-confirmado/5"
                          : "border-status-cancelado/30 bg-status-cancelado/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={exc.disponivel ? "text-status-confirmado" : "text-status-cancelado"}>
                          {exc.disponivel ? <CalendarCheck size={18} /> : <CalendarOff size={18} />}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#333E33]">
                            {formatarDataExcecao(exc.data)}
                            <span className="ml-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                              {ROTULO_TIPO_EXCECAO[exc.disponivel ? "liberacao" : (exc.horaInicio ? "periodo" : "folga")]}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {exc.horaInicio && exc.horaFim
                              ? `Das ${exc.horaInicio} às ${exc.horaFim}`
                              : "Dia inteiro"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExcluirExcecao(exc)}
                        title="Remover exceção"
                        className="text-gray-400 transition hover:text-status-cancelado"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          /* Tela 1: Cada funcionário com seu horário padrão (Resumo) */
          <div>
            <ManagementHeader
              title="Disponibilidade"
              subtitle={gerenciaTodos ? "JORNADA: SELECIONE UM FUNCIONÁRIO" : "SUA DISPONIBILIDADE"}
              buttonText={gerenciaTodos ? "Novo horário geral" : undefined}
              onButtonClick={() => setIsModalOpen(true)}
            />

            {loading ? (
              <div className="py-20 text-center text-sm text-gray-400">Carregando disponibilidades...</div>
            ) : agendasVisiveis.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
                Nenhuma disponibilidade cadastrada. Clique em "Novo horário geral" para começar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agendas.map((item) => (
                  <div
                    key={item.funcionarioId}
                    onClick={() => setSelectedFuncionario(item)}
                    className="group cursor-pointer rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm transition hover:border-[#333E33] hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#333E33]/5 text-[#333E33] flex items-center justify-center font-bold">
                          <User size={20} />
                        </div>
                        <span className="text-xs font-semibold text-gray-400 group-hover:text-[#333E33] transition">
                          Ver detalhes →
                        </span>
                      </div>
                      <h3 className="font-heading text-lg font-bold text-[#333E33]">{item.funcionarioNome}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{item.especialidadePrincipal || "Geral"}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {item.agendas && item.agendas.length > 0 ? (
                        item.agendas.map((ag, idx) => (
                          <span key={idx} className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-[#333E33]">
                            {diasCurtoMap[ag.diaSemana]}: {ag.horaInicio}-{ag.horaFim}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sem horários definidos</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de cadastro de horário */}
        <BaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Novo Horário de Disponibilidade"
          subtitle="CONFIGURAR TURNO"
          confirmText="Salvar turno"
          onConfirm={handleCreate}
          loading={submitting}
        >
          <div className="space-y-4">
            {!selectedFuncionario && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Funcionário</label>
                <select
                  value={funcionarioId}
                  onChange={(e) => setFuncionarioId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#333E33] outline-none focus:border-[#333E33] transition"
                >
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} ({f.cargo})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Dia da Semana</label>
              <select
                value={diaSemana}
                onChange={(e) => setDiaSemana(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#333E33] outline-none focus:border-[#333E33] transition"
              >
                {diasSemanaMap.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </div>

            <FloatingInput
              label="Hora Início (HH:mm)"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
            />
            <FloatingInput
              label="Hora Fim (HH:mm)"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
            />
          </div>
        </BaseModal>

        {/* Jornada de folgas / exceções */}
        <BaseModal
          isOpen={modalExcecao}
          onClose={() => setModalExcecao(false)}
          title={`Folga e exceção — passo ${excecaoStep} de 3`}
          subtitle={
            excecaoStep === 1
              ? "1. ESCOLHA O TIPO"
              : excecaoStep === 2
                ? "2. ESCOLHA A DATA"
                : "3. CONFIRMAR"
          }
          showFooter={false}
        >
          <div className="space-y-5">
            {excecaoStep === 1 && (
              <div className="space-y-2.5">
                {TIPOS_EXCECAO.map((tipo) => {
                  const Icone = tipo.icone;
                  const ativo = excecaoTipo === tipo.id;

                  return (
                    <button
                      key={tipo.id}
                      type="button"
                      onClick={() => setExcecaoTipo(tipo.id)}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                        ativo
                          ? "border-brand-primary bg-brand-bg"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span className={ativo ? "text-brand-primary" : "text-gray-400"}>
                        <Icone size={20} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-[#333E33]">
                          {tipo.titulo}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">{tipo.descricao}</span>
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setExcecaoStep(2)}
                  className="mt-2 w-full rounded-xl bg-[#333E33] py-3.5 text-sm font-semibold text-white transition hover:bg-[#252E25]"
                >
                  Escolher a data →
                </button>
              </div>
            )}

            {excecaoStep === 2 && (
              <div className="space-y-4">
                <CalendarioMensal
                  mesRef={excecaoMesRef}
                  onMudarMes={setExcecaoMesRef}
                  dataSel={excecaoData}
                  onSelecionarDia={setExcecaoData}
                />

                {tipoAceitaHorario(excecaoTipo) && (
                  <div className="grid grid-cols-2 gap-3">
                    <FloatingInput
                      label="Hora Início"
                      type="time"
                      value={excecaoHoraInicio}
                      onChange={(e) => setExcecaoHoraInicio(e.target.value)}
                    />
                    <FloatingInput
                      label="Hora Fim"
                      type="time"
                      value={excecaoHoraFim}
                      onChange={(e) => setExcecaoHoraFim(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setExcecaoStep(1)}
                    className="w-1/2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-[#333E33] hover:bg-gray-50 transition"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!excecaoData) {
                        alerta.aviso("Escolha a data no calendário.");
                        return;
                      }
                      if (tipoAceitaHorario(excecaoTipo) && excecaoHoraInicio >= excecaoHoraFim) {
                        alerta.aviso("A hora de início deve ser anterior à de fim.");
                        return;
                      }
                      setExcecaoStep(3);
                    }}
                    className="w-1/2 rounded-xl bg-[#333E33] py-3.5 text-sm font-semibold text-white transition hover:bg-[#252E25]"
                  >
                    Revisar →
                  </button>
                </div>
              </div>
            )}

            {excecaoStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-[#333E33]">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Profissional</span>
                    <span className="font-semibold">
                      {selectedFuncionario?.funcionarioNome ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Tipo</span>
                    <span className="font-semibold">
                      {TIPOS_EXCECAO.find((t) => t.id === excecaoTipo)?.titulo}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Data</span>
                    <span className="font-semibold">{formatarDataExcecao(excecaoData)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Horário</span>
                    <span className="font-semibold">
                      {tipoAceitaHorario(excecaoTipo)
                        ? `${excecaoHoraInicio} às ${excecaoHoraFim}`
                        : "Dia inteiro"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setExcecaoStep(2)}
                    className="w-1/2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-[#333E33] hover:bg-gray-50 transition"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCriarExcecao}
                    className="w-1/2 rounded-xl bg-[#333E33] py-3.5 text-sm font-semibold text-white transition hover:bg-[#252E25] disabled:opacity-50"
                  >
                    {submitting ? "Salvando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default DisponibilidadeEquipe;

import { api } from "../provider/api";

/* ------------------------------------------------------------------ */
/* Disponibilidade — cálculo feito no back-end                         */
/* ------------------------------------------------------------------ */

/**
 * GET /disponibilidade/calendario?mes=yyyy-MM
 * Retorna DiaDisponivelDto[]: { data, status }
 * status esperado do back-end (ajuste os valores aqui se o enum real for outro):
 * "DISPONIVEL" | "POUCAS_VAGAS" | "INDISPONIVEL" | "PASSADO"
 */
export async function consultarCalendario(mesISO) {
  const { data } = await api.get("/disponibilidade/calendario", { params: { mes: mesISO } });
  return data;
}

/**
 * GET /disponibilidade/horarios?data=yyyy-MM-dd
 * Retorna HorarioDisponivelDto[]: { horario, disponivel }
 */
export async function consultarHorarios(dataISO) {
  const { data } = await api.get("/disponibilidade/horarios", { params: { data: dataISO } });
  return data;
}

/**
 * GET /disponibilidade/salas?inicio=&fim= (ISO date-time)
 * Retorna SalaDisponibilidadeDto[]: { id, descricao, ocupada }
 */
export async function consultarSalas(inicioISO, fimISO) {
  const { data } = await api.get("/disponibilidade/salas", { params: { inicio: inicioISO, fim: fimISO } });
  return data;
}

/* ------------------------------------------------------------------ */
/* Agendamentos                                                        */
/* ------------------------------------------------------------------ */

/** GET /agendamentos/meus/{clienteId} */
export async function listarAgendamentosDoCliente(clienteId) {
  const { data } = await api.get(`/agendamentos/meus/${clienteId}`);
  return data;
}

/** GET /agendamentos?inicio=&fim=&statusId= (todos os filtros opcionais) */
export async function listarAgendamentos({ inicio, fim, statusId } = {}) {
  const { data } = await api.get("/agendamentos", { params: { inicio, fim, statusId } });
  return data;
}

/**
 * POST /agendamentos
 * servicoId é opcional: o cliente reserva só o horário, a clínica define o
 * serviço depois (via atualizarAgendamento). statusId 1 = "Agendado".
 */
export async function criarAgendamento({ dataHoraInicio, dataHoraFim, observacao, clienteId, funcionarioId, salaId, servicoId, statusId = 5 }) {
  const { data } = await api.post("/agendamentos", {
    dataHoraInicio,
    dataHoraFim,
    observacao,
    clienteId,
    funcionarioId,
    salaId,
    servicoId,
    statusId,
  });
  return data;
}

/** PUT /agendamentos/{id} — usado tanto para mudar status quanto para a clínica definir o serviço. */
export async function atualizarAgendamento(id, payload) {
  const { data } = await api.put(`/agendamentos/${id}`, payload);
  return data;
}

export async function atualizarStatusAgendamento(id, statusId) {
  return atualizarAgendamento(id, { statusId });
}

/** DELETE /agendamentos/{id} */
export async function excluirAgendamento(id) {
  await api.delete(`/agendamentos/${id}`);
}

/* ------------------------------------------------------------------ */
/* Cadastros de apoio                                                   */
/* ------------------------------------------------------------------ */

export async function listarServicos() {
  const { data } = await api.get("/servicos");
  return data;
}

export async function listarSalas() {
  const { data } = await api.get("/salas");
  return data;
}

export async function listarFuncionarios() {
  const { data } = await api.get("/funcionarios");
  return data;
}

export async function listarEspecialidades() {
  const { data } = await api.get("/especialidades");
  return data;
}

export async function listarStatus() {
  const { data } = await api.get("/status");
  return data;
}

export async function listarClientes() {
  const { data } = await api.get("/clientes");
  return data;
}

export async function buscarCliente(id) {
  const { data } = await api.get(`/clientes/${id}`);
  return data;
}

/* ------------------------------------------------------------------ */
/* Agenda semanal / exceções dos funcionários                          */
/* ------------------------------------------------------------------ */

export async function listarAgendaPorFuncionario(funcionarioId) {
  const { data } = await api.get(`/agenda-funcionario/${funcionarioId}`);
  return data;
}

export async function listarTodasAgendas() {
  const { data } = await api.get("/agenda-funcionario");
  return data;
}

export async function listarExcecoesPorFuncionario(funcionarioId) {
  const { data } = await api.get(`/agenda-funcionario/${funcionarioId}/excecoes`);
  return data;
}

export async function criarExcecaoAgenda(payload) {
  const { data } = await api.post("/agenda-funcionario/excecoes", payload);
  return data;
}

export async function excluirExcecaoAgenda(id) {
  await api.delete(`/agenda-funcionario/excecoes/${id}`);
}

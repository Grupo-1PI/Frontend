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
export async function consultarCalendario(mesISO, servicoId, funcionarioId) {
  const { data } = await api.get("/disponibilidade/calendario", { params: { mes: mesISO, servicoId, funcionarioId } });
  return data;
}

/**
 * GET /disponibilidade/horarios?data=yyyy-MM-dd
 * Retorna HorarioDisponivelDto[]: { horario, disponivel }
 */
export async function consultarHorarios(dataISO, servicoId, funcionarioId) {
  const { data } = await api.get("/disponibilidade/horarios", { params: { data: dataISO, servicoId, funcionarioId } });
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

/**
 * GET /agendamentos?inicio=&fim=&statusId=&page=&size= (filtros opcionais)
 * Retorna a página paginada do back-end:
 * { content, page, size, totalElements, totalPages, first, last }
 */
export async function listarAgendamentos({ inicio, fim, statusId, page = 0, size = 500 } = {}) {
  const { data } = await api.get("/agendamentos", { params: { inicio, fim, statusId, page, size } });
  return data;
}

/**
 * Agrega todas as páginas de um período e devolve uma lista simples.
 * Os consumidores da agenda continuam recebendo `Agendamento[]`.
 */
export async function listarAgendamentosDoPeriodo({ inicio, fim, statusId } = {}) {
  const size = 500;
  const limitePaginas = 50;
  const itens = [];
  let page = 0;
  let totalPages = 1;

  do {
    const resposta = await listarAgendamentos({ inicio, fim, statusId, page, size });

    if (Array.isArray(resposta)) {
      itens.push(...resposta);
      break;
    }

    itens.push(...(resposta?.content ?? []));
    totalPages = resposta?.totalPages ?? 1;
    page += 1;
  } while (page < totalPages && page < limitePaginas);

  return itens;
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
  const { data } = await api.patch(`/agendamentos/${id}/status`, null, { params: { statusId } });
  return data;
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

export async function listarFuncionariosPorServico(servicoId) {
  const { data } = await api.get("/disponibilidade/funcionarios", { params: { servicoId } });
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

/* ------------------------------------------------------------------ */
/* Cargos e Permissões                                                */
/* ------------------------------------------------------------------ */

export async function listarCargos() {
  const { data } = await api.get("/cargos");
  return data;
}

export async function criarCargo(payload) {
  const { data } = await api.post("/cargos", payload);
  return data;
}

export async function atualizarCargo(id, payload) {
  const { data } = await api.put(`/cargos/${id}`, payload);
  return data;
}

export async function deletarCargo(id) {
  await api.delete(`/cargos/${id}`);
}

export async function listarPermissoes() {
  const { data } = await api.get("/permissoes");
  return data;
}

/* ------------------------------------------------------------------ */
/* Salas CRUD                                                         */
/* ------------------------------------------------------------------ */

export async function criarSala(payload) {
  const { data } = await api.post("/salas", payload);
  return data;
}

export async function atualizarSala(id, payload) {
  const { data } = await api.put(`/salas/${id}`, payload);
  return data;
}

export async function deletarSala(id) {
  await api.delete(`/salas/${id}`);
}

/* ------------------------------------------------------------------ */
/* Serviços CRUD                                                      */
/* ------------------------------------------------------------------ */

export async function criarServico(payload) {
  const { data } = await api.post("/servicos", payload);
  return data;
}

export async function atualizarServico(id, payload) {
  const { data } = await api.put(`/servicos/${id}`, payload);
  return data;
}

export async function deletarServico(id) {
  await api.delete(`/servicos/${id}`);
}

/* ------------------------------------------------------------------ */
/* Especialidades CRUD                                                */
/* ------------------------------------------------------------------ */

export async function criarEspecialidade(payload) {
  const { data } = await api.post("/especialidades", payload);
  return data;
}

export async function atualizarEspecialidade(id, payload) {
  const { data } = await api.put(`/especialidades/${id}`, payload);
  return data;
}

export async function deletarEspecialidade(id) {
  await api.delete(`/especialidades/${id}`);
}

/* ------------------------------------------------------------------ */
/* Funcionários CRUD                                                  */
/* ------------------------------------------------------------------ */

export async function criarFuncionario(payload) {
  const { data } = await api.post("/funcionarios", payload);
  return data;
}

export async function atualizarFuncionario(id, payload) {
  const { data } = await api.put(`/funcionarios/${id}`, payload);
  return data;
}

export async function deletarFuncionario(id) {
  await api.delete(`/funcionarios/${id}`);
}

/* ------------------------------------------------------------------ */
/* Agenda Funcionários CRUD                                           */
/* ------------------------------------------------------------------ */

export async function criarAgendaFuncionario(payload) {
  const { data } = await api.post("/agenda-funcionario", payload);
  return data;
}

export async function atualizarAgendaFuncionario(id, payload) {
  const { data } = await api.put(`/agenda-funcionario/${id}`, payload);
  return data;
}

export async function deletarAgendaFuncionario(id) {
  await api.delete(`/agenda-funcionario/${id}`);
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                          */
/* ------------------------------------------------------------------ */

export async function consultarDashboard(inicio, fim) {
  const [totalAgendamentos, servicos, agendamentosDiaSemana, cancelamentos, clientesAtivos, clientesNovos] = await Promise.all([
    api.get("/dashboard/total-agendamentos", { params: { inicio, fim } }).then(res => res.data),
    api.get("/dashboard/servicos", { params: { inicio, fim } }).then(res => res.data),
    api.get("/dashboard/agendamentos-dia-semana", { params: { inicio, fim } }).then(res => res.data),
    api.get("/dashboard/cancelamentos", { params: { inicio, fim } }).then(res => res.data),
    api.get("/dashboard/clientes-ativos", { params: { inicio, fim } }).then(res => res.data),
    api.get("/dashboard/clientes-novos", { params: { inicio } }).then(res => res.data),
  ]);
  return {
    totalAgendamentos,
    servicos,
    agendamentosDiaSemana,
    cancelamentos,
    clientesAtivos,
    clientesNovos,
  };
}

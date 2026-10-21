import { api } from "../provider/api";

async function consultar(rota, inicio, fim, signal) {
  try {
    const { data } = await api.get(`/dashboard/${rota}`, { params: { inicio, fim }, signal });
    return data;
  } catch (erro) {
    if (signal?.aborted || erro.code === "ERR_CANCELED" || [401, 403].includes(erro.response?.status)) {
      throw erro;
    }
    return null;
  }
}

async function indicadores(inicio, fim, signal) {
  const rotas = { total: "total-agendamentos", cancelamentos: "cancelamentos", ativos: "clientes-ativos", novos: "novos-pacientes" };
  const valores = await Promise.all(Object.entries(rotas).map(async ([chave, rota]) => {
    const valor = await consultar(rota, inicio, fim, signal);
    return [chave, valor];
  }));
  return Object.fromEntries(valores);
}

export async function carregarDashboard(periodo, signal) {
  const inicio = new Date(periodo.inicio + "T12:00:00Z");
  const dias = Math.round((new Date(periodo.fim + "T12:00:00Z") - inicio) / 86400000) + 1;
  const anteriorFim = new Date(inicio.getTime() - 86400000).toISOString().slice(0, 10);
  const anteriorInicio = new Date(inicio.getTime() - dias * 86400000).toISOString().slice(0, 10);
  const [atual, anterior, servicos, semana, retorno] = await Promise.all([
    indicadores(periodo.inicio, periodo.fim, signal),
    indicadores(anteriorInicio, anteriorFim, signal),
    consultar("servicos", periodo.inicio, periodo.fim, signal),
    consultar("agendamentos-dia-semana", periodo.inicio, periodo.fim, signal),
    consultar("retorno-pacientes", periodo.inicio, periodo.fim, signal),
  ]);

  if (Object.values(atual).every(valor => valor === null) && servicos === null && semana === null) {
    throw new Error("Não foi possível carregar os indicadores.");
  }

  return { atual, anterior, servicos, semana, retorno };
}

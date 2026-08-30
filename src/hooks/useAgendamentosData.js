import { useCallback, useEffect, useState } from "react";
import { api } from "../provider/api";

/**
 * Carrega e mantém em memória os dados-base do módulo de agendamentos
 * (serviços, salas, funcionários, clientes, exceções de agenda e status)
 * e a lista de agendamentos, com helpers para criar/atualizar via json-server.
 *
 * Uso: const { data, loading, error, criarAgendamento, atualizarStatusAgendamento } = useAgendamentosData();
 */
export function useAgendamentosData() {
  const [data, setData] = useState({
    servicos: [],
    salas: [],
    funcionarios: [],
    clientes: [],
    agendaExcecoes: [],
    status: [],
    agendamentos: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregarTudo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [servicos, salas, funcionarios, clientes, agendaExcecoes, status, agendamentos] = await Promise.all([
        api.get("/servicos").then((r) => r.data),
        api.get("/salas").then((r) => r.data),
        api.get("/funcionarios").then((r) => r.data),
        api.get("/clientes").then((r) => r.data),
        api.get("/agendaExcecoes").then((r) => r.data),
        api.get("/status").then((r) => r.data),
        api.get("/agendamentos").then((r) => r.data),
      ]);
      setData({ servicos, salas, funcionarios, clientes, agendaExcecoes, status, agendamentos });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  const criarAgendamento = useCallback(async (novoAgendamento) => {
    const { data: criado } = await api.post("/agendamentos", novoAgendamento);
    setData((prev) => ({ ...prev, agendamentos: [...prev.agendamentos, criado] }));
    return criado;
  }, []);

  const atualizarStatusAgendamento = useCallback(async (id, fkStatus) => {
    const { data: atualizado } = await api.patch(`/agendamentos/${id}`, { fkStatus });
    setData((prev) => ({
      ...prev,
      agendamentos: prev.agendamentos.map((a) => (a.id === id ? atualizado : a)),
    }));
    return atualizado;
  }, []);

  return {
    data,
    loading,
    error,
    recarregar: carregarTudo,
    criarAgendamento,
    atualizarStatusAgendamento,
  };
}

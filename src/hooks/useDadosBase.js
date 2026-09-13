import { useCallback, useEffect, useState } from "react";
import { listarServicos, listarSalas, listarFuncionarios, listarStatus } from "../services/agendamentos";

/**
 * Carrega os dados-base cadastrais (serviços, salas, funcionários, status)
 * usados para exibir nomes/preços/descrições ao lado dos agendamentos.
 * Agendamentos em si e disponibilidade são buscados pelas próprias páginas,
 * via services/agendamentos.js, porque dependem de filtros (cliente, data, mês).
 */
export function useDadosBase() {
  const [servicos, setServicos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [servicosRes, salasRes, funcionariosRes, statusRes] = await Promise.all([
        listarServicos(),
        listarSalas(),
        listarFuncionarios(),
        listarStatus(),
      ]);
      setServicos(servicosRes);
      setSalas(salasRes);
      setFuncionarios(funcionariosRes);
      setStatus(statusRes);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { servicos, salas, funcionarios, status, loading, error, recarregar: carregar };
}

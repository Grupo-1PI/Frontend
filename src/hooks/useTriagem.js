import { useState, useCallback } from "react";
import { iniciarTriagem, responderTriagem } from "../services/agendamentos";

export function useTriagem() {
  const [estado, setEstado] = useState("inicio"); // inicio | pergunta | resultado | erro
  const [perguntaAtual, setPerguntaAtual] = useState(null);
  const [especialidadeRecomendada, setEspecialidadeRecomendada] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const iniciar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const pergunta = await iniciarTriagem();
      setPerguntaAtual(pergunta);
      setHistorico([pergunta]);
      setEstado("pergunta");
    } catch {
      setErro("Não foi possível iniciar a triagem. Tente novamente.");
      setEstado("erro");
    } finally {
      setCarregando(false);
    }
  }, []);

  const responder = useCallback(async (resposta) => {
    if (!perguntaAtual) return;
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await responderTriagem(perguntaAtual.id, resposta);
      if (resultado.proxima) {
        setPerguntaAtual(resultado.proxima);
        setHistorico((h) => [...h, resultado.proxima]);
        setEstado("pergunta");
      } else if (resultado.especialidade) {
        setEspecialidadeRecomendada(resultado.especialidade);
        setEstado("resultado");
      }
    } catch {
      setErro("Erro ao processar resposta. Tente novamente.");
      setEstado("erro");
    } finally {
      setCarregando(false);
    }
  }, [perguntaAtual]);

  const voltar = useCallback(() => {
    if (historico.length <= 1) return;
    const novoHistorico = historico.slice(0, -1);
    setHistorico(novoHistorico);
    setPerguntaAtual(novoHistorico[novoHistorico.length - 1]);
    setEstado("pergunta");
  }, [historico]);

  const reiniciar = useCallback(() => {
    setEstado("inicio");
    setPerguntaAtual(null);
    setEspecialidadeRecomendada(null);
    setHistorico([]);
    setErro(null);
  }, []);

  return {
    estado,
    perguntaAtual,
    especialidadeRecomendada,
    historico,
    carregando,
    erro,
    iniciar,
    responder,
    voltar,
    reiniciar,
  };
}
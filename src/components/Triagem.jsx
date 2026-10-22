import { useTriagem } from "../hooks/useTriagem";
import { HelpCircle, ArrowLeft, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export function Triagem({ onConcluir, onVoltar, onCancelar }) {
  const {
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
  } = useTriagem();

  if (estado === "inicio") {
    return (
      <div className="triagem-inicio min-h-screen bg-brand-bg flex items-center justify-center p-5">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <Sparkles size={28} />
            </div>
          </div>
          <h2 className="font-heading text-2xl font-semibold text-brand-text">Triagem de Especialidade</h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-brand-muted">
            Responda algumas perguntas rápidas para que possamos recomendar a especialidade
            mais adequada para o seu atendimento.
          </p>
          <div className="mt-8 space-y-3">
            <button
              onClick={iniciar}
              disabled={carregando}
              className="btn-login w-full"
            >
              {carregando ? "Carregando..." : "Sim, quero fazer a triagem"}
            </button>
            <button
              onClick={onVoltar}
              className="w-full rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
            >
              Não, quero escolher o serviço direto
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (estado === "erro") {
    return (
      <div className="triagem-erro min-h-screen bg-brand-bg flex items-center justify-center p-5">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 flex items-center justify-center gap-3 text-status-cancelado">
            <HelpCircle size={28} />
            <span className="font-semibold">Erro na triagem</span>
          </div>
          <p className="text-[13.5px] text-brand-muted">{erro}</p>
          <div className="mt-6 flex gap-3">
            <button onClick={iniciar} className="btn-login flex-1">
              Tentar novamente
            </button>
            <button
              onClick={onVoltar}
              className="flex-1 rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
            >
              Voltar e escolher serviço direto
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (estado === "resultado") {
    return (
      <div className="triagem-resultado min-h-screen bg-brand-bg flex items-center justify-center p-5">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-status-confirmado/10 text-status-confirmado">
              <CheckCircle2 size={28} />
            </div>
          </div>
          <h2 className="font-heading text-center text-2xl font-semibold text-brand-text">
            Especialidade Recomendada
          </h2>
          <div className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-5 text-center">
            <div className="font-heading text-xl font-semibold text-brand-text">
              {especialidadeRecomendada?.nome}
            </div>
            <p className="mt-2 text-[13.5px] text-brand-muted">
              Com base nas suas respostas, esta é a especialidade mais indicada para o seu caso.
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => onConcluir?.(especialidadeRecomendada)}
              className="btn-login flex-1"
            >
              Continuar com esta especialidade
            </button>
            <button
              onClick={reiniciar}
              className="flex-1 rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
            >
              Refazer triagem
            </button>
          </div>
        </div>
      </div>
    );
  }

  // estado === "pergunta"
  return (
    <div className="triagem-pergunta min-h-screen bg-brand-bg">
      <div className="mx-auto max-w-2xl px-5 py-10">
        {/* Progresso */}
        <div className="mb-6 flex items-center gap-2">
          {historico.map((p, i) => (
            <span
              key={p.id}
              className={`flex-1 h-1.5 rounded-full transition ${
                i === historico.length - 1
                  ? "bg-brand-primary"
                  : "bg-brand-border"
              }`}
            />
          ))}
        </div>

        {/* Pergunta */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-wide text-brand-muted">
            Pergunta {historico.length}
          </div>
          <h3 className="font-heading text-lg font-semibold text-brand-text">
            {perguntaAtual?.texto}
          </h3>
        </div>

        {/* Botões de resposta */}
        <div className="mt-6 grid gap-3">
          <button
            onClick={() => responder("SIM")}
            disabled={carregando}
            className="btn-login py-4 text-base"
          >
            {carregando ? <Loader2 size={20} className="animate-spin" /> : "Sim"}
          </button>
          <button
            onClick={() => responder("NAO")}
            disabled={carregando}
            className="rounded-xl border border-brand-border py-4 text-base font-semibold text-brand-text transition hover:border-brand-primary/50 hover:bg-brand-bg"
          >
            Não
          </button>
        </div>

        {/* Voltar */}
        {historico.length > 1 && (
          <button
            onClick={voltar}
            disabled={carregando}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        )}

        {onCancelar && (
          <button
            onClick={onCancelar}
            className="mt-3 w-full rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
          >
            Pular triagem e escolher serviço
          </button>
        )}
      </div>
    </div>
  );
}

export default Triagem;
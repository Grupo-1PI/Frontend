import { CheckCircle2, XCircle } from "lucide-react";

/**
 * Lista de folgas/liberações extras de um funcionário. O funcionário é
 * escolhido no próprio componente (select); os dados de exceção são
 * buscados em AgendaEquipe.jsx e passados prontos aqui.
 */
function AbaExcecoes({ funcionarios, funcionarioSelecionado, onSelecionarFuncionario, excecoes, loading }) {
  return (
    <div>
      <h2 className="font-heading mb-1 text-lg font-semibold text-brand-text">Folgas e horários especiais</h2>
      <p className="mb-5 text-sm text-brand-muted">Selecione um profissional para ver seus bloqueios e liberações.</p>

      <select
        value={funcionarioSelecionado ?? ""}
        onChange={(e) => onSelecionarFuncionario(e.target.value ? Number(e.target.value) : null)}
        className="mb-5 rounded-lg border border-brand-border bg-brand-surface px-3.5 py-2 text-[13px] font-medium text-brand-text"
      >
        <option value="">Selecione um profissional...</option>
        {funcionarios.map((f) => (
          <option key={f.id} value={f.id}>{f.nome}</option>
        ))}
      </select>

      {loading ? (
        <div className="py-6 text-center text-sm text-brand-muted">Carregando...</div>
      ) : funcionarioSelecionado && excecoes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface py-10 text-center text-sm text-brand-muted">
          Nenhuma exceção registrada para este profissional.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {excecoes.map((exc) => (
            <div key={exc.id} className="flex items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                  exc.disponivel ? "bg-status-confirmado/10 text-status-confirmado" : "bg-status-cancelado/10 text-status-cancelado"
                }`}
              >
                {exc.disponivel ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              </div>
              <div>
                <div className="text-sm font-semibold text-brand-text">
                  {new Date(exc.data + "T00:00").toLocaleDateString("pt-BR")}
                </div>
                <div className="text-xs text-brand-muted">
                  {exc.horaInicio ? `${exc.horaInicio} – ${exc.horaFim}` : "Dia todo"} ·{" "}
                  {exc.disponivel ? "Horário extra liberado" : "Indisponível"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AbaExcecoes;

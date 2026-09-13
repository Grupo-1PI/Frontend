import { Calendar, Clock, MapPin } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDateBR, extrairData, extrairHora } from "../utils/agenda";

/**
 * agendamento segue o schema AgendamentoResponseDto:
 * { id, dataHoraInicio, dataHoraFim, observacao, clienteNome,
 *   funcionarios: string[], salaDescricao, servicos: string[], statusNome }
 */
function CardAgendamentoCliente({ agendamento, onCancelar, historico }) {
  const nomeServico = agendamento.servicos?.[0] || "Procedimento a definir";
  const nomeFuncionario = agendamento.funcionarios?.[0];
  const podeCancel = !historico && (agendamento.statusNome || "").toLowerCase() !== "cancelado";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-brand-text">{nomeServico}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted">
          <span className="flex items-center gap-1">
            <Calendar size={13} /> {formatDateBR(extrairData(agendamento.dataHoraInicio))}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} /> {extrairHora(agendamento.dataHoraInicio)} – {extrairHora(agendamento.dataHoraFim)}
          </span>
          {agendamento.salaDescricao && (
            <span className="flex items-center gap-1">
              <MapPin size={13} /> {agendamento.salaDescricao}
            </span>
          )}
        </div>
        {nomeFuncionario && <div className="mt-1 text-xs text-brand-muted">com {nomeFuncionario}</div>}
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <StatusBadge statusNome={agendamento.statusNome} />
        {podeCancel && onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="text-xs font-semibold text-status-cancelado hover:underline"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

export default CardAgendamentoCliente;

import { Calendar, Clock, MapPin } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDateBR } from "../utils/agenda";

function CardAgendamentoCliente({ agendamento, servico, funcionario, sala, onCancelar, historico }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-brand-text">{servico?.nome}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted">
          <span className="flex items-center gap-1">
            <Calendar size={13} /> {formatDateBR(agendamento.data)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} /> {agendamento.hora_inicio} – {agendamento.hora_fim}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={13} /> {sala?.descricao}
          </span>
        </div>
        {funcionario && <div className="mt-1 text-xs text-brand-muted">com {funcionario.nome}</div>}
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <StatusBadge fkStatus={agendamento.fkStatus} />
        {!historico && agendamento.fkStatus !== 3 && onCancelar && (
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

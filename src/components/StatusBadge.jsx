const CLASSES_POR_STATUS = {
  agendado: "bg-status-agendado/10 text-status-agendado",
  confirmado: "bg-status-confirmado/10 text-status-confirmado",
  cancelado: "bg-status-cancelado/10 text-status-cancelado",
  finalizado: "bg-status-finalizado/10 text-status-finalizado",
};

/**
 * Recebe o nome do status como veio da API (AgendamentoResponseDto.statusNome,
 * ex.: "Agendado", "Confirmado"). Normaliza para minúsculo/sem acento para
 * bater com as chaves acima independente de como o back-end formatar.
 */
function StatusBadge({ statusNome }) {
  const chave = (statusNome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const classe = CLASSES_POR_STATUS[chave] ?? "bg-brand-border text-brand-muted";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${classe}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusNome || "—"}
    </span>
  );
}

export default StatusBadge;

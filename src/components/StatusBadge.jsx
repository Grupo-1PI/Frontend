const ESTILOS_STATUS = {
  1: { texto: "Agendado", classe: "bg-status-agendado/10 text-status-agendado" },
  2: { texto: "Confirmado", classe: "bg-status-confirmado/10 text-status-confirmado" },
  3: { texto: "Cancelado", classe: "bg-status-cancelado/10 text-status-cancelado" },
  4: { texto: "Finalizado", classe: "bg-status-finalizado/10 text-status-finalizado" },
};

function StatusBadge({ fkStatus }) {
  const estilo = ESTILOS_STATUS[fkStatus] ?? ESTILOS_STATUS[1];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${estilo.classe}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {estilo.texto}
    </span>
  );
}

export default StatusBadge;

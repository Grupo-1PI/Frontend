import { formatDiaCurto } from "../utils/agenda";

// Grade de horários exibida na agenda semanal. Ajuste conforme o expediente real da clínica.
export const HORARIOS_GRADE = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
export const HORARIO_INTERVALO_APOS = "11:00"; // exibe a faixa de intervalo logo depois deste horário

/**
 * Tabela semanal: colunas = dias (segunda a sexta), linhas = horários.
 * `grade` é um mapa "yyyy-MM-dd|HH:mm" -> agendamento[] (ver AgendaEquipe.jsx).
 */
function GradeSemanal({ dias, grade, onAbrirAgendamento }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-border bg-brand-surface">
      <table className="w-full min-w-[820px] border-collapse text-left">
        <thead>
          <tr className="bg-brand-primary text-white">
            <th className="w-24 px-4 py-3 text-[11px] font-bold uppercase tracking-wide">Horário</th>
            {dias.map((d) => {
              const { label, data } = formatDiaCurto(d);
              return (
                <th key={d} className="px-4 py-3 align-top">
                  <div className="text-sm font-bold">{label}</div>
                  <div className="text-[11px] font-medium text-white/75">{data}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {HORARIOS_GRADE.map((hora) => (
            <LinhaHorario key={hora} hora={hora} dias={dias} grade={grade} onAbrir={onAbrirAgendamento} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Uma linha de horário da grade (mais a linha de intervalo logo depois, quando aplicável). */
function LinhaHorario({ hora, dias, grade, onAbrir }) {
  return (
    <>
      <tr className="border-t border-brand-border">
        <td className="px-4 py-3 align-top text-sm font-bold text-brand-text">{hora}</td>
        {dias.map((d) => {
          const chave = `${d}|${hora}`;
          const agendamentosCelula = grade[chave] || [];
          return (
            <td key={chave} className="border-l border-brand-border p-2 align-top">
              <div className="flex flex-col gap-1.5">
                {agendamentosCelula.map((a) => (
                  <CardCelula key={a.id} agendamento={a} onClick={() => onAbrir(a)} />
                ))}
              </div>
            </td>
          );
        })}
      </tr>
      {hora === HORARIO_INTERVALO_APOS && (
        <tr className="border-t border-brand-border bg-brand-bg">
          <td colSpan={dias.length + 1} className="px-4 py-2 text-center text-[11px] font-bold tracking-[0.3em] text-brand-muted">
            INTERVALO
          </td>
        </tr>
      )}
    </>
  );
}

/** Card compacto exibido em cada célula da grade semanal. */
function CardCelula({ agendamento, onClick }) {
  const pendente = (agendamento.statusNome || "").toLowerCase() === "pendente";
  const nomeServico = agendamento.servicos?.[0] || "Procedimento a definir";
  const nomeSala = agendamento.salaDescricao;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border px-2.5 py-2 text-left transition hover:shadow-sm ${
        pendente ? "border-amber-300 bg-amber-50" : "border-brand-border bg-white"
      }`}
    >
      <div className="truncate text-[12.5px] font-bold uppercase text-brand-text">{agendamento.clienteNome}</div>
      <div className="truncate text-[11px] text-brand-muted">{nomeServico}</div>
      {nomeSala && <div className="truncate text-[10.5px] text-brand-muted">{nomeSala}</div>}
      {pendente && (
        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          Pendente
        </div>
      )}
    </button>
  );
}

export default GradeSemanal;

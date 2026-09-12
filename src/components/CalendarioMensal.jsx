import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  MESES_PT,
  DIAS_SEMANA_PT,
  addMonths,
  primeiroDiaDoMes,
  diasNoMes,
  classificarDiaCalendario,
} from "../utils/agenda";

/**
 * Calendário mensal de seleção de dia, com legenda de disponibilidade.
 * A disponibilidade de cada dia é calculada a partir dos funcionários aptos
 * ao serviço escolhido (soma dos horários livres de todos eles).
 */
function CalendarioMensal({
  mesRef,
  onMudarMes,
  dataSel,
  onSelecionarDia,
  funcionarios,
  duracaoMin,
  agendamentos,
  excecoes,
}) {
  const primeiroDia = primeiroDiaDoMes(mesRef);
  const offsetSemana = new Date(primeiroDia + "T00:00:00").getDay(); // 0=Dom
  const totalDias = diasNoMes(mesRef);
  const d = new Date(mesRef + "T00:00:00");
  const rotuloMes = `${MESES_PT[d.getMonth()]} ${d.getFullYear()}`;

  const celulas = [];
  for (let i = 0; i < offsetSemana; i++) celulas.push(null);
  for (let dia = 1; dia <= totalDias; dia++) {
    celulas.push(`${mesRef.slice(0, 8)}${String(dia).padStart(2, "0")}`);
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMudarMes(addMonths(mesRef, -1))}
          aria-label="Mês anterior"
          className="rounded-lg p-2 text-brand-primary transition hover:bg-brand-bg"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-heading text-base font-semibold text-brand-text">{rotuloMes}</div>
        <button
          type="button"
          onClick={() => onMudarMes(addMonths(mesRef, 1))}
          aria-label="Próximo mês"
          className="rounded-lg p-2 text-brand-primary transition hover:bg-brand-bg"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {DIAS_SEMANA_PT.map((dw) => (
          <div key={dw} className="py-1 text-center text-[11px] font-bold text-brand-muted">
            {dw}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celulas.map((dataISO, i) => {
          if (!dataISO) return <div key={`vazio-${i}`} />;

          const status = classificarDiaCalendario(dataISO, funcionarios, duracaoMin, agendamentos, excecoes);
          const isSel = dataISO === dataSel;
          const diaNum = Number(dataISO.slice(8, 10));
          const desabilitado = status === "passado" || status === "indisponivel";

          const classeBase =
            "relative aspect-square rounded-xl text-sm font-semibold transition flex items-center justify-center";
          let classeEstado = "text-brand-text hover:bg-brand-bg";
          if (isSel) {
            classeEstado = "bg-brand-primary text-white font-bold hover:bg-brand-primary";
          } else if (desabilitado) {
            classeEstado = "text-gray-300 cursor-not-allowed hover:bg-transparent";
          }

          return (
            <button
              key={dataISO}
              type="button"
              disabled={desabilitado}
              onClick={() => onSelecionarDia(dataISO)}
              title={
                status === "indisponivel"
                  ? "Indisponível"
                  : status === "poucas"
                  ? "Poucas vagas"
                  : status === "passado"
                  ? ""
                  : "Disponível"
              }
              className={`${classeBase} ${classeEstado}`}
            >
              {diaNum}
              {!isSel && status === "poucas" && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-2 border-t border-brand-border pt-4">
        <div className="mb-1 text-[11px] font-bold text-brand-muted">LEGENDA</div>
        <LegendaItem cor="bg-brand-primary border-brand-primary" texto="Selecionado" preenchido />
        <LegendaItem cor="border-brand-border" texto="Disponível" />
        <LegendaItem cor="border-brand-border" dot="bg-amber-500" texto="Poucas vagas" />
        <LegendaItem cor="border-gray-300" textoClasse="text-gray-400" texto="Indisponível" />
      </div>
    </div>
  );
}

function LegendaItem({ cor, dot, preenchido, texto, textoClasse = "text-brand-muted" }) {
  return (
    <div className={`flex items-center gap-2.5 text-[13px] ${textoClasse}`}>
      <span className={`relative h-4 w-4 flex-shrink-0 rounded-md border ${cor} ${preenchido ? "" : "bg-transparent"}`}>
        {dot && <span className={`absolute inset-0 m-auto h-1.5 w-1.5 rounded-full ${dot}`} />}
      </span>
      {texto}
    </div>
  );
}

export default CalendarioMensal;

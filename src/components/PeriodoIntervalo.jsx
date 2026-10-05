import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { addDiasISO, formatarPeriodoBR, paraDomingo, paraSabado } from "../utils/agenda";

/**
 * Seletor de intervalo de datas (pill + popover), como no layout:
 * "01/05/2026 - 30/05/2026  📅"
 *
 * O período SEMPRE é ajustado para domingo → sábado e limitado a
 * `maxSemanas` semanas, para a grade semanal continuar utilizável.
 */
export function PeriodoIntervalo({ periodo, onChange, maxSemanas = 8 }) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;

    const cliqueFora = (evento) => {
      if (containerRef.current && !containerRef.current.contains(evento.target)) {
        setAberto(false);
      }
    };
    const esc = (evento) => {
      if (evento.key === "Escape") setAberto(false);
    };

    document.addEventListener("mousedown", cliqueFora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", cliqueFora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const aplicar = (inicioDesejado, fimDesejado) => {
    if (!inicioDesejado) return;

    let inicio = paraDomingo(inicioDesejado);
    let fim = paraSabado(fimDesejado || inicioDesejado);

    if (fim < inicio) {
      fim = paraSabado(inicio);
    }

    const limite = paraSabado(addDiasISO(inicio, maxSemanas * 7 - 1));
    if (fim > limite) {
      fim = limite;
    }

    onChange({ inicio, fim });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-label="Período da agenda"
        aria-expanded={aberto}
        aria-haspopup="dialog"
        className="flex items-center gap-3 rounded-xl border border-[#333E33]/20 bg-white px-4 py-3 text-sm font-semibold text-[#333E33] shadow-sm transition hover:bg-gray-50"
      >
        {formatarPeriodoBR(periodo)}
        <CalendarDays size={16} className="text-gray-400" />
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Selecionar período"
          className="absolute left-0 z-30 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg"
        >
          <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            Período da agenda
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Início (domingo)
              <input
                type="date"
                value={periodo?.inicio ?? ""}
                onChange={(evento) => aplicar(evento.target.value, periodo?.fim)}
                className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm font-medium text-[#333E33] outline-none transition focus:border-[#333E33]"
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Fim (sábado)
              <input
                type="date"
                value={periodo?.fim ?? ""}
                onChange={(evento) => aplicar(periodo?.inicio, evento.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm font-medium text-[#333E33] outline-none transition focus:border-[#333E33]"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-400">Máx. {maxSemanas} semanas</span>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="rounded-lg bg-[#333E33] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#252E25]"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PeriodoIntervalo;

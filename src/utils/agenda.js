// Utilitários de data/horário usados pelo módulo de agendamentos.
// Datas são sempre strings "yyyy-mm-dd"; horários "HH:mm".

export const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const DIAS_SEMANA_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export function toMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMin(min) {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// dia_semana no padrão MySQL DAYOFWEEK: 1=Domingo ... 7=Sábado
export function dayOfWeekMySQL(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() + 1;
}

export function formatDateBR(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

export function formatDateLong(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function addMonths(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

export function primeiroDiaDoMes(dateStr) {
  return dateStr.slice(0, 8) + "01";
}

export function diasNoMes(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// Data "atual" fixada para manter a demo consistente com o db.json.
// Troque por `new Date().toISOString().slice(0, 10)` quando for para produção.
export function todayISO() {
  return "2026-08-29";
}

/**
 * Calcula os horários livres de um funcionário em um dia, considerando:
 * - a agenda semanal fixa do funcionário (funcionario.agenda)
 * - exceções pontuais (folgas / horários extras) daquele dia
 * - agendamentos já existentes (que não estejam cancelados)
 */
export function calcularSlotsLivres(funcionario, dataISO, duracaoMin, agendamentos, excecoes) {
  if (!funcionario) return [];
  const diaSemana = dayOfWeekMySQL(dataISO);
  const excecao = (excecoes || []).find((e) => e.fkFuncionario === funcionario.id && e.data === dataISO);

  let janelas = (funcionario.agenda || [])
    .filter((a) => a.dia_semana === diaSemana)
    .map((a) => ({ inicio: toMin(a.hora_inicio), fim: toMin(a.hora_fim) }));

  if (excecao) {
    if (excecao.hora_inicio === null && excecao.disponivel === false) {
      janelas = [];
    } else if (excecao.disponivel === false) {
      const exIni = toMin(excecao.hora_inicio);
      const exFim = toMin(excecao.hora_fim);
      const novas = [];
      janelas.forEach((j) => {
        if (exFim <= j.inicio || exIni >= j.fim) {
          novas.push(j);
        } else {
          if (exIni > j.inicio) novas.push({ inicio: j.inicio, fim: exIni });
          if (exFim < j.fim) novas.push({ inicio: exFim, fim: j.fim });
        }
      });
      janelas = novas;
    } else if (excecao.disponivel === true) {
      janelas.push({ inicio: toMin(excecao.hora_inicio), fim: toMin(excecao.hora_fim) });
    }
  }

  const ocupados = (agendamentos || [])
    .filter((a) => a.fkFuncionario === funcionario.id && a.data === dataISO && a.fkStatus !== 3)
    .map((a) => ({ inicio: toMin(a.hora_inicio), fim: toMin(a.hora_fim) }));

  const slots = [];
  const passo = 20;
  janelas.forEach((j) => {
    for (let t = j.inicio; t + duracaoMin <= j.fim; t += passo) {
      const fimSlot = t + duracaoMin;
      const conflita = ocupados.some((o) => t < o.fim && fimSlot > o.inicio);
      if (!conflita) slots.push({ inicio: fromMin(t), fim: fromMin(fimSlot) });
    }
  });
  return slots;
}

export function salaDisponivelParaServico(sala, fkServico) {
  return (sala.servicos || []).includes(fkServico);
}

export function primeiraSalaLivre(salas, fkServico, dataISO, horaInicio, horaFim, agendamentos) {
  const salasValidas = salas.filter((s) => salaDisponivelParaServico(s, fkServico));
  const ini = toMin(horaInicio);
  const fim = toMin(horaFim);
  for (const s of salasValidas) {
    const ocupada = agendamentos.some(
      (a) =>
        a.fkSala === s.id &&
        a.data === dataISO &&
        a.fkStatus !== 3 &&
        toMin(a.hora_inicio) < fim &&
        toMin(a.hora_fim) > ini
    );
    if (!ocupada) return s.id;
  }
  return salasValidas[0]?.id ?? null;
}

/**
 * Classifica a disponibilidade agregada de um dia no calendário mensal,
 * somando os slots livres de todos os funcionários aptos.
 * Retorna: "passado" | "indisponivel" | "poucas" | "disponivel"
 */
export function classificarDiaCalendario(dataISO, funcionarios, duracaoMin, agendamentos, excecoes) {
  if (dataISO < todayISO()) return "passado";
  let total = 0;
  funcionarios.forEach((f) => {
    total += calcularSlotsLivres(f, dataISO, duracaoMin, agendamentos, excecoes).length;
  });
  if (total === 0) return "indisponivel";
  if (total <= 2) return "poucas";
  return "disponivel";
}

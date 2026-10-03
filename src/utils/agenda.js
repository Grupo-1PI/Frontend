// Utilitários de data/horário e formatação. O CÁLCULO de disponibilidade
// agora vem do back-end (services/agendamentos.js → /disponibilidade/*),
// então este arquivo só cuida de datas e de regras que não dependem de agenda.

export const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const DIAS_SEMANA_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export function formatDateBR(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

export function formatDateLong(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
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

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function mesAtualISO() {
  return todayISO().slice(0, 7); // yyyy-MM, formato esperado por GET /disponibilidade/calendario
}

// Monta "yyyy-MM-ddTHH:mm:ss" (formato date-time do OpenAPI) a partir de data + hora "HH:mm".
export function combinarDataHora(dataISO, horaHHmm) {
  return `${dataISO}T${horaHHmm}:00`;
}

const doisDigitos = (n) => String(n).padStart(2, "0");

/**
 * Serializa uma Date como "yyyy-MM-ddTHH:mm:ss" no fuso LOCAL do navegador.
 * NÃO usar toISOString() aqui: ele converte para UTC e, no fuso do Brasil
 * (-03h), um horário 08:00 seria enviado como 11:00 para o back-end.
 */
export function formatarDataHoraLocal(data) {
  return (
    `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}` +
    `T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}:${doisDigitos(data.getSeconds())}`
  );
}

export function extrairData(dataHoraISO) {
  return dataHoraISO.slice(0, 10);
}

export function extrairHora(dataHoraISO) {
  return dataHoraISO.slice(11, 16);
}

/**
 * O back-end retorna status como string livre (schema não documenta o enum
 * exato). Normalizamos para comparação tolerante a acentos/maiúsculas.
 * Ajuste os valores à esquerda se os nomes reais do back-end forem diferentes.
 */
export function normalizarStatusDia(status) {
  const s = (status || "").toUpperCase();
  if (s.includes("INDISPON")) return "indisponivel";
  if (s.includes("POUCA")) return "poucas";
  if (s.includes("PASSAD")) return "passado";
  if (s.includes("DISPON")) return "disponivel";
  return "indisponivel";
}

/**
 * Regra: só é possível remarcar/cancelar até 1 dia antes da consulta.
 * Retorna true quando a janela de remarcação já está fechada.
 */
export function remarcacaoBloqueada(dataHoraInicioISO) {
  const agendamentoEm = new Date(dataHoraInicioISO);
  const limite = new Date(agendamentoEm);
  limite.setDate(limite.getDate() - 1);
  return new Date() >= limite;
}

export const VALOR_RESERVA = 50;

/* ------------------------------------------------------------------ */
/* Período da agenda (sempre domingo → sábado)                          */
/* Datas tratadas como LOCAIS: usar Date(y, m, d) e non-UTC para       */
/* serializar, senão o fuso pode deslocar o dia em +/- um dia.         */
/* ------------------------------------------------------------------ */

export const DIAS_SEMANA_LONGA_PT = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado",
];

/** Date -> "yyyy-MM-dd" (local, sem passar por UTC). */
export function paraISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** "yyyy-MM-dd" -> Date (meio-dia local para evitar DST). */
export function deISO(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia, 12, 0, 0, 0);
}

export function addDiasISO(iso, quantidade) {
  const d = deISO(iso);
  d.setDate(d.getDate() + quantidade);
  return paraISO(d);
}

/** Domingo anterior (ou o próprio dia) da data informada. */
export function paraDomingo(iso) {
  const d = deISO(iso);
  d.setDate(d.getDate() - d.getDay());
  return paraISO(d);
}

/** Sábado seguinte (ou o próprio dia) da data informada. */
export function paraSabado(iso) {
  const d = deISO(iso);
  d.setDate(d.getDate() + (6 - d.getDay()));
  return paraISO(d);
}

/** Semana corrente: domingo → sábado. */
export function semanaAtual() {
  const hoje = paraISO(new Date());
  return { inicio: paraDomingo(hoje), fim: paraSabado(hoje) };
}

/**
 * Lista de dias de um período (inclusive), sempre começando em domingo.
 * Retorna [{ nome, data, isoDate }] — formato consumido por <GradeMatricial>.
 */
export function diasDoPeriodo(periodo, maxDias = 62) {
  const dias = [];
  if (!periodo?.inicio) return dias;
  const fim = periodo.fim ?? paraSabado(periodo.inicio);
  let atual = periodo.inicio;
  while (atual <= fim && dias.length < maxDias) {
    dias.push({
      nome: DIAS_SEMANA_LONGA_PT[deISO(atual).getDay()],
      data: deISO(atual).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      isoDate: atual,
    });
    atual = addDiasISO(atual, 1);
  }
  return dias;
}

/** "01/05/2026 - 30/05/2026" */
export function formatarPeriodoBR(periodo) {
  if (!periodo?.inicio) return "";
  const fim = periodo.fim ?? paraSabado(periodo.inicio);
  return `${deISO(periodo.inicio).toLocaleDateString("pt-BR")} - ${deISO(fim).toLocaleDateString("pt-BR")}`;
}

// IDs de status conhecidos, conforme seed do banco (tabela `status`).
// Ajuste aqui se os IDs reais do back-end forem diferentes.
export const STATUS_ID = {
  AGENDADO: 1,
  CONFIRMADO: 2,
  CANCELADO: 3,
  FINALIZADO: 4,
};

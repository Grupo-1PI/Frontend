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

// IDs de status conhecidos, conforme seed do banco (tabela `status`).
// Ajuste aqui se os IDs reais do back-end forem diferentes.
export const STATUS_ID = {
  AGENDADO: 1,
  CONFIRMADO: 2,
  CANCELADO: 3,
  FINALIZADO: 4,
};

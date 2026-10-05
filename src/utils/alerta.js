/**
 * Barramento de avisos e confirmacoes globais (substitui `alert()` e
 * `confirm()` nativos do navegador, que quebram a estetica do site).
 *
 * O componente <Alertas /> (src/components/Alertas.jsx) assina este barramento;
 * qualquer modulo pode emitir sem precisar de hook ou prop:
 *
 *   import { alerta } from "../utils/alerta";
 *   alerta.erro("mensagem");
 *   alerta.aviso("..."), alerta.sucesso("..."), alerta.info("...");
 *
 *   const ok = await alerta.confirmar("Deseja remover este turno?");
 */

const ouvintes = new Set();
const ouvintesConfirmacao = new Set();
let sequencia = 0;

function publicar(tipo, mensagem, duracao) {
  sequencia += 1;
  const item = { id: `alerta-${sequencia}`, tipo, mensagem };
  ouvintes.forEach((notificar) => notificar(item, duracao));
}

export const alerta = {
  erro: (mensagem, duracao = 6000) => publicar("erro", mensagem, duracao),
  aviso: (mensagem, duracao = 5000) => publicar("aviso", mensagem, duracao),
  sucesso: (mensagem, duracao = 4000) => publicar("sucesso", mensagem, duracao),
  info: (mensagem, duracao = 5000) => publicar("info", mensagem, duracao),

  /** Pop-up de confirmacao. Resolve true quando o usuario confirma. */
  confirmar: (mensagem, opcoes = {}) =>
    new Promise((resolver) => {
      sequencia += 1;
      const pedido = {
        id: `confirmacao-${sequencia}`,
        mensagem,
        titulo: opcoes.titulo ?? "Confirmar ação",
        textoConfirmar: opcoes.textoConfirmar ?? "Sim",
        textoCancelar: opcoes.textoCancelar ?? "Não",
        variante: opcoes.variante ?? "primary",
      };
      ouvintesConfirmacao.forEach((notificar) => notificar(pedido, resolver));
    }),
};

export function assinarAlerta(notificar) {
  ouvintes.add(notificar);
  return () => ouvintes.delete(notificar);
}

export function assinarConfirmacao(notificar) {
  ouvintesConfirmacao.add(notificar);
  return () => ouvintesConfirmacao.delete(notificar);
}
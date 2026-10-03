import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from "lucide-react";
import { assinarAlerta, assinarConfirmacao } from "../utils/alerta";
import BaseModal from "./BaseModal";

const ESTILOS = {
  erro: {
    icone: XCircle,
    cor: "text-status-cancelado",
    fundo: "bg-status-cancelado/10",
    borda: "border-status-cancelado/30",
    barra: "bg-status-cancelado",
  },
  aviso: {
    icone: AlertTriangle,
    cor: "text-amber-600",
    fundo: "bg-amber-50",
    borda: "border-amber-200",
    barra: "bg-amber-500",
  },
  sucesso: {
    icone: CheckCircle2,
    cor: "text-status-confirmado",
    fundo: "bg-status-confirmado/10",
    borda: "border-status-confirmado/30",
    barra: "bg-status-confirmado",
  },
  info: {
    icone: Info,
    cor: "text-brand-primary",
    fundo: "bg-brand-bg",
    borda: "border-brand-border",
    barra: "bg-brand-primary",
  },
};

const ROTULOS = {
  erro: "Erro",
  aviso: "Atenção",
  sucesso: "Tudo certo",
  info: "Informação",
};

export function Alertas() {
  const [itens, setItens] = useState([]);
  const [confirmacao, setConfirmacao] = useState(null);

  useEffect(() => {
    const remover = (id) => setItens((atuais) => atuais.filter((i) => i.id !== id));

    return assinarAlerta((item, duracao) => {
      setItens((atuais) => [...atuais, item]);
      window.setTimeout(() => remover(item.id), duracao);
    });
  }, []);

  useEffect(
    () =>
      assinarConfirmacao((pedido, resolver) => {
        setConfirmacao({ ...pedido, resolver });
      }),
    []
  );

  const fechar = (id) => setItens((atuais) => atuais.filter((i) => i.id !== id));

  const responder = (confirmado) => {
    confirmacao?.resolver(confirmado);
    setConfirmacao(null);
  };

  return createPortal(
    <>
      {itens.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2.5 px-4">
          {itens.map((item) => {
            const estilo = ESTILOS[item.tipo] ?? ESTILOS.info;
            const Icone = estilo.icone;

            return (
              <div
                key={item.id}
                role="alert"
                className={`alerta-entra pointer-events-auto relative flex w-full max-w-md items-start gap-3 overflow-hidden rounded-2xl border ${estilo.borda} ${estilo.fundo} px-4 py-3.5 shadow-lg shadow-black/5 backdrop-blur-sm`}
              >
                <span className={`mt-0.5 shrink-0 ${estilo.cor}`}>
                  <Icone size={20} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${estilo.cor}`}>
                    {ROTULOS[item.tipo] ?? ROTULOS.info}
                  </p>
                  <p className="mt-0.5 text-sm font-medium leading-snug text-brand-text">
                    {item.mensagem}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fechar(item.id)}
                  aria-label="Fechar aviso"
                  className="shrink-0 rounded-lg p-1 text-brand-muted/60 transition hover:bg-black/5 hover:text-brand-text"
                >
                  <X size={16} />
                </button>

                <span className={`absolute inset-y-0 left-0 w-1 ${estilo.barra}`} aria-hidden="true" />
              </div>
            );
          })}
        </div>
      )}

      {confirmacao && (
        <BaseModal
          isOpen={!!confirmacao}
          onClose={() => responder(false)}
          title={confirmacao.titulo}
          subtitle="CONFIRMAÇÃO"
          confirmText={confirmacao.textoConfirmar}
          cancelText={confirmacao.textoCancelar}
          confirmVariant={confirmacao.variante}
          onConfirm={() => responder(true)}
        >
          <div className="py-3 text-center">
            <p className="font-heading text-lg font-semibold text-[#333E33]">{confirmacao.mensagem}</p>
          </div>
        </BaseModal>
      )}
    </>,
    document.body
  );
}

export default Alertas;
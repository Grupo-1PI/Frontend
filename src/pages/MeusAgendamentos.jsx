import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Modal from "../components/Modal";
import AgendaHeader from "../components/AgendaHeader";
import Linha from "../components/Linha";
import CardAgendamentoCliente from "../components/CardAgendamentoCliente";
import { AbaNav } from "./AgendarConsulta";
import { getUsuarioLogado, logout } from "../services/auth";
import { listarAgendamentosDoCliente } from "../services/agendamentos";
import { todayISO, formatDateLong, remarcacaoBloqueada } from "../utils/agenda";

export function MeusAgendamentos() {
  const navigate = useNavigate();
  const usuario = useMemo(() => getUsuarioLogado(), []);

  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelamentoSelecionado, setCancelamentoSelecionado] = useState(null);

useEffect(() => {
  if (!usuario) {
    navigate("/login");
    return;
  }

  let ativo = true;

  setLoading(true);

  listarAgendamentosDoCliente(usuario.clienteId)
    .then((data) => {
      if (ativo) setAgendamentos(data);
    })
    .catch((err) => {
      if (ativo) setError(err);
    })
    .finally(() => {
      if (ativo) setLoading(false);
    });

  return () => {
    ativo = false;
  };
}, [usuario]);

  const futuros = useMemo(
    () =>
      agendamentos
        .filter((a) => a.dataHoraInicio >= todayISO() && (a.statusNome || "").toLowerCase() !== "cancelado")
        .sort((a, b) => (a.dataHoraInicio > b.dataHoraInicio ? 1 : -1)),
    [agendamentos]
  );

  const passados = useMemo(
    () =>
      agendamentos
        .filter((a) => !(a.dataHoraInicio >= todayISO()) || (a.statusNome || "").toLowerCase() === "cancelado")
        .sort((a, b) => (a.dataHoraInicio < b.dataHoraInicio ? 1 : -1)),
    [agendamentos]
  );

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-6 text-center text-status-cancelado">
        Não foi possível carregar seus agendamentos. Verifique se a API está rodando.
      </div>
    );
  }

  const bloqueado = cancelamentoSelecionado && remarcacaoBloqueada(cancelamentoSelecionado.dataHoraInicio);

  return (
    <div className="min-h-screen bg-brand-bg">
      <AgendaHeader nome={usuario?.nome ?? "Paciente"} subtitulo="Área do paciente" onSair={async () => { await logout(); navigate("/login"); }} />

      <div className="mx-auto max-w-3xl px-5 pb-20 pt-7">
        <AbaNav ativa="meus" contadorFuturos={futuros.length} />

        {loading ? (
          <div className="py-10 text-center text-sm text-brand-muted">Carregando agendamentos...</div>
        ) : (
          <div>
            <h2 className="font-heading mb-3.5 text-lg font-semibold text-brand-text">Próximos agendamentos</h2>
            {futuros.length === 0 ? (
              <EmptyState texto="Você ainda não tem agendamentos futuros." />
            ) : (
              <div className="mb-9 flex flex-col gap-3">
                {futuros.map((a) => (
                  <CardAgendamentoCliente key={a.id} agendamento={a} onCancelar={() => setCancelamentoSelecionado(a)} />
                ))}
              </div>
            )}

            <h2 className="font-heading mb-3.5 text-lg font-semibold text-brand-text">Histórico</h2>
            {passados.length === 0 ? (
              <EmptyState texto="Nenhum agendamento anterior." />
            ) : (
              <div className="flex flex-col gap-3">
                {passados.map((a) => (
                  <CardAgendamentoCliente key={a.id} agendamento={a} historico />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: redirecionamento para WhatsApp ao tentar cancelar */}
      {cancelamentoSelecionado && (
        <Modal onClose={() => setCancelamentoSelecionado(null)}>
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-status-confirmado/10 text-status-confirmado">
              <MessageCircle size={26} />
            </div>
            <h3 className="font-heading text-lg font-semibold text-brand-text">Cancelamento via WhatsApp</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              Você está sendo direcionado para o WhatsApp da clínica para cancelar esta consulta. Nossa equipe vai te
              ajudar por lá.
            </p>
          </div>

          {bloqueado && (
            <div className="mb-5 rounded-xl bg-amber-50 p-3 text-[12.5px] leading-relaxed text-amber-900">
              Esta consulta está a menos de 1 dia de distância — cancelamentos e remarcações nesse prazo podem estar
              sujeitos à cobrança da taxa de reserva. Fale com a clínica pelo WhatsApp para verificar.
            </div>
          )}

          <div className="mb-5 rounded-2xl bg-brand-bg p-4">
            <Linha label="Data" valor={formatDateLong(cancelamentoSelecionado.dataHoraInicio.slice(0, 10))} />
            <Linha
              label="Horário"
              valor={`${cancelamentoSelecionado.dataHoraInicio.slice(11, 16)} – ${cancelamentoSelecionado.dataHoraFim.slice(11, 16)}`}
            />
            <Linha label="Profissional" valor={cancelamentoSelecionado.funcionarios?.[0]} last />
          </div>

          {/* TODO: trocar por <a href={`https://wa.me/55SEUNUMERO?text=...`}> quando o número da clínica for definido. */}
          <button
            type="button"
            onClick={() => setCancelamentoSelecionado(null)}
            className="btn-login mb-2.5 flex w-full items-center justify-center gap-2"
          >
            <MessageCircle size={16} /> Ir para o WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setCancelamentoSelecionado(null)}
            className="w-full rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
          >
            Voltar
          </button>
        </Modal>
      )}
    </div>
  );
}

function EmptyState({ texto }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface py-10 text-center text-sm text-brand-muted">
      {texto}
    </div>
  );
}

export default MeusAgendamentos;

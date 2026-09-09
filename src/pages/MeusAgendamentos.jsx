import { useEffect, useMemo, useState } from "react";

import Modal from "../components/Modal";
import AgendaHeader from "../components/AgendaHeader";
import Linha from "../components/Linha";
import CardAgendamentoCliente from "../components/CardAgendamentoCliente";
import { AbaNav } from "./AgendarConsulta";
import { useAgendamentosData } from "../hooks/useAgendamentosData";
import { todayISO, formatDateLong } from "../utils/agenda";
import { XCircle } from "lucide-react";

// TODO: substituir pelo cliente autenticado (contexto/sessão de login).
const CLIENTE_LOGADO_ID = 1;

export function MeusAgendamentos() {
  const { data, error, atualizarStatusAgendamento } = useAgendamentosData();

  const [servicos, setServicos] = useState(() => data.servicos);
  const [salas, setSalas] = useState(() => data.salas);
  const [funcionarios, setFuncionarios] = useState(() => data.funcionarios);
  const [clientes, setClientes] = useState(() => data.clientes);
  const [agendamentos, setAgendamentos] = useState(() => data.agendamentos);

  useEffect(() => {
    setServicos(data.servicos);
    setSalas(data.salas);
    setFuncionarios(data.funcionarios);
    setClientes(data.clientes);
    setAgendamentos(data.agendamentos);
  }, [data]);

  const cliente = clientes.find((c) => c.id === CLIENTE_LOGADO_ID);

  const [cancelamentoPendente, setCancelamentoPendente] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const meusAgendamentos = useMemo(
    () =>
      agendamentos
        .filter((a) => a.fkCliente === CLIENTE_LOGADO_ID)
        .sort((a, b) => (a.data + a.hora_inicio > b.data + b.hora_inicio ? -1 : 1)),
    [agendamentos]
  );

  const futuros = meusAgendamentos.filter(
    (a) => a.data + "T" + a.hora_inicio >= todayISO() + "T00:00" && a.fkStatus !== 3
  );
  const passados = meusAgendamentos.filter(
    (a) => !(a.data + "T" + a.hora_inicio >= todayISO() + "T00:00") || a.fkStatus === 3
  );

  function dadosApoio(agendamento) {
    return {
      servico: servicos.find((s) => s.id === agendamento.fkServico),
      funcionario: funcionarios.find((f) => f.id === agendamento.fkFuncionario),
      sala: salas.find((s) => s.id === agendamento.fkSala),
    };
  }

  async function confirmarCancelamento() {
    if (!cancelamentoPendente || salvando) return;
    setSalvando(true);
    try {
      await atualizarStatusAgendamento(cancelamentoPendente.id, 3);
      setCancelamentoPendente(null);
    } finally {
      setSalvando(false);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-6 text-center text-status-cancelado">
        Não foi possível carregar os dados de agendamento. Verifique se o json-server está rodando.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <AgendaHeader nome={cliente?.nome ?? "Paciente"} subtitulo="Área do paciente" onSair={() => {}} />

      <div className="mx-auto max-w-3xl px-5 pb-20 pt-7">
        <AbaNav ativa="meus" contadorFuturos={futuros.length} />

        <div>
          <h2 className="font-heading mb-3.5 text-lg font-semibold text-brand-text">Próximos agendamentos</h2>
          {futuros.length === 0 ? (
            <EmptyState texto="Você ainda não tem agendamentos futuros." />
          ) : (
            <div className="mb-9 flex flex-col gap-3">
              {futuros.map((a) => (
                <CardAgendamentoCliente
                  key={a.id}
                  agendamento={a}
                  {...dadosApoio(a)}
                  onCancelar={() => setCancelamentoPendente(a)}
                />
              ))}
            </div>
          )}

          <h2 className="font-heading mb-3.5 text-lg font-semibold text-brand-text">Histórico</h2>
          {passados.length === 0 ? (
            <EmptyState texto="Nenhum agendamento anterior." />
          ) : (
            <div className="flex flex-col gap-3">
              {passados.map((a) => (
                <CardAgendamentoCliente key={a.id} agendamento={a} {...dadosApoio(a)} historico />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: confirmação de cancelamento */}
      {cancelamentoPendente && (
        <Modal onClose={() => setCancelamentoPendente(null)}>
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-status-cancelado/10 text-status-cancelado">
              <XCircle size={26} />
            </div>
            <h3 className="font-heading text-lg font-semibold text-brand-text">Cancelar agendamento?</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              Você está prestes a cancelar esta consulta. Essa ação não pode ser desfeita e o horário voltará a ficar
              disponível para outros pacientes.
            </p>
          </div>

          <div className="mb-5 rounded-2xl bg-brand-bg p-4">
            <Linha label="Procedimento" valor={servicos.find((s) => s.id === cancelamentoPendente.fkServico)?.nome} />
            <Linha label="Data" valor={formatDateLong(cancelamentoPendente.data)} />
            <Linha
              label="Horário"
              valor={`${cancelamentoPendente.hora_inicio} – ${cancelamentoPendente.hora_fim}`}
            />
            <Linha
              label="Profissional"
              valor={funcionarios.find((f) => f.id === cancelamentoPendente.fkFuncionario)?.nome}
              last
            />
          </div>

          <button
            type="button"
            disabled={salvando}
            onClick={confirmarCancelamento}
            className="mb-2.5 w-full rounded-lg bg-status-cancelado py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {salvando ? "Cancelando..." : "Sim, cancelar consulta"}
          </button>
          <button
            type="button"
            onClick={() => setCancelamentoPendente(null)}
            className="w-full rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
          >
            Manter agendamento
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

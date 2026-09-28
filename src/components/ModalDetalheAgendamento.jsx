import { useState } from "react";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

import Modal from "./Modal";
import Linha from "./Linha";
import StatusBadge from "./StatusBadge";
import { extrairHora, STATUS_ID } from "../utils/agenda";

/** Os três selects (procedimento/profissional/sala) reaproveitados em "Aceitar" e "Definir atendimento". */
function SeletorAtendimento({ servicos, funcionarios, salas, servicoId, funcionarioId, salaId, onChangeServico, onChangeFuncionario, onChangeSala }) {
  return (
    <div className="flex flex-col gap-2.5">
      <select
        value={servicoId}
        onChange={(e) => onChangeServico(e.target.value)}
        className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-[13px] text-brand-text"
      >
        <option value="">Procedimento...</option>
        {servicos.map((s) => (
          <option key={s.id} value={s.id}>{s.nome}</option>
        ))}
      </select>
      <select
        value={funcionarioId}
        onChange={(e) => onChangeFuncionario(e.target.value)}
        className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-[13px] text-brand-text"
      >
        <option value="">Profissional...</option>
        {funcionarios.map((f) => (
          <option key={f.id} value={f.id}>{f.nome}</option>
        ))}
      </select>
      <select
        value={salaId}
        onChange={(e) => onChangeSala(e.target.value)}
        className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-[13px] text-brand-text"
      >
        <option value="">Sala...</option>
        {salas.map((s) => (
          <option key={s.id} value={s.id}>{s.descricao}</option>
        ))}
      </select>
    </div>
  );
}

function ModalDetalheAgendamento({ agendamento, funcionarios, servicos, salas, salvando, onFechar, onMudarStatus, onAtribuirDetalhes }) {
  const statusAtual = (agendamento.statusNome || "").toLowerCase();
  const temServico = (agendamento.servicos || []).length > 0;
  const temFuncionario = (agendamento.funcionarios || []).length > 0;
  const temSala = !!agendamento.salaDescricao;
  const precisaAtribuir = !temServico || !temFuncionario || !temSala;

  const [funcionarioId, setFuncionarioId] = useState("");
  const [salaId, setSalaId] = useState("");
  const [servicoId, setServicoId] = useState("");

  const podeAceitar = funcionarioId && salaId && servicoId;

  function salvarAtribuicao() {
    return onAtribuirDetalhes(agendamento.id, {
      funcionarioId: Number(funcionarioId),
      salaId: Number(salaId),
      servicoId: Number(servicoId),
    });
  }

  return (
    <Modal onClose={onFechar}>
      <div className="mb-4 flex items-start justify-between gap-3 pr-6">
        <h3 className="font-heading text-lg font-semibold text-brand-text">
          {agendamento.servicos?.[0] ?? "Procedimento a definir"}
        </h3>
        <StatusBadge statusNome={agendamento.statusNome} />
      </div>

      <Linha label="Paciente" valor={agendamento.clienteNome} />
      <Linha label="Profissional" valor={agendamento.funcionarios?.[0] ?? "A definir"} />
      <Linha label="Horário" valor={`${extrairHora(agendamento.dataHoraInicio)} – ${extrairHora(agendamento.dataHoraFim)}`} />
      <Linha label="Sala" valor={agendamento.salaDescricao ?? "A definir"} />
      {!temServico && <Linha label="Valor" valor="Taxa de reserva: R$ 50,00" last />}

      {agendamento.observacao && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-800">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {agendamento.observacao}
        </div>
      )}

      {statusAtual === "pendente" && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 text-[13px] font-bold text-amber-900">
            Aceitar consulta — defina quem vai atender
          </div>
          <SeletorAtendimento
            servicos={servicos}
            funcionarios={funcionarios}
            salas={salas}
            servicoId={servicoId}
            funcionarioId={funcionarioId}
            salaId={salaId}
            onChangeServico={setServicoId}
            onChangeFuncionario={setFuncionarioId}
            onChangeSala={setSalaId}
          />
          <button
            type="button"
            disabled={!podeAceitar || salvando}
            onClick={async () => {
              await salvarAtribuicao();
              // Aceitar a consulta: sai de Pendente e vai para Agendado (visão da equipe).
              // O que o cliente enxerga como "Confirmado" é resolvido pelo back-end por perfil.
              await onMudarStatus(agendamento.id, STATUS_ID.AGENDADO);
            }}
            className="mt-3 w-full rounded-lg bg-amber-600 py-2.5 text-[13px] font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {salvando ? "Aceitando..." : "Aceitar consulta"}
          </button>
        </div>
      )}

      {precisaAtribuir && statusAtual !== "pendente" && (
        <div className="mt-4 rounded-xl border border-brand-border bg-brand-bg p-4">
          <div className="mb-3 text-[13px] font-bold text-brand-text">Definir atendimento</div>
          <SeletorAtendimento
            servicos={servicos}
            funcionarios={funcionarios}
            salas={salas}
            servicoId={servicoId}
            funcionarioId={funcionarioId}
            salaId={salaId}
            onChangeServico={setServicoId}
            onChangeFuncionario={setFuncionarioId}
            onChangeSala={setSalaId}
          />
          <button
            type="button"
            disabled={!podeAceitar || salvando}
            onClick={salvarAtribuicao}
            className="mt-3 w-full rounded-lg bg-brand-primary py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar atendimento"}
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {statusAtual === "agendado" && (
          <button
            type="button"
            disabled={salvando}
            onClick={() => onMudarStatus(agendamento.id, STATUS_ID.CONFIRMADO)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-primary py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
          >
            <CheckCircle2 size={16} /> Confirmar
          </button>
        )}
        {(statusAtual === "agendado" || statusAtual === "confirmado") && (
          <>
            <button
              type="button"
              disabled={salvando}
              onClick={() => onMudarStatus(agendamento.id, STATUS_ID.FINALIZADO)}
              className="flex-1 rounded-lg bg-brand-bg py-2.5 text-[13px] font-semibold text-brand-text transition hover:bg-brand-border disabled:opacity-50"
            >
              Finalizar
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={() => onMudarStatus(agendamento.id, STATUS_ID.CANCELADO)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-status-cancelado/10 py-2.5 text-[13px] font-semibold text-status-cancelado transition hover:bg-status-cancelado/20 disabled:opacity-50"
            >
              <XCircle size={16} /> Cancelar
            </button>
          </>
        )}
        {statusAtual === "pendente" && (
          <button
            type="button"
            disabled={salvando}
            onClick={() => onMudarStatus(agendamento.id, STATUS_ID.CANCELADO)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-status-cancelado/10 py-2.5 text-[13px] font-semibold text-status-cancelado transition hover:bg-status-cancelado/20 disabled:opacity-50"
          >
            <XCircle size={16} /> Recusar
          </button>
        )}
      </div>
    </Modal>
  );
}

export default ModalDetalheAgendamento;

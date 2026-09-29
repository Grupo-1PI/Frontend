import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import DataTable from "../components/DataTable";
import BaseModal from "../components/BaseModal";
import { getUsuarioLogado, logout } from "../services/auth";

export function DisponibilidadeEquipe() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { key: "profissional", header: "Profissional" },
    { key: "dias", header: "Dias de Atendimento" },
    { key: "janela", header: "Janela de Horário" },
  ];

  const data = [
    { id: 1, profissional: "Dr. Ricardo Silveira", dias: "SEG TER QUA QUI SEX", janela: "08:00 — 12:00 / 14:00 — 18:00" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Disponibilidade" onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <ManagementHeader title="Disponibilidade" subtitle="Painel de Gestão" buttonText="Novo horário" onButtonClick={() => setIsModalOpen(true)} />
        <DataTable columns={columns} data={data} onEdit={() => {}} />

        <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Horário" subtitle="Configurar Períodos" confirmText="Salvar alterações">
          <div className="space-y-4 text-sm text-[#333E33]">
            <p>Configure os períodos de atendimento semanal para este quadro de horários.</p>
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default DisponibilidadeEquipe;

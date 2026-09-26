import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import { getUsuarioLogado, logout } from "../services/auth";

export function AgendaClinica() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Agendamentos" onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-10">
        <ManagementHeader title="Agendamentos" subtitle="Visualização Semanal" buttonText="Novo agendamento" onButtonClick={() => setIsModalOpen(true)} />

        <div className="rounded-2xl bg-white p-8 border border-gray-200 shadow-sm text-center text-gray-500">
          Grade semanal de agendamentos da clínica
        </div>

        <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Agendamento" subtitle="Criar Novo Agendamento" confirmText="Criar agendamento">
          <div className="space-y-4">
            <FloatingInput label="Selecionar cliente" />
            <FloatingInput label="Selecionar serviço" />
            <FloatingInput label="Selecionar profissional" />
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default AgendaClinica;

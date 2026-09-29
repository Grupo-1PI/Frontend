import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import DataTable from "../components/DataTable";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import { getUsuarioLogado, logout } from "../services/auth";

export function GerenciamentoSalas() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { key: "nome", header: "Nome da Sala" },
    { key: "descricao", header: "Descrição" },
  ];

  const data = [
    { id: 1, nome: "Sala 1", descricao: "Acupuntura Sistêmica" },
    { id: 2, nome: "Sala 2", descricao: "Ventosa e Aurículo" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Salas" onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <ManagementHeader title="Salas" buttonText="Nova sala" onButtonClick={() => setIsModalOpen(true)} />
        <DataTable columns={columns} data={data} onEdit={() => {}} onDelete={() => {}} />

        <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Salas" subtitle="Criar Sala" confirmText="Criar sala">
          <div className="space-y-4">
            <FloatingInput label="Nome da sala" />
            <FloatingInput label="Descrição" />
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default GerenciamentoSalas;

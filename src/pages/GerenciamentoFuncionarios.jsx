import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import DataTable from "../components/DataTable";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import { getUsuarioLogado, logout } from "../services/auth";

export function GerenciamentoFuncionarios() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { key: "nome", header: "Nome" },
    { key: "cargo", header: "Cargo" },
    { key: "especialidades", header: "Especialidades", render: (esps) => esps?.join(", ") },
  ];

  const data = [
    { id: 1, nome: "Carlos Almeida", cargo: "Administrador", especialidades: ["Acumpultura"] },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Funcionários" onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <ManagementHeader title="Funcionários" buttonText="Novo funcionários" onButtonClick={() => setIsModalOpen(true)} />
        <DataTable columns={columns} data={data} onEdit={() => {}} onDelete={() => {}} />

        <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Funcionários" subtitle="Criar Funcionário" confirmText="Criar funcionário">
          <div className="space-y-4">
            <FloatingInput label="Nome do funcionário" />
            <FloatingInput label="E-mail" type="email" />
            <FloatingInput label="Telefone" />
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default GerenciamentoFuncionarios;

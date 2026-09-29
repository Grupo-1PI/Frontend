import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import DataTable from "../components/DataTable";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import CheckboxGroup from "../components/CheckboxGroup";
import { getUsuarioLogado, logout } from "../services/auth";

export function GerenciamentoServicos() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [salasSel, setSalasSel] = useState([]);

  const columns = [
    { key: "nome", header: "Nome" },
    { key: "salas", header: "Salas", render: (salas) => salas?.join(", ") },
    { key: "valor", header: "Valor" },
  ];

  const data = [
    { id: 1, nome: "Acupuntura sistêmica", salas: ["Sala 1", "Sala 2"], valor: "R$ 300,00" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Serviços" onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <ManagementHeader title="Serviços" buttonText="Novo serviços" onButtonClick={() => setIsModalOpen(true)} />
        <DataTable columns={columns} data={data} onEdit={() => {}} onDelete={() => {}} />

        <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Serviços" subtitle="Criar Serviço" confirmText="Criar serviço">
          <div className="space-y-4">
            <FloatingInput label="Nome do serviço" />
            <CheckboxGroup label="Selecionar salas" items={[{ id: 1, descricao: "Sala 1" }, { id: 2, descricao: "Sala 2" }]} selectedIds={salasSel} onChange={setSalasSel} />
            <FloatingInput label="Valor" value="R$ 0,00" />
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default GerenciamentoServicos;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import DataTable from "../components/DataTable";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import CheckboxGroup from "../components/CheckboxGroup";
import { getUsuarioLogado, logout } from "../services/auth";

export function GerenciamentoEspecialidades() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [servicosSel, setServicosSel] = useState([]);

  const columns = [
    { key: "nome", header: "Nome" },
    { key: "servicos", header: "Serviços", render: (servs) => servs?.join(", ") },
  ];

  const data = [
    { id: 1, nome: "Acupuntura", servicos: ["Acupuntura Sistêmica"] },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Especialidades" onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <ManagementHeader title="Especialidades" buttonText="Nova especialidades" onButtonClick={() => setIsModalOpen(true)} />
        <DataTable columns={columns} data={data} onEdit={() => {}} onDelete={() => {}} />

        <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Especialidades" subtitle="Criar Especialidade" confirmText="Criar especialidades">
          <div className="space-y-4">
            <FloatingInput label="Nome da especialidade" />
            <CheckboxGroup label="Selecionar serviços" items={[{ id: 1, descricao: "Acupuntura Sistêmica" }]} selectedIds={servicosSel} onChange={setServicosSel} />
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default GerenciamentoEspecialidades;

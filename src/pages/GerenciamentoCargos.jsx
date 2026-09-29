import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import DataTable from "../components/DataTable";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import CheckboxGroup from "../components/CheckboxGroup";
import { getUsuarioLogado, logout } from "../services/auth";

export function GerenciamentoCargos() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permissoesSel, setPermissoesSel] = useState([]);

  const columns = [
    { key: "cargo", header: "Cargo" },
    { key: "usuarios", header: "Usuários", render: (usrs) => usrs?.join(", ") },
    { key: "permissoes", header: "Permissões", render: (perms) => perms?.join(", ") },
  ];

  const data = [
    { id: 1, cargo: "Administrador", usuarios: ["Carlos Almeida"], permissoes: ["Acesso total"] },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Cargos" onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <ManagementHeader title="Cargos" buttonText="Novo cargo" onButtonClick={() => setIsModalOpen(true)} />
        <DataTable columns={columns} data={data} onEdit={() => {}} onDelete={() => {}} />

        <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cargos" subtitle="Criar Cargo" confirmText="Criar cargo">
          <div className="space-y-4">
            <FloatingInput label="Nome do cargo" />
            <CheckboxGroup label="Selecionar Permissões" items={[{ id: 1, descricao: "Acesso total" }, { id: 2, descricao: "Ver agenda" }, { id: 3, descricao: "Criar agendamentos" }]} selectedIds={permissoesSel} onChange={setPermissoesSel} />
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default GerenciamentoCargos;

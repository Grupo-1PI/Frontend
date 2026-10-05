import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import DataTable from "../components/DataTable";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import CheckboxGroup from "../components/CheckboxGroup";
import AcessoNegado from "../components/AcessoNegado";
import { alerta } from "../utils/alerta";
import { getUsuarioLogado, logout } from "../services/auth";
import { podeGerenciarCargos } from "../services/permissoes";
import { listarCargos, listarPermissoes, criarCargo, atualizarCargo, deletarCargo } from "../services/agendamentos";

export function GerenciamentoCargos() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  const [cargos, setCargos] = useState([]);
  const [permissoes, setPermissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  const [nome, setNome] = useState("");
  const [permissoesIds, setPermissoesIds] = useState([]);

  const [cargoParaExcluir, setCargoParaExcluir] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const temAcesso = podeGerenciarCargos();

  const carregarDados = async () => {
    if (!temAcesso) return;
    try {
      setLoading(true);
      const [cargosData, permsData] = await Promise.all([listarCargos(), listarPermissoes()]);
      setCargos(cargosData);
      setPermissoes(permsData);
    } catch (err) {
      console.error("Erro ao carregar cargos/permissões", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  if (!temAcesso) {
    return <AcessoNegado />;
  }

  const handleOpenCreate = () => {
    setEditando(null);
    setNome("");
    setPermissoesIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cargo) => {
    setEditando(cargo);
    setNome(cargo.nome || "");
    const pIds = (cargo.permissoes || []).map((p) => p.id);
    setPermissoesIds(pIds);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) return;
    try {
      setSubmitting(true);
      const payload = {
        nome,
        descricao: nome,
        permissoesIds,
      };

      if (editando) {
        await atualizarCargo(editando.id, payload);
      } else {
        await criarCargo(payload);
      }
      setIsModalOpen(false);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao salvar cargo", err);
      alerta.erro("Erro ao salvar cargo. Verifique os campos.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!cargoParaExcluir) return;
    try {
      setSubmitting(true);
      await deletarCargo(cargoParaExcluir.id);
      setCargoParaExcluir(null);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao excluir cargo", err);
      alerta.erro("Não foi possível excluir o cargo.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCargos = cargos.filter((c) =>
    (c.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "nome", header: "Cargo" },
    {
      key: "usuarios",
      header: "Usuários",
      render: (usrs) => (usrs?.length ? usrs.join(", ") : "Nenhum"),
    },
    {
      key: "permissoes",
      header: "Permissões",
      render: (perms) => (perms?.length ? perms.map((p) => p.nome).join(", ") : "Nenhuma"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Cargos" showNav={true} onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <ManagementHeader title="Cargos" buttonText="Novo cargo" onButtonClick={handleOpenCreate} />
        <DataTable
          columns={columns}
          data={filteredCargos}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Filtrar por nome do cargo..."
          onEdit={handleOpenEdit}
          onDelete={(cargo) => setCargoParaExcluir(cargo)}
          paginationInfo={`Mostrando ${filteredCargos.length} de ${cargos.length} cargos`}
        />

        {/* Modal Criar/Editar */}
        <BaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Cargos"
          subtitle={editando ? "EDITAR CARGOS" : "CRIAR CARGO"}
          confirmText={editando ? "Salvar alterações" : "Criar cargo"}
          onConfirm={handleSave}
          loading={submitting}
        >
          <div className="space-y-4">
            <FloatingInput
              label="Nome do cargo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <CheckboxGroup
              label="Selecionar Permissões"
              items={permissoes}
              idKey="id"
              labelKey="nome"
              selectedIds={permissoesIds}
              onChange={setPermissoesIds}
            />
          </div>
        </BaseModal>

        {/* Modal Confirmação Exclusão */}
        <BaseModal
          isOpen={!!cargoParaExcluir}
          onClose={() => setCargoParaExcluir(null)}
          title="Cargos"
          subtitle="EXCLUIR CARGO"
          confirmText="Sim"
          cancelText="Não"
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          loading={submitting}
        >
          <div className="text-center py-4 font-heading text-xl font-bold text-[#333E33]">
            TEM CERTEZA DE QUE DESEJA EXCLUIR O CARGO?
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default GerenciamentoCargos;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import DataTable from "../components/DataTable";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import CheckboxGroup from "../components/CheckboxGroup";
import { alerta } from "../utils/alerta";
import { getUsuarioLogado, logout } from "../services/auth";
import { podeGerenciarEspecialidades } from "../services/permissoes";
import AcessoNegado from "../components/AcessoNegado";
import { listarEspecialidades, listarServicos, criarEspecialidade, atualizarEspecialidade, deletarEspecialidade } from "../services/agendamentos";

export function GerenciamentoEspecialidades() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  const [especialidades, setEspecialidades] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  const [nome, setNome] = useState("");
  const [servicosIds, setServicosIds] = useState([]);

  const [especialidadeParaExcluir, setEspecialidadeParaExcluir] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const temAcesso = podeGerenciarEspecialidades();

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [espData, servData] = await Promise.all([listarEspecialidades(), listarServicos()]);
      setEspecialidades(espData);
      setServicos(servData);
    } catch (err) {
      console.error("Erro ao carregar especialidades/serviços", err);
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
    setServicosIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (esp) => {
    setEditando(esp);
    setNome(esp.nome || "");
    const servIds = (esp.servicos || []).map((s) => s.id);
    setServicosIds(servIds);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) return;
    try {
      setSubmitting(true);
      const payload = {
        nome,
        servicosIds,
      };

      if (editando) {
        await atualizarEspecialidade(editando.id, payload);
      } else {
        await criarEspecialidade(payload);
      }
      setIsModalOpen(false);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao salvar especialidade", err);
      alerta.erro("Erro ao salvar especialidade. Verifique os campos.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!especialidadeParaExcluir) return;
    try {
      setSubmitting(true);
      await deletarEspecialidade(especialidadeParaExcluir.id);
      setEspecialidadeParaExcluir(null);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao excluir especialidade", err);
      alerta.erro("Não foi possível excluir a especialidade.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEspecialidades = especialidades.filter((e) =>
    (e.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "nome", header: "Nome" },
    {
      key: "servicos",
      header: "Serviços",
      render: (servs) => (servs?.length ? servs.map((s) => s.nome).join(", ") : "Nenhum"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Especialidades" showNav={true} onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <ManagementHeader title="Especialidades" buttonText="Nova especialidade" onButtonClick={handleOpenCreate} />
        <DataTable
          columns={columns}
          data={filteredEspecialidades}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Filtrar por nome da especialidade..."
          onEdit={handleOpenEdit}
          onDelete={(esp) => setEspecialidadeParaExcluir(esp)}
          paginationInfo={`Mostrando ${filteredEspecialidades.length} de ${especialidades.length} especialidades`}
        />

        {/* Modal Criar/Editar */}
        <BaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Especialidades"
          subtitle={editando ? "EDITAR ESPECIALIDADE" : "CRIAR ESPECIALIDADE"}
          confirmText={editando ? "Salvar alterações" : "Criar especialidade"}
          onConfirm={handleSave}
          loading={submitting}
        >
          <div className="space-y-4">
            <FloatingInput
              label="Nome da especialidade"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <CheckboxGroup
              label="Selecionar serviços"
              items={servicos}
              idKey="id"
              labelKey="nome"
              selectedIds={servicosIds}
              onChange={setServicosIds}
            />
          </div>
        </BaseModal>

        {/* Modal Confirmação Exclusão */}
        <BaseModal
          isOpen={!!especialidadeParaExcluir}
          onClose={() => setEspecialidadeParaExcluir(null)}
          title="Especialidades"
          subtitle="EXCLUIR ESPECIALIDADE"
          confirmText="Sim"
          cancelText="Não"
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          loading={submitting}
        >
          <div className="text-center py-4 font-heading text-xl font-bold text-[#333E33]">
            TEM CERTEZA DE QUE DESEJA EXCLUIR A ESPECIALIDADE?
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default GerenciamentoEspecialidades;

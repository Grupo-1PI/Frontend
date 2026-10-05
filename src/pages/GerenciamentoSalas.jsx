import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import DataTable from "../components/DataTable";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import { alerta } from "../utils/alerta";
import { getUsuarioLogado, logout } from "../services/auth";
import { podeGerenciarSalas } from "../services/permissoes";
import AcessoNegado from "../components/AcessoNegado";
import { listarSalas, criarSala, atualizarSala, deletarSala } from "../services/agendamentos";

export function GerenciamentoSalas() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [descricao, setDescricao] = useState("");

  const [salaParaExcluir, setSalaParaExcluir] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const temAcesso = podeGerenciarSalas();

  const carregarSalas = async () => {
    try {
      setLoading(true);
      const data = await listarSalas();
      setSalas(data);
    } catch (err) {
      console.error("Erro ao carregar salas", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSalas();
  }, []);

  if (!temAcesso) {
    return <AcessoNegado />;
  }

  const handleOpenCreate = () => {
    setEditando(null);
    setDescricao("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sala) => {
    setEditando(sala);
    setDescricao(sala.descricao || "");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!descricao.trim()) return;
    try {
      setSubmitting(true);
      if (editando) {
        await atualizarSala(editando.id, { descricao });
      } else {
        await criarSala({ descricao });
      }
      setIsModalOpen(false);
      await carregarSalas();
    } catch (err) {
      console.error("Erro ao salvar sala", err);
      alerta.erro("Erro ao salvar sala. Verifique os dados.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!salaParaExcluir) return;
    try {
      setSubmitting(true);
      await deletarSala(salaParaExcluir.id);
      setSalaParaExcluir(null);
      await carregarSalas();
    } catch (err) {
      console.error("Erro ao excluir sala", err);
      const msg = err.response?.data?.mensagem || err.response?.data?.message || "Não é possível excluir esta sala pois ela está em uso por serviços ou agendamentos.";
      alerta.erro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSalas = salas.filter((s) =>
    (s.descricao || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "id", header: "ID" },
    { key: "descricao", header: "Descrição da Sala" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Salas" showNav={true} onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <ManagementHeader title="Salas" buttonText="Nova sala" onButtonClick={handleOpenCreate} />
        <DataTable
          columns={columns}
          data={filteredSalas}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Filtrar por descrição..."
          onEdit={handleOpenEdit}
          onDelete={(sala) => setSalaParaExcluir(sala)}
          paginationInfo={`Mostrando ${filteredSalas.length} de ${salas.length} salas`}
        />

        {/* Modal Criar/Editar */}
        <BaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Salas"
          subtitle={editando ? "EDITAR SALAS" : "CRIAR SALA"}
          confirmText={editando ? "Salvar alterações" : "Criar sala"}
          onConfirm={handleSave}
          loading={submitting}
        >
          <div className="space-y-4">
            <FloatingInput
              label="Descrição da sala"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
        </BaseModal>

        {/* Modal Confirmação Exclusão */}
        <BaseModal
          isOpen={!!salaParaExcluir}
          onClose={() => setSalaParaExcluir(null)}
          title="Salas"
          subtitle="EXCLUIR SALA"
          confirmText="Sim"
          cancelText="Não"
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          loading={submitting}
        >
          <div className="text-center py-4 font-heading text-xl font-bold text-[#333E33]">
            TEM CERTEZA DE QUE DESEJA EXCLUIR A SALA?
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default GerenciamentoSalas;

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
import { podeGerenciarServicos } from "../services/permissoes";
import AcessoNegado from "../components/AcessoNegado";
import { listarServicos, listarSalas, criarServico, atualizarServico, deletarServico } from "../services/agendamentos";

export function GerenciamentoServicos() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  const [servicos, setServicos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [salasIds, setSalasIds] = useState([]);

  const [servicoParaExcluir, setServicoParaExcluir] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const temAcesso = podeGerenciarServicos();

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [servicosData, salasData] = await Promise.all([listarServicos(), listarSalas()]);
      setServicos(servicosData);
      setSalas(salasData);
    } catch (err) {
      console.error("Erro ao carregar serviços/salas", err);
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
    setDescricao("");
    setValor("");
    setSalasIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (servico) => {
    setEditando(servico);
    setNome(servico.nome || "");
    setDescricao(servico.descricao || "");
    setValor(servico.valor ? String(servico.valor) : "");
    // Se o serviço retorna salas como array de strings ou objetos, mapear IDs
    // No ServicoResponseDto, salas é List<String> (descrições), mas podemos buscar o ID correspondente na lista de salas
    const salasDoServicoIds = salas
      .filter((s) => (servico.salas || []).includes(s.descricao))
      .map((s) => s.id);
    setSalasIds(salasDoServicoIds);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim() || !valor) return;
    try {
      setSubmitting(true);
      const payload = {
        nome,
        descricao: descricao || nome,
        valor: parseFloat(valor.replace(",", ".")),
        tempoMedio: 60,
        salasIds,
      };

      if (editando) {
        await atualizarServico(editando.id, payload);
      } else {
        await criarServico(payload);
      }
      setIsModalOpen(false);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao salvar serviço", err);
      const msg = err.response?.data?.mensagem || err.response?.data?.message || "Erro ao salvar serviço. Verifique os campos.";
      alerta.erro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!servicoParaExcluir) return;
    try {
      setSubmitting(true);
      await deletarServico(servicoParaExcluir.id);
      setServicoParaExcluir(null);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao excluir serviço", err);
      const msg = err.response?.data?.mensagem || err.response?.data?.message || "Não é possível excluir este serviço pois ele está vinculado a agendamentos ou salas.";
      alerta.erro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServicos = servicos.filter((s) =>
    (s.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "nome", header: "Nome" },
    {
      key: "salas",
      header: "Salas",
      render: (salasArr) => (salasArr?.length ? salasArr.join(", ") : "Nenhuma"),
    },
    {
      key: "valor",
      header: "Valor",
      render: (val) => (val !== undefined && val !== null ? `R$ ${Number(val).toFixed(2).replace(".", ",")}` : "R$ 0,00"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Serviços" showNav={true} onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <ManagementHeader title="Serviços" buttonText="Novo serviço" onButtonClick={handleOpenCreate} />
        <DataTable
          columns={columns}
          data={filteredServicos}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Filtrar por nome do serviço..."
          onEdit={handleOpenEdit}
          onDelete={(servico) => setServicoParaExcluir(servico)}
          paginationInfo={`Mostrando ${filteredServicos.length} de ${servicos.length} serviços`}
        />

        {/* Modal Criar/Editar */}
        <BaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Serviços"
          subtitle={editando ? "EDITAR SERVIÇO" : "CRIAR SERVIÇO"}
          confirmText={editando ? "Salvar alterações" : "Criar serviço"}
          onConfirm={handleSave}
          loading={submitting}
        >
          <div className="space-y-4">
            <FloatingInput
              label="Nome do serviço"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <FloatingInput
              label="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            <CheckboxGroup
              label="Selecionar salas"
              items={salas}
              idKey="id"
              labelKey="descricao"
              selectedIds={salasIds}
              onChange={setSalasIds}
            />
            <FloatingInput
              label="Valor (R$)"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </BaseModal>

        {/* Modal Confirmação Exclusão */}
        <BaseModal
          isOpen={!!servicoParaExcluir}
          onClose={() => setServicoParaExcluir(null)}
          title="Serviços"
          subtitle="EXCLUIR SERVIÇO"
          confirmText="Sim"
          cancelText="Não"
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          loading={submitting}
        >
          <div className="text-center py-4 font-heading text-xl font-bold text-[#333E33]">
            TEM CERTEZA DE QUE DESEJA EXCLUIR O SERVIÇO?
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default GerenciamentoServicos;

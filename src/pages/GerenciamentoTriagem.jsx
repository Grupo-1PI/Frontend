import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import CheckboxGroup from "../components/CheckboxGroup";
import { alerta } from "../utils/alerta";
import { getUsuarioLogado, logout } from "../services/auth";
import { podeGerenciarAgendamentos } from "../services/permissoes";
import AcessoNegado from "../components/AcessoNegado";
import { 
  listarTriagemPerguntas, 
  buscarTriagemPergunta, 
  criarTriagemPergunta, 
  atualizarTriagemPergunta, 
  deletarTriagemPergunta,
  listarEspecialidades 
} from "../services/agendamentos";
import { Plus, Edit2, Trash2, AlertTriangle, HelpCircle } from "lucide-react";
import TriagemTreeView from "../components/TriagemTreeView";

export function GerenciamentoTriagem() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  const [perguntas, setPerguntas] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [visualizando, setVisualizando] = useState(null);

  const [texto, setTexto] = useState("");
  const [ordem, setOrdem] = useState(0);
  const [raiz, setRaiz] = useState(false);
  const [especialidadeId, setEspecialidadeId] = useState("");
  const [respostas, setRespostas] = useState([
    { resposta: "SIM", proximaPerguntaId: "", especialidadeId: "" },
    { resposta: "NAO", proximaPerguntaId: "", especialidadeId: "" }
  ]);

  const [perguntaParaExcluir, setPerguntaParaExcluir] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [erroValidacao, setErroValidacao] = useState("");

  const temAcesso = podeGerenciarAgendamentos();

  const carregarDados = useCallback(async () => {
    try {
      const [pergData, espData] = await Promise.all([listarTriagemPerguntas(), listarEspecialidades()]);
      console.log('[GerenciamentoTriagem] API response:', { 
        perguntas: pergData?.map(p => ({ id: p.id, texto: p.texto, raiz: p.raiz, respostas: p.respostas })),
        especialidades: espData 
      });
      setPerguntas(pergData);
      setEspecialidades(espData);
    } catch (err) {
      console.error("Erro ao carregar triagem", err);
      alerta.erro("Erro ao carregar dados da triagem");
    }
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  if (!temAcesso) return <AcessoNegado />;

  const handleOpenCreate = () => {
    setEditando(null);
    setVisualizando(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (perg) => {
    setEditando(perg);
    setVisualizando(null);
    buscarTriagemPergunta(perg.id).then(p => {
      setTexto(p.texto || "");
      setOrdem(p.ordem || 0);
      setRaiz(p.raiz || false);
      setEspecialidadeId(p.especialidade?.id || "");
      setRespostas((p.respostas || []).map(r => ({
        resposta: r.resposta,
        proximaPerguntaId: r.proximaPergunta?.id || "",
        especialidadeId: r.especialidade?.id || ""
      })));
      setIsModalOpen(true);
    });
  };

  const handleOpenView = (perg) => {
    setVisualizando(perg);
    setEditando(null);
    buscarTriagemPergunta(perg.id).then(p => {
      setVisualizando(p);
    });
  };

  const resetForm = () => {
    setTexto("");
    setOrdem(perguntas.length + 1);
    setRaiz(false);
    setEspecialidadeId("");
    setRespostas([
      { resposta: "SIM", proximaPerguntaId: "", especialidadeId: "" },
      { resposta: "NAO", proximaPerguntaId: "", especialidadeId: "" }
    ]);
    setErroValidacao("");
  };

  const validateForm = () => {
    if (!texto.trim()) { setErroValidacao("Texto da pergunta é obrigatório"); return false; }
    if (raiz) {
      const outrasRaizes = perguntas.filter(p => p.raiz && p.id !== (editando?.id));
      if (outrasRaizes.length > 0) { setErroValidacao("Já existe uma pergunta raiz"); return false; }
    }
    const sim = respostas.find(r => r.resposta === "SIM");
    const nao = respostas.find(r => r.resposta === "NAO");
    if (!sim || !nao) { setErroValidacao("Deve haver resposta SIM e NÃO"); return false; }
    for (const r of [sim, nao]) {
      const temProx = !!r.proximaPerguntaId;
      const temEsp = !!r.especialidadeId;
      if (temProx === temEsp) { setErroValidacao("Cada resposta deve ter próxima pergunta OU especialidade (não ambos)"); return false; }
    }
    setErroValidacao("");
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const payload = {
        texto,
        ordem,
        raiz,
        especialidadeId: especialidadeId ? Number(especialidadeId) : null,
        respostas: respostas.map(r => ({
          resposta: r.resposta,
          proximaPerguntaId: r.proximaPerguntaId ? Number(r.proximaPerguntaId) : null,
          especialidadeId: r.especialidadeId ? Number(r.especialidadeId) : null
        }))
      };
      if (editando) {
        await atualizarTriagemPergunta(editando.id, payload);
      } else {
        await criarTriagemPergunta(payload);
      }
      setIsModalOpen(false);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao salvar", err);
      const msg = err.response?.data?.message || "Erro ao salvar pergunta";
      setErroValidacao(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!perguntaParaExcluir) return;
    try {
      setSubmitting(true);
      await deletarTriagemPergunta(perguntaParaExcluir.id);
      setPerguntaParaExcluir(null);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao excluir", err);
      alerta.erro("Não foi possível excluir (pode ter respostas vinculadas)");
    } finally {
      setSubmitting(false);
    }
  };

  const updateResposta = (index, field, value) => {
    setRespostas(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader 
        nome={usuario?.nome ?? "Gestão"} 
        subtitulo="Triagem Dinâmica" 
        showNav={true} 
        onSair={async () => { await logout(); navigate("/login"); }} 
      />
      
      {/* Header - com largura limitada */}
      <div className="mx-auto max-w-5xl px-5 pt-10 pb-5">
        <ManagementHeader title="Triagem Dinâmica" buttonText="Nova pergunta" onButtonClick={handleOpenCreate} />
      </div>
      
      {/* Árvore Visual - LARGURA TOTAL */}
      <div className="px-5 pb-10">
        <div className="mb-4 rounded-2xl border border-brand-border bg-brand-surface p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-brand-text">
            <HelpCircle size={18} />
            Árvore de Decisão
          </div>
          <TriagemTreeView
            perguntas={perguntas}
            especialidades={especialidades}
            onEdit={handleOpenEdit}
            onView={handleOpenView}
            onDelete={setPerguntaParaExcluir}
          />
        </div>

        {/* Modal Criar/Editar */}
        <BaseModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); resetForm(); }}
          title="Triagem"
          subtitle={editando ? "EDITAR PERGUNTA" : "CRIAR PERGUNTA"}
          confirmText={editando ? "Salvar alterações" : "Criar pergunta"}
          onConfirm={handleSave}
          loading={submitting}
        >
          <div className="space-y-4">
            {erroValidacao && (
              <div className="flex items-center gap-2 rounded-lg bg-status-cancelado/10 p-3 text-sm text-status-cancelado">
                <AlertTriangle size={16} />
                {erroValidacao}
              </div>
            )}
            <FloatingInput
              label="Texto da pergunta"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex: O paciente sente dor muscular?"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <FloatingInput
                label="Ordem"
                type="number"
                value={ordem}
                onChange={(e) => setOrdem(parseInt(e.target.value) || 0)}
              />
              <div className="sm:col-span-2 flex items-end gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={raiz}
                    onChange={(e) => setRaiz(e.target.checked)}
                    className="rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm text-brand-text">Pergunta raiz (início do fluxo)</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-brand-text">Respostas (obrigatório: SIM e NÃO)</div>
              </div>
              {respostas.map((r, i) => (
                <div key={i} className="rounded-xl border border-brand-border p-4 bg-brand-surface/50">
                  <div className="mb-3 flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.resposta === "SIM" ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-border/50"}`}>
                      {r.resposta}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold tracking-wide text-brand-muted">
                        Próxima pergunta (ID)
                      </label>
                      <input
                        type="number"
                        value={r.proximaPerguntaId}
                        onChange={(e) => updateResposta(i, "proximaPerguntaId", e.target.value)}
                        placeholder="ID da próxima pergunta"
                        className="w-full rounded-xl border border-brand-border p-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold tracking-wide text-brand-muted">
                        Especialidade final
                      </label>
                      <select
                        value={r.especialidadeId}
                        onChange={(e) => updateResposta(i, "especialidadeId", e.target.value)}
                        className="w-full rounded-xl border border-brand-border p-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
                      >
                        <option value="">— Selecione —</option>
                        {especialidades.map(e => (
                          <option key={e.id} value={e.id}>{e.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-brand-muted">
                    Preencha <strong>apenas um</strong> dos campos acima
                  </p>
                </div>
              ))}
            </div>

            {especialidades.length > 0 && !raiz && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold tracking-wide text-brand-muted">
                  Ou especialidade direta (se for pergunta final/folha)
                </label>
                <select
                  value={especialidadeId}
                  onChange={(e) => setEspecialidadeId(e.target.value)}
                  className="w-full rounded-xl border border-brand-border p-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
                >
                  <option value="">— Nenhuma (pergunta intermediária) —</option>
                  {especialidades.map(e => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </BaseModal>

        {/* Modal Visualização */}
        {visualizando && (
          <BaseModal
            isOpen={true}
            onClose={() => setVisualizando(null)}
            title="Triagem"
            subtitle="DETALHES DA PERGUNTA"
            confirmText="Fechar"
            onConfirm={() => setVisualizando(null)}
            showCancel={false}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-brand-primary/10 text-brand-primary">
                  {visualizando.raiz ? "RAIZ" : `Ordem ${visualizando.ordem}`}
                </span>
                <span className="font-semibold text-brand-text">{visualizando.texto}</span>
              </div>
              <div className="grid gap-2">
                {visualizando.respostas?.map(r => (
                  <div key={r.id} className="rounded-lg border border-brand-border p-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.resposta === "SIM" ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-border/50"}`}>
                        {r.resposta}
                      </span>
                      <ChevronRight size={16} className="text-brand-muted" />
                      {r.proximaPergunta ? (
                        <span className="text-sm text-brand-text">
                          → Pergunta: {r.proximaPergunta.texto}
                        </span>
                      ) : r.especialidade ? (
                        <span className="px-2 py-0.5 rounded bg-status-confirmado/10 text-status-confirmado text-xs font-medium">
                          → {r.especialidade.nome}
                        </span>
                      ) : (
                        <span className="text-sm text-brand-muted">(sem destino)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </BaseModal>
        )}

        {/* Modal Confirmação Exclusão */}
        <BaseModal
          isOpen={!!perguntaParaExcluir}
          onClose={() => setPerguntaParaExcluir(null)}
          title="Triagem"
          subtitle="EXCLUIR PERGUNTA"
          confirmText="Sim, excluir"
          cancelText="Cancelar"
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          loading={submitting}
        >
          <div className="text-center py-4 font-heading text-xl font-bold text-[#333E33]">
            TEM CERTEZA DE QUE DESEJA EXCLUIR ESTA PERGUNTA?
          </div>
          <p className="text-center text-sm text-brand-muted">
            {perguntaParaExcluir?.texto}
          </p>
          <p className="mt-2 text-center text-xs text-amber-600">
            Isso também removerá todas as respostas vinculadas.
          </p>
        </BaseModal>
      </div>
    </div>
  );
}

export default GerenciamentoTriagem;
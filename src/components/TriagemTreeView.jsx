import { ChevronRight, CheckCircle2, HelpCircle, MinusCircle } from "lucide-react";

function getSpecialtyName(resposta, especialidades) {
  if (resposta.especialidade) return resposta.especialidade.nome;
  if (resposta.especialidadeId) {
    const esp = especialidades.find(e => e.id === resposta.especialidadeId);
    return esp?.nome || `ID ${resposta.especialidadeId}`;
  }
  return null;
}

function getNextQuestionText(resposta, perguntasMap) {
  if (resposta.proximaPergunta) return resposta.proximaPergunta.texto;
  if (resposta.proximaPerguntaId) {
    const p = perguntasMap.get(resposta.proximaPerguntaId);
    return p?.texto || `P${resposta.proximaPerguntaId}`;
  }
  return null;
}

function ResponseCard({ resposta, especialidades, perguntasMap, onEdit, onView, onDelete }) {
  const isSim = resposta.resposta === "SIM";
  const specialtyName = getSpecialtyName(resposta, especialidades);
  const hasChildQuestion = !!resposta.proximaPergunta || !!resposta.proximaPerguntaId;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition ${isSim ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
      <div className={`flex-shrink-0 w-20 px-2 py-1 rounded text-center text-xs font-bold ${isSim ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
        {isSim ? "SIM" : "NÃO"}
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ChevronRight size={16} className="text-brand-muted flex-shrink-0" />
          
          {hasChildQuestion ? (
            <>
              <span className="font-medium text-brand-text truncate flex-1 min-w-0">
                → {getNextQuestionText(resposta, perguntasMap) || "Próxima pergunta"}
              </span>
            </>
          ) : specialtyName ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CheckCircle2 size={18} className="text-status-confirmado flex-shrink-0" />
              <span className="font-medium text-brand-text truncate">{specialtyName}</span>
              <span className="px-2 py-0.5 rounded-full bg-status-confirmado/10 text-status-confirmado text-xs font-medium">
                FIM
              </span>
            </div>
          ) : (
            <span className="text-brand-muted italic text-sm">(sem destino)</span>
          )}
        </div>
        
        {/* Render child question recursively */}
        {hasChildQuestion && (
          <div className="ml-7 mt-2 border-l-2 border-brand-border/30 pl-3">
            <QuestionCard
              pergunta={resposta.proximaPergunta || perguntasMap.get(resposta.proximaPerguntaId)}
              especialidades={especialidades}
              perguntasMap={perguntasMap}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({ pergunta, especialidades, perguntasMap, onEdit, onView, onDelete }) {
  const isRoot = pergunta.raiz === true || pergunta.raiz === 'true' || pergunta.raiz === 1 || pergunta.ordem === 1;

  return (
    <div className="relative">
      <div className={`rounded-2xl border p-4 shadow-sm ${isRoot ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-white"}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${isRoot ? "bg-brand-primary text-white" : "bg-brand-border text-brand-text"}`}>
              {isRoot ? "RAIZ" : `P${pergunta.ordem || pergunta.id}`}
            </span>
            <span className="font-semibold text-brand-text truncate">{pergunta.texto}</span>
            {pergunta.especialidade && (
              <span className="px-2 py-0.5 rounded-full bg-status-confirmado/10 text-status-confirmado text-xs font-medium ml-2">
                FIM → {pergunta.especialidade.nome}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onView?.(pergunta)} className="p-1.5 rounded hover:bg-brand-bg text-brand-muted" title="Ver">
              <HelpCircle size={16} />
            </button>
            <button onClick={() => onEdit?.(pergunta)} className="p-1.5 rounded hover:bg-brand-bg text-brand-muted" title="Editar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={() => onDelete?.(pergunta)} className="p-1.5 rounded hover:bg-brand-bg text-status-cancelado" title="Excluir">
              <MinusCircle size={16} />
            </button>
          </div>
        </div>

        {pergunta.respostas && pergunta.respostas.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-brand-border/50">
            {pergunta.respostas.map((resposta, idx) => (
              <ResponseCard 
                key={`${pergunta.id}-${idx}`} 
                resposta={resposta} 
                especialidades={especialidades} 
                perguntasMap={perguntasMap}
                onEdit={onEdit}
                onView={onView}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {!pergunta.respostas?.length && !pergunta.especialidade && !isRoot && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-center text-xs text-amber-700">
            Sem respostas configuradas
          </div>
        )}
      </div>
    </div>
  );
}

export function TriagemTreeView({ 
  perguntas, 
  especialidades, 
  onEdit, 
  onView, 
  onDelete 
}) {
  console.log('[TriagemTreeView] recebido:', { 
    perguntasCount: perguntas?.length, 
    perguntas: perguntas?.map(p => ({ id: p.id, texto: p.texto, raiz: p.raiz, respostasCount: p.respostas?.length, respostas: p.respostas })),
    especialidadesCount: especialidades?.length 
  });
  const perguntasMap = new Map(perguntas.map(p => [p.id, p]));
  
  // Build tree structure
  const buildTree = () => {
    const map = new Map(perguntas.map(p => [p.id, { ...p, children: [] }]));
    const roots = [];
    perguntas.forEach(p => {
      const isRaiz = p.raiz === true || p.raiz === 'true' || p.raiz === 1 || p.ordem === 1;
      if (isRaiz) {
        roots.push(map.get(p.id));
      } else {
        perguntas.forEach(parent => {
          (parent.respostas || []).forEach(r => {
            if (r.proximaPerguntaId === p.id) {
              map.get(parent.id).children.push(map.get(p.id));
            }
          });
        });
      }
    });
    // Fallback: se não achou raiz, usa a primeira (ordem 1 ou id 1)
    if (roots.length === 0 && perguntas.length > 0) {
      const first = perguntas.find(p => p.ordem === 1 || p.id === 1) || perguntas[0];
      roots.push(map.get(first.id));
    }
    console.log('[TriagemTreeView] buildTree roots:', roots.map(r => ({ id: r.id, raiz: r.raiz, ordem: r.ordem })));
    return roots;
  };

  const roots = buildTree();

  if (!perguntas.length) {
    console.log('[TriagemTreeView] PERGUNTAS VAZIO');
    return (
      <div className="text-center py-12 text-brand-muted">
        <HelpCircle size={48} className="mx-auto mb-4 text-brand-border" />
        <p className="font-medium">Nenhuma pergunta cadastrada</p>
        <p className="text-sm">Clique em "Nova pergunta" para criar a primeira</p>
      </div>
    );
  }
  
  console.log('[TriagemTreeView] roots finais:', roots.map(r => ({ id: r.id, texto: r.texto, respostas: r.respostas?.length })));

  return (
    <div className="w-full pb-8">
      <div className="flex gap-6 min-w-max items-start">
        {roots.map((root) => (
          <div key={root.id} className="flex flex-col items-start">
            <QuestionCard
              pergunta={root}
              especialidades={especialidades}
              perguntasMap={perguntasMap}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TriagemTreeView;
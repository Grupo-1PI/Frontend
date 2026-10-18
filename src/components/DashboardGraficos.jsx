const numero = valor => Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export function GraficoSemana({ dados }) {
  if (!Array.isArray(dados)) return <p className="dashboard-vazio">Dados indisponíveis no momento.</p>;
  const nomes = [
    ["Sunday", "Domingo"], ["Monday", "Segunda"], ["Tuesday", "Terça"],
    ["Wednesday", "Quarta"], ["Thursday", "Quinta"], ["Friday", "Sexta"], ["Saturday", "Sábado"],
  ];
  const semana = nomes.map(([ingles, portugues]) => ({
    diaSemana: portugues,
    total: Number(dados.find(d => d.diaSemana === ingles || d.diaSemana === portugues || d.diaSemana === `${portugues}-feira`)?.total ?? 0),
  }));
  const teto = Math.max(5, Math.ceil(Math.max(...semana.map(d => d.total), 0) / 5) * 5);
  return <svg viewBox="0 0 460 350" role="img" aria-label="Agendamentos por dia da semana">
    {Array.from({ length: 6 }, (_, i) => <g key={i}>
      <line x1="40" x2="450" y1={30 + i * 44} y2={30 + i * 44} stroke="#eadfca" />
      <text x="32" y={34 + i * 44} textAnchor="end" fontSize="10">{numero(teto * (5 - i) / 5)}</text>
    </g>)}
    {semana.map((d, i) => {
      const altura = d.total / teto * 220;
      const x = 54 + i * 57;
      return <g key={d.diaSemana}><title>{d.diaSemana}: {d.total} agendamentos</title>
        <rect x={x} y="30" width="40" height="220" rx="20" fill="#dbf0ca" />
        <rect x={x} y={250 - altura} width="40" height={altura} rx={Math.min(20, altura / 2)} fill="#43bf00" />
        <text transform={`translate(${x + 25},265) rotate(-90)`} textAnchor="end" fontSize="12">{d.diaSemana}</text>
      </g>;
    })}
  </svg>;
}

export function GraficoServicos({ dados }) {
  if (!Array.isArray(dados)) return <p className="dashboard-vazio">Dados indisponíveis no momento.</p>;
  const itens = [...dados].sort((a, b) => b.total - a.total).slice(0, 5);
  const teto = Math.max(1, ...itens.map(s => s.total));
  if (!itens.length) return <p className="dashboard-vazio">Nenhum serviço no período.</p>;
  return <div className="dashboard-servicos" role="list" aria-label="Serviços mais frequentados">
    {itens.map((s, i) => <div className="dashboard-servico" key={s.nome} role="listitem">
      <span title={s.nome}>{s.nome}</span><div className="dashboard-trilho"><div style={{ width: `${s.total / teto * 100}%`, background: ["#8460de", "#ff492c", "#43bf00"][Math.min(i, 2)] }} /></div><strong>{numero(s.total)}</strong>
    </div>)}
  </div>;
}

export function GraficoRetorno({ dados }) {
  if (!Array.isArray(dados)) return <p className="dashboard-vazio">Dados de retorno indisponíveis no momento.</p>;
  if (!dados.length) return <p className="dashboard-vazio">Nenhum retorno no período.</p>;
  const pontos = dados.map((d, i) => [40 + i * 390 / Math.max(1, dados.length - 1), 118 - Number(d.taxa)]);
  const linha = pontos.map(p => p.join(",")).join(" ");
  return <svg viewBox="0 0 460 155" role="img" aria-label="Taxa semanal de retorno de pacientes em porcentagem">
    <defs><linearGradient id="retorno-verde" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#43bf00" stopOpacity=".5" /><stop offset="100%" stopColor="#43bf00" stopOpacity=".05" /></linearGradient></defs>
    {[0, 25, 50, 75, 100].map(n => <g key={n}><line x1="40" x2="430" y1={118 - n} y2={118 - n} stroke="#eadfca" /><text x="32" y={122 - n} textAnchor="end" fontSize="10">{n}%</text></g>)}
    {pontos.length > 0 && <><polygon points={`40,118 ${linha} ${pontos.at(-1)[0]},118`} fill="url(#retorno-verde)" /><polyline points={linha} fill="none" stroke="#43bf00" strokeWidth="2" /></>}
    {pontos.map(([x, y], i) => <g key={dados[i].inicio}>
      <circle cx={x} cy={y} r="3" fill="#43bf00"><title>{dados[i].inicio} a {dados[i].fim}: {numero(dados[i].taxa)}% ({dados[i].retornantes}/{dados[i].pacientes})</title></circle>
      {(dados.length <= 10 || i % Math.ceil(dados.length / 8) === 0 || i === dados.length - 1) && <text x={x} y="140" textAnchor="middle" fontSize="10">S{i + 1}</text>}
    </g>)}
  </svg>;
}

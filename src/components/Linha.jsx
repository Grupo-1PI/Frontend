function Linha({ label, valor, last }) {
  return (
    <div className={`flex items-center justify-between py-1.5 text-sm ${last ? "" : "border-b border-brand-border/60"}`}>
      <span className="text-brand-muted">{label}</span>
      <span className="font-semibold text-brand-text text-right">{valor}</span>
    </div>
  );
}

export default Linha;

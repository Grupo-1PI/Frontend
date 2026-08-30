function Secao({ numero, titulo, children }) {
  return (
    <div className="mb-7">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
          {numero}
        </span>
        <h2 className="font-heading text-base font-semibold text-brand-text">{titulo}</h2>
      </div>
      {children}
    </div>
  );
}

export default Secao;

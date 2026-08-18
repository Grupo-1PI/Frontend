import FloatingInput from "./FloatingInput";

function CadastroForm({
  step,
  form,
  errors,
  formScrollRef,
  onChange,
  onCepBlur,
  onContinue,
  onBack,
  onSubmit,
}) {
  return (
    <form className="h-full flex flex-col items-center justify-center px-10">
      <h1 className="font-heading text-4xl font-bold text-text-dark">
        Criar Conta
      </h1>

      <span className="text-sm text-gray-500 mt-2">
        {step === 1 ? "Preencha seus dados pessoais" : "Agora informe seu endereço"}
      </span>

      <div className="flex items-center gap-2 mt-5">
        <div className={`h-2 w-10 rounded-full ${step === 1 ? "bg-[#4E6F35]" : "bg-[#A1C089]"}`} />
        <div className={`h-2 w-10 rounded-full ${step === 2 ? "bg-[#4E6F35]" : "bg-gray-300"}`} />
      </div>

      <div ref={formScrollRef} className="w-full max-h-96 overflow-y-auto pr-2 pt-2 mt-6 space-y-5">
        {step === 1 ? (
          <>
            <FloatingInput name="nome" label="Nome completo" value={form.nome} onChange={onChange} error={errors.nome} />
            <FloatingInput name="telefone" label="Telefone" value={form.telefone} onChange={onChange} error={errors.telefone} />
            <FloatingInput name="dataNascimento" label="Data de nascimento" type="date" value={form.dataNascimento} onChange={onChange} error={errors.dataNascimento} />
            <FloatingInput name="emailCadastro" label="E-mail" type="email" value={form.emailCadastro} onChange={onChange} error={errors.emailCadastro} />
            <FloatingInput name="senhaCadastro" label="Senha" type="password" value={form.senhaCadastro} onChange={onChange} error={errors.senhaCadastro} />
            <FloatingInput name="confirmarSenha" label="Confirmar senha" type="password" value={form.confirmarSenha} onChange={onChange} error={errors.confirmarSenha} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_0.7fr] gap-6 w-full">
              <FloatingInput name="cep" label="CEP" value={form.cep} onChange={onChange} onBlur={onCepBlur} error={errors.cep} />
              <FloatingInput name="uf" label="UF" value={form.uf} onChange={onChange} disabled error={errors.uf} />
            </div>
            <FloatingInput name="cidade" label="Cidade" value={form.cidade} onChange={onChange} disabled error={errors.cidade} />
            <FloatingInput name="bairro" label="Bairro" value={form.bairro} onChange={onChange} disabled error={errors.bairro} />
            <FloatingInput name="logradouro" label="Logradouro" value={form.logradouro} onChange={onChange} disabled error={errors.logradouro} />
            <FloatingInput name="numero" label="Número" value={form.numero} onChange={onChange} error={errors.numero} />
            <FloatingInput name="complemento" label="Complemento" value={form.complemento} onChange={onChange} />
          </>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        {step === 2 && <button type="button" onClick={onBack} className="btn-login bg-[#6B7280] hover:bg-[#4B5563]">Voltar</button>}
        <button type="button" onClick={step === 1 ? onContinue : onSubmit} className="btn-login">
          {step === 1 ? "Continuar" : "Finalizar"}
        </button>
      </div>
    </form>
  );
}

export default CadastroForm;

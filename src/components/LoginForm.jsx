import FloatingInput from "./FloatingInput";

function LoginForm({ form, errors, onChange, onSubmit }) {
  return (
    <form className="h-full flex flex-col items-center justify-center px-10">
      <h1 className="font-heading text-4xl font-bold text-text-dark">Entrar</h1>
      <span className="text-sm text-gray-500 mt-2">
        Digite seu e-mail e senha para acessar
      </span>

      <div className="w-full mt-8 space-y-5">
        <FloatingInput name="emailLogin" label="E-mail" type="email" value={form.emailLogin} onChange={onChange} error={errors.emailLogin} />
        <FloatingInput name="senhaLogin" label="Senha" type="password" value={form.senhaLogin} onChange={onChange} error={errors.senhaLogin} />
      </div>

      <a href="#" className="text-sm text-gray-600 mt-4 hover:text-[#4E6F35] transition">
        Esqueceu sua senha?
      </a>
      <button type="button" onClick={onSubmit} className="btn-login mt-5">Entrar</button>
    </form>
  );
}

export default LoginForm;

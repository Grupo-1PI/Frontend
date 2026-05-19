import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function onlyNumbers(value) {
  return value.replace(/\D/g, "");
}

function maskPhone(value) {
  const numbers = onlyNumbers(value).slice(0, 11);

  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }

  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function maskCep(value) {
  return onlyNumbers(value)
    .slice(0, 8)
    .replace(/(\d{5})(\d{0,3})/, "$1-$2");
}

function FloatingInput({
  label,
  type = "text",
  name,
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
}) {
  return (
    <div className="relative w-full">
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder=" "
        className={`input-floating peer ${error ? "border-red-500" : ""}`}
      />

      <label htmlFor={name} className="label-floating">
        {label}
      </label>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function LoginCadastro({ initialMode = "login" }) {
  const [isRegister, setIsRegister] = useState(initialMode === "register");
  const [step, setStep] = useState(1);
  const formScrollRef = useRef(null);

  const [form, setForm] = useState({
    nome: "",
    emailCadastro: "",
    telefone: "",
    dataNascimento: "",
    cep: "",
    uf: "",
    cidade: "",
    bairro: "",
    logradouro: "",
    numero: "",
    complemento: "",
    senhaCadastro: "",
    confirmarSenha: "",
    emailLogin: "",
    senhaLogin: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setIsRegister(initialMode === "register");
  }, [initialMode]);

  function handleContinuar() {
    if (!validarEtapa1()) return;

    setStep(2);

    setTimeout(() => {
      formScrollRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 50);
  }

  async function buscarCep() {
    const cepLimpo = onlyNumbers(form.cep);

    if (cepLimpo.length !== 8) {
      setErrors((prev) => ({
        ...prev,
        cep: "CEP inválido",
      }));
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        setErrors((prev) => ({
          ...prev,
          cep: "CEP não encontrado",
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        uf: data.uf || "",
        cidade: data.localidade || "",
        bairro: data.bairro || "",
        logradouro: data.logradouro || "",
      }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        cep: "Erro ao buscar CEP",
      }));
    }
  }

  function validarEtapa1() {
    const newErrors = {};

    if (!form.nome.trim()) newErrors.nome = "Nome obrigatório";
    if (onlyNumbers(form.telefone).length < 10) newErrors.telefone = "Telefone inválido";
    if (!form.dataNascimento) newErrors.dataNascimento = "Data obrigatória";
    if (!form.emailCadastro.includes("@")) newErrors.emailCadastro = "E-mail inválido";
    if (form.senhaCadastro.length < 6) newErrors.senhaCadastro = "Mínimo de 6 caracteres";

    if (form.senhaCadastro !== form.confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validarEtapa2() {
    const newErrors = {};

    if (onlyNumbers(form.cep).length !== 8) newErrors.cep = "CEP inválido";
    if (!form.uf.trim()) newErrors.uf = "UF obrigatória";
    if (!form.cidade.trim()) newErrors.cidade = "Cidade obrigatória";
    if (!form.bairro.trim()) newErrors.bairro = "Bairro obrigatório";
    if (!form.logradouro.trim()) newErrors.logradouro = "Logradouro obrigatório";
    if (!form.numero.trim()) newErrors.numero = "Número obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validarLogin() {
    const newErrors = {};

    if (!form.emailLogin.includes("@")) newErrors.emailLogin = "E-mail inválido";
    if (!form.senhaLogin.trim()) newErrors.senhaLogin = "Senha obrigatória";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    let newValue = value;

    if (name === "telefone") newValue = maskPhone(value);
    if (name === "cep") newValue = maskCep(value);

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }

  function handleCadastro() {
    if (!validarEtapa2()) return;

    const dadosCadastro = {
      nome: form.nome,
      email: form.emailCadastro,
      telefone: form.telefone,
      dataNascimento: form.dataNascimento,
      senha: form.senhaCadastro,
      cep: form.cep,
      uf: form.uf,
      cidade: form.cidade,
      bairro: form.bairro,
      logradouro: form.logradouro,
      numero: form.numero,
      complemento: form.complemento,
    };

    console.log("Cadastro válido:", dadosCadastro);
  }

  function handleLogin() {
    if (!validarLogin()) return;

    console.log("Login válido:", {
      email: form.emailLogin,
      senha: form.senhaLogin,
    });
  }

  function abrirCadastro() {
    setIsRegister(true);
    setStep(1);
    setErrors({});
  }

  function abrirLogin() {
    setIsRegister(false);
    setStep(1);
    setErrors({});
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <section className="relative w-[85vw] max-w-5xl h-160 bg-white rounded-[30px] shadow-2xl overflow-hidden">
        <div
          className={`
            absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out
            ${isRegister
              ? "translate-x-full opacity-100 z-20 pointer-events-auto"
              : "translate-x-0 opacity-0 -z-10 pointer-events-none"
            }
          `}
        >
          <form className="h-full flex flex-col items-center justify-center px-10">
            <h1 className="text-4xl font-bold text-text-dark">
              Criar Conta
            </h1>

            <span className="text-sm text-gray-500 mt-2">
              {step === 1
                ? "Preencha seus dados pessoais"
                : "Agora informe seu endereço"}
            </span>

            <div className="flex items-center gap-2 mt-5">
              <div className={`h-2 w-10 rounded-full ${step === 1 ? "bg-[#4E6F35]" : "bg-[#A1C089]"}`} />
              <div className={`h-2 w-10 rounded-full ${step === 2 ? "bg-[#4E6F35]" : "bg-gray-300"}`} />
            </div>

            <div
              ref={formScrollRef}
              className="w-full max-h-96 overflow-y-auto pr-2 pt-2 mt-6 space-y-5"
            >
              {step === 1 && (
                <>
                  <FloatingInput
                    name="nome"
                    label="Nome completo"
                    value={form.nome}
                    onChange={handleChange}
                    error={errors.nome}
                  />

                  <FloatingInput
                    name="telefone"
                    label="Telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    error={errors.telefone}
                  />

                  <FloatingInput
                    name="dataNascimento"
                    label="Data de nascimento"
                    type="date"
                    value={form.dataNascimento}
                    onChange={handleChange}
                    error={errors.dataNascimento}
                  />

                  <FloatingInput
                    name="emailCadastro"
                    label="E-mail"
                    type="email"
                    value={form.emailCadastro}
                    onChange={handleChange}
                    error={errors.emailCadastro}
                  />

                  <FloatingInput
                    name="senhaCadastro"
                    label="Senha"
                    type="password"
                    value={form.senhaCadastro}
                    onChange={handleChange}
                    error={errors.senhaCadastro}
                  />

                  <FloatingInput
                    name="confirmarSenha"
                    label="Confirmar senha"
                    type="password"
                    value={form.confirmarSenha}
                    onChange={handleChange}
                    error={errors.confirmarSenha}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-[1fr_0.7fr] gap-6 w-full">
                    <FloatingInput
                      name="cep"
                      label="CEP"
                      value={form.cep}
                      onChange={handleChange}
                      onBlur={buscarCep}
                      error={errors.cep}
                    />

                    <FloatingInput
                      name="uf"
                      label="UF"
                      value={form.uf}
                      onChange={handleChange}
                      disabled
                      error={errors.uf}
                    />
                  </div>

                  <FloatingInput
                    name="cidade"
                    label="Cidade"
                    value={form.cidade}
                    onChange={handleChange}
                    disabled
                    error={errors.cidade}
                  />

                  <FloatingInput
                    name="bairro"
                    label="Bairro"
                    value={form.bairro}
                    onChange={handleChange}
                    disabled
                    error={errors.bairro}
                  />

                  <FloatingInput
                    name="logradouro"
                    label="Logradouro"
                    value={form.logradouro}
                    onChange={handleChange}
                    disabled
                    error={errors.logradouro}
                  />

                  <FloatingInput
                    name="numero"
                    label="Número"
                    value={form.numero}
                    onChange={handleChange}
                    error={errors.numero}
                  />

                  <FloatingInput
                    name="complemento"
                    label="Complemento"
                    value={form.complemento}
                    onChange={handleChange}
                  />
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);

                    setTimeout(() => {
                      formScrollRef.current?.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }, 50);
                  }}
                  className="btn-login bg-[#6B7280] hover:bg-[#4B5563]"
                >
                  Voltar
                </button>
              )}

              <button
                type="button"
                onClick={step === 1 ? handleContinuar : handleCadastro}
                className="btn-login"
              >
                {step === 1 ? "Continuar" : "Finalizar"}
              </button>
            </div>
          </form>
        </div>

        <div
          className={`
            absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out
            ${isRegister
              ? "opacity-0 -z-10 pointer-events-none"
              : "translate-x-0 opacity-100 z-20 pointer-events-auto"
            }
          `}
        >
          <form className="h-full flex flex-col items-center justify-center px-10">
            <h1 className="text-4xl font-bold text-text-dark">
              Entrar
            </h1>

            <span className="text-sm text-gray-500 mt-2">
              Digite seu e-mail e senha para acessar
            </span>

            <div className="w-full mt-8 space-y-5">
              <FloatingInput
                name="emailLogin"
                label="E-mail"
                type="email"
                value={form.emailLogin}
                onChange={handleChange}
                error={errors.emailLogin}
              />

              <FloatingInput
                name="senhaLogin"
                label="Senha"
                type="password"
                value={form.senhaLogin}
                onChange={handleChange}
                error={errors.senhaLogin}
              />
            </div>

            <a
              href="#"
              className="text-sm text-gray-600 mt-4 hover:text-[#4E6F35] transition"
            >
              Esqueceu sua senha?
            </a>

            <button
              type="button"
              onClick={handleLogin}
              className="btn-login mt-5"
            >
              Entrar
            </button>
          </form>
        </div>

        <div
          className={`
            absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30 transition-all duration-700 ease-in-out
            ${isRegister ? "-translate-x-full" : "translate-x-0"}
          `}
        >
          <div
            className={`
              relative -left-full w-[200%] h-full bg-login-grad text-white transition-all duration-700 ease-in-out
              ${isRegister ? "translate-x-1/2" : "translate-x-0"}
            `}
          >
            <div
              className={`
                absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center text-center px-8 transition-all duration-700 ease-in-out
                ${isRegister ? "translate-x-0" : "-translate-x-2/1"}
              `}
            >
              <img src="/logo-branca.svg" alt="Logo" className="w-72 mb-5" />

              <button type="button" onClick={abrirLogin} className="btn-toggle">
                Entrar
              </button>
            </div>

            <div
              className={`
                absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center text-center px-8 transition-all duration-700 ease-in-out
                ${isRegister ? "translate-x-[200%]" : "translate-x-0"}
              `}
            >
              <img src="/logo-branca.svg" alt="Logo" className="w-72 mb-5" />

              <button
                type="button"
                onClick={abrirCadastro}
                className="btn-toggle"
              >
                Inscreva-se
              </button>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className={`
            absolute bottom-6 left-6 z-50 flex items-center gap-2 text-sm font-medium transition
            ${isRegister ? "text-white" : "text-gray-700"}
          `}
        >
          <img
            src={isRegister ? "/voltar-branco.svg" : "/voltar.svg"}
            alt="Voltar"
            className="w-6 h-6"
          />
          Voltar
        </Link>
      </section>
    </main>
  );
}

export default LoginCadastro;
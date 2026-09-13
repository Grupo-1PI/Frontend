import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CadastroForm from "../components/CadastroForm";
import LoginForm from "../components/LoginForm";
import { login, cadastrar } from "../services/auth";

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

function LoginCadastro({ initialMode = "login" }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(initialMode === "register");
  const [step, setStep] = useState(1);
  const formScrollRef = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);

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

  async function handleCadastro() {
    if (!validarEtapa2() || enviando) return;
    setEnviando(true);
    setErroGeral(null);

    // Schema "Usuario - Criação": nome, telefone, email, senha, dataNascimento, endereco{...}
    const payload = {
      nome: form.nome,
      email: form.emailCadastro,
      telefone: onlyNumbers(form.telefone),
      dataNascimento: form.dataNascimento,
      senha: form.senhaCadastro,
      endereco: {
        cep: onlyNumbers(form.cep),
        uf: form.uf,
        cidade: form.cidade,
        bairro: form.bairro,
        logradouro: form.logradouro,
        numero: form.numero,
        complemento: form.complemento || null,
      },
    };

    try {
      await cadastrar(payload);
      // Após cadastrar, loga automaticamente com as credenciais recém-criadas.
      await login(form.emailCadastro, form.senhaCadastro);
      navigate("/agendarConsulta");
    } catch (err) {
      setErroGeral(
        err.response?.status === 400
          ? "Não foi possível concluir o cadastro. Confira os dados informados."
          : "Erro ao cadastrar. Tente novamente em instantes."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function handleLogin() {
    if (!validarLogin() || enviando) return;
    setEnviando(true);
    setErroGeral(null);

    try {
      const sessao = await login(form.emailLogin, form.senhaLogin);
      // "Usuário - Token" traz tipo (ex.: "CLIENTE"/"FUNCIONARIO"), clienteId e funcionarioId.
      if (sessao.tipo === "FUNCIONARIO" || sessao.funcionarioId) {
        navigate("/agendaEquipe");
      } else {
        navigate("/agendarConsulta");
      }
    } catch (err) {
      setErroGeral(
        err.response?.status === 400 ? "E-mail ou senha inválidos." : "Erro ao entrar. Tente novamente em instantes."
      );
    } finally {
      setEnviando(false);
    }
  }

  function abrirCadastro() {
    setIsRegister(true);
    setStep(1);
    setErrors({});
    setErroGeral(null);
  }

  function abrirLogin() {
    setIsRegister(false);
    setStep(1);
    setErrors({});
    setErroGeral(null);
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 font-sans">
      <section className="relative w-[85vw] max-w-5xl h-160 bg-white rounded-[30px] shadow-2xl overflow-hidden">
        {erroGeral && (
          <div className="absolute top-4 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 rounded-lg bg-status-cancelado/10 px-4 py-2.5 text-center text-sm font-medium text-status-cancelado">
            {erroGeral}
          </div>
        )}

        <div
          className={`
            absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out
            ${isRegister
              ? "translate-x-full opacity-100 z-20 pointer-events-auto"
              : "translate-x-0 opacity-0 -z-10 pointer-events-none"
            }
          `}
        >
          <CadastroForm
            step={step}
            form={form}
            errors={errors}
            formScrollRef={formScrollRef}
            onChange={handleChange}
            onCepBlur={buscarCep}
            onContinue={handleContinuar}
            onBack={() => {
              setStep(1);
              setTimeout(() => formScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
            }}
            onSubmit={handleCadastro}
            enviando={enviando}
          />
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
          <LoginForm form={form} errors={errors} onChange={handleChange} onSubmit={handleLogin} enviando={enviando} />
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

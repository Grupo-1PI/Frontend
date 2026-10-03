import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AgendaHeader from "../components/AgendaHeader";
import ManagementHeader from "../components/ManagementHeader";
import DataTable from "../components/DataTable";
import BaseModal from "../components/BaseModal";
import FloatingInput from "../components/FloatingInput";
import CheckboxGroup from "../components/CheckboxGroup";
import AcessoNegado from "../components/AcessoNegado";
import { alerta } from "../utils/alerta";
import { getUsuarioLogado, logout } from "../services/auth";
import { podeGerenciarFuncionarios } from "../services/permissoes";
import { listarFuncionarios, listarCargos, listarEspecialidades, criarFuncionario, atualizarFuncionario, deletarFuncionario } from "../services/agendamentos";

function onlyNumbers(val = "") {
  return String(val).replace(/\D/g, "");
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

/** Regras da senha: 6+ caracteres, com letra e número. */
function validarSenha(valor) {
  const senha = valor ?? "";
  const regras = [
    { ok: senha.length >= 6, texto: "Mínimo de 6 caracteres" },
    { ok: /[a-zA-Z]/.test(senha), texto: "Ao menos uma letra" },
    { ok: /\d/.test(senha), texto: "Ao menos um número" },
  ];
  return { regras, valida: regras.every((r) => r.ok) };
}

export function GerenciamentoFuncionarios() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  const [funcionarios, setFuncionarios] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [dataNascimento, setDataNascimento] = useState("1990-01-01");
  const [cargoId, setCargoId] = useState("");
  const [especialidadesIds, setEspecialidadesIds] = useState([]);

  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [funcionarioParaExcluir, setFuncionarioParaExcluir] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const temAcesso = podeGerenciarFuncionarios();

  const carregarDados = async () => {
    if (!temAcesso) return;
    try {
      setLoading(true);
      const [funcData, cargosData, espData] = await Promise.all([
        listarFuncionarios(),
        listarCargos(),
        listarEspecialidades(),
      ]);
      setFuncionarios(funcData);
      setCargos(cargosData);
      setEspecialidades(espData);
      if (cargosData.length > 0 && !cargoId) {
        setCargoId(cargosData[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar funcionários", err);
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
    setEmail("");
    setTelefone("");
    setSenha("");
    setDataNascimento("1990-01-01");
    if (cargos.length > 0) setCargoId(cargos[0].id);
    setEspecialidadesIds([]);
    setCep("");
    setLogradouro("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setUf("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (func) => {
    setEditando(func);
    setNome(func.nome || "");
    setEmail(func.email || "");
    setTelefone(func.telefone || "");
    const cargoObj = cargos.find((c) => c.nome === func.cargo);
    if (cargoObj) setCargoId(cargoObj.id);
    const espIds = especialidades
      .filter((e) => (func.especialidades || []).includes(e.nome))
      .map((e) => e.id);
    setEspecialidadesIds(espIds);

    const endereco = func.endereco || {};
    setCep(endereco.cep || "");
    setLogradouro(endereco.logradouro || "");
    setNumero(endereco.numero || "");
    setComplemento(endereco.complemento || "");
    setBairro(endereco.bairro || "");
    setCidade(endereco.cidade || "");
    setUf(endereco.uf || endereco.estado || "");

    setIsModalOpen(true);
  };

  /** Busca o endereço real pelo CEP, igual ao cadastro de clientes. */
  const buscarCep = async () => {
    const cepLimpo = onlyNumbers(cep);
    if (cepLimpo.length !== 8) {
      alerta.aviso("Digite um CEP válido com 8 dígitos.");
      return;
    }

    try {
      setBuscandoCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        alerta.erro("CEP não encontrado.");
        return;
      }

      setLogradouro(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setUf(data.uf || "");
    } catch {
      alerta.erro("Não foi possível buscar o CEP. Tente novamente.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSave = async () => {
    if (!nome.trim() || !email.trim()) {
      alerta.aviso("Informe nome e e-mail do funcionário.");
      return;
    }

    if (!editando) {
      const { valida } = validarSenha(senha);
      if (!valida) {
        alerta.aviso("A senha não atende aos requisitos mínimos.");
        return;
      }
    }

    if (!cep.trim() || !logradouro.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !uf.trim()) {
      alerta.aviso("Preencha o endereço completo (CEP, logradouro, número, bairro, cidade e UF).");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        nome,
        email,
        telefone: telefone || "(11) 99999-9999",
        senha: senha || undefined,
        dataNascimento: dataNascimento || "1990-01-01",
        endereco: {
          cep,
          logradouro,
          numero,
          complemento: complemento || null,
          bairro,
          cidade,
          uf,
        },
        cargoId: Number(cargoId),
        especialidadesIds,
      };

      if (editando) {
        await atualizarFuncionario(editando.id, payload);
        alerta.sucesso("Funcionário atualizado com sucesso.");
      } else {
        await criarFuncionario(payload);
        alerta.sucesso("Funcionário criado com sucesso.");
      }
      setIsModalOpen(false);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao salvar funcionário", err);
      const msg = err.response?.data?.mensagem || err.response?.data?.message || "Erro ao salvar funcionário. Verifique os campos.";
      alerta.erro(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!funcionarioParaExcluir) return;
    try {
      setSubmitting(true);
      await deletarFuncionario(funcionarioParaExcluir.id);
      setFuncionarioParaExcluir(null);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao excluir funcionário", err);
      alerta.erro("Não é possível excluir este funcionário pois ele possui registros vinculados no sistema (agenda, atendimentos, etc.).");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFuncionarios = funcionarios.filter((f) =>
    (f.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.cargo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "nome", header: "Nome" },
    { key: "cargo", header: "Cargo" },
    {
      key: "especialidades",
      header: "Especialidades",
      render: (esps) => (esps?.length ? esps.join(", ") : "Nenhuma"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AgendaHeader nome={usuario?.nome ?? "Gestão"} subtitulo="Funcionários" showNav={true} onSair={async () => { await logout(); navigate("/login"); }} />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <ManagementHeader title="Funcionários" buttonText="Novo funcionário" onButtonClick={handleOpenCreate} />
        <DataTable
          columns={columns}
          data={filteredFuncionarios}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Filtrar por nome ou cargo..."
          onEdit={handleOpenEdit}
           onDelete={(func) => {
             if (func.email === usuario?.email || func.id === usuario?.funcionarioId) {
               alerta.aviso("Você não pode excluir a si mesmo.");
               return;
             }
             setFuncionarioParaExcluir(func);
           }}
          paginationInfo={`Mostrando ${filteredFuncionarios.length} de ${funcionarios.length} funcionários`}
        />

        {/* Modal Criar/Editar */}
        <BaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Funcionários"
          subtitle={editando ? "EDITAR FUNCIONÁRIO" : "CRIAR FUNCIONÁRIO"}
          confirmText={editando ? "Salvar alterações" : "Criar funcionário"}
          onConfirm={handleSave}
          loading={submitting}
        >
          <div className="space-y-4">
            <FloatingInput
              label="Nome do funcionário"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <FloatingInput
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FloatingInput
              label="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(maskPhone(e.target.value))}
            />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Cargo</label>
              <select
                value={cargoId}
                onChange={(e) => setCargoId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#333E33] outline-none focus:border-[#333E33] transition"
              >
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {!editando && (
              <div>
                <FloatingInput
                  label="Senha temporária"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />

                {senha.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {validarSenha(senha).regras.map((regra) => (
                      <li
                        key={regra.texto}
                        className={`flex items-center gap-1.5 text-xs ${
                          regra.ok ? "text-status-confirmado" : "text-gray-400"
                        }`}
                      >
                        <span
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] ${
                            regra.ok ? "bg-status-confirmado text-white" : "border border-gray-300"
                          }`}
                        >
                          {regra.ok ? "✓" : ""}
                        </span>
                        {regra.texto}
                      </li>
                    ))}
                  </ul>
                )}

                {validarSenha(senha).valida && (
                  <p className="mt-1.5 text-xs font-semibold text-status-confirmado">
                    Senha válida.
                  </p>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-brand-border bg-brand-bg p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-brand-muted">
                Endereço
              </p>

              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <FloatingInput
                      label="CEP"
                      value={cep}
                      onChange={(e) => setCep(maskCep(e.target.value))}
                      onBlur={buscarCep}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={buscarCep}
                    disabled={buscandoCep || onlyNumbers(cep).length !== 8}
                    className="mb-0.5 h-14 rounded-xl border border-[#333E33]/20 bg-white px-4 text-xs font-semibold text-[#333E33] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {buscandoCep ? "Buscando..." : "Buscar"}
                  </button>
                </div>

                <FloatingInput
                  label="Logradouro"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                />

                <div className="grid grid-cols-[1fr_0.7fr] gap-6">
                  <FloatingInput
                    label="Número"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                  <FloatingInput
                    label="Complemento"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                  />
                </div>

                <FloatingInput
                  label="Bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                />

                <div className="grid grid-cols-[1fr_0.3fr] gap-6">
                  <FloatingInput
                    label="Cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                  <FloatingInput
                    label="UF"
                    value={uf}
                    maxLength={2}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </div>
            <CheckboxGroup
              label="Selecionar Especialidades"
              items={especialidades}
              idKey="id"
              labelKey="nome"
              selectedIds={especialidadesIds}
              onChange={setEspecialidadesIds}
            />
          </div>
        </BaseModal>

        {/* Modal Confirmação Exclusão */}
        <BaseModal
          isOpen={!!funcionarioParaExcluir}
          onClose={() => setFuncionarioParaExcluir(null)}
          title="Funcionários"
          subtitle="EXCLUIR FUNCIONÁRIO"
          confirmText="Sim"
          cancelText="Não"
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          loading={submitting}
        >
          <div className="text-center py-4 font-heading text-xl font-bold text-[#333E33]">
            TEM CERTEZA DE QUE DESEJA EXCLUIR O FUNCIONÁRIO?
          </div>
        </BaseModal>
      </div>
    </div>
  );
}

export default GerenciamentoFuncionarios;

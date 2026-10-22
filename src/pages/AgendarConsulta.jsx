import { useEffect, useState } from "react";
import { Calendar, CalendarPlus, CheckCircle2, Info, ChevronDown, Sparkles, HelpCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Modal from "../components/Modal";
import AgendaHeader from "../components/AgendaHeader";
import Secao from "../components/Secao";
import Linha from "../components/Linha";
import CalendarioMensal from "../components/CalendarioMensal";
import Triagem from "../components/Triagem";
import { getUsuarioLogado, logout } from "../services/auth";
import { consultarHorarios, criarAgendamento, listarServicos, listarFuncionariosPorServico, listarFuncionariosPorEspecialidade } from "../services/agendamentos";
import { primeiroDiaDoMes, todayISO, combinarDataHora, formatDateLong, VALOR_RESERVA } from "../utils/agenda";

export function AgendarConsulta() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

  // Estados da triagem
  const [etapa, setEtapa] = useState("agendamento"); // "agendamento" | "triagem"
  const [especialidadeTriagem, setEspecialidadeTriagem] = useState(null);

  // Estados do fluxo de agendamento
  const [servicos, setServicos] = useState([]);
  const [servicoSel, setServicoSel] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [funcionarioSel, setFuncionarioSel] = useState(null);
  const [carregandoFuncionarios, setCarregandoFuncionarios] = useState(false);
  const [carregandoServicoTriagem, setCarregandoServicoTriagem] = useState(false);
  const [dataSel, setDataSel] = useState(null);
  const [mesRef, setMesRef] = useState(primeiroDiaDoMes(todayISO()));
  const [horarios, setHorarios] = useState([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [erroHorarios, setErroHorarios] = useState(null);
  const [horarioSel, setHorarioSel] = useState(null);
  const [observacaoInput, setObservacaoInput] = useState("");
  const [modalHorarios, setModalHorarios] = useState(false);
  const [confirmado, setConfirmado] = useState(null);
  const [modalSucesso, setModalSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroReserva, setErroReserva] = useState(null);

  useEffect(() => {
    if (!usuario) navigate("/login");
  }, [usuario, navigate]);

  // Carregar serviços no mount (pre-load)
  useEffect(() => {
    listarServicos().then((res) => setServicos(res || []));
  }, []);

  // Auto-selecionar serviço quando especialidadeTriagem mudar (síncrono, sem API call)
  useEffect(() => {
    if (!especialidadeTriagem) {
      setCarregandoServicoTriagem(false);
      return;
    }
    setCarregandoServicoTriagem(true);
    const servicoEspecialidade = servicos.find((s) =>
      s.especialidadesIds?.includes(especialidadeTriagem.id)
    );
    if (servicoEspecialidade) {
      setServicoSel(servicoEspecialidade);
    }
    setCarregandoServicoTriagem(false);
  }, [especialidadeTriagem, servicos]);

  // Carregar funcionários quando especialidade da triagem OU serviço mudar
  useEffect(() => {
    // Se veio da triagem: precisa ter servicoSel (auto-selecionado) para carregar
    // Se não veio da triagem: precisa ter serviço selecionado manualmente
    if (especialidadeTriagem && !servicoSel) {
      // Aguarda servicoSel ser definido (auto-seleção da triagem)
      return;
    }
    if (!especialidadeTriagem && !servicoSel) {
      setFuncionarios([]);
      setFuncionarioSel(null);
      setDataSel(null);
      return;
    }

    setCarregandoFuncionarios(true);
    setFuncionarios([]);
    setFuncionarioSel(null);
    setDataSel(null);

    const carregar = async () => {
      try {
        let lista = [];
        if (especialidadeTriagem) {
          // Fluxo triagem: profissionais da especialidade recomendada
          lista = await listarFuncionariosPorEspecialidade(especialidadeTriagem.id);
        } else if (servicoSel) {
          // Fluxo sem triagem: profissionais do serviço
          lista = await listarFuncionariosPorServico(servicoSel.id);
        }
        setFuncionarios(lista);
      } catch (err) {
        console.error("Erro ao carregar funcionários:", err);
        setFuncionarios([]);
      } finally {
        setCarregandoFuncionarios(false);
      }
    };

    carregar();
  }, [servicoSel, especialidadeTriagem]);

  useEffect(() => {
    if (!dataSel) return;
    let cancelado = false;
    setCarregandoHorarios(true);
    setErroHorarios(null);
    // Precisa ter servicoSel (auto-selecionado na triagem) e funcionarioSel
    if (servicoSel && funcionarioSel) {
      consultarHorarios(dataSel, servicoSel.id, funcionarioSel.id)
        .then((res) => {
          if (!cancelado) setHorarios((res || []).filter((h) => h.disponivel));
        })
        .catch((err) => {
          if (!cancelado) setErroHorarios(err);
        })
        .finally(() => {
          if (!cancelado) setCarregandoHorarios(false);
        });
    }
    return () => {
      cancelado = true;
    };
  }, [dataSel, servicoSel, funcionarioSel]);

  function resetFluxo() {
    setHorarioSel(null);
    setDataSel(null);
    setMesRef(primeiroDiaDoMes(todayISO()));
    setConfirmado(null);
    setModalHorarios(false);
    setModalSucesso(false);
    setObservacaoInput("");
    setErroReserva(null);
  }

  function handleTriagemConcluir(especialidade) {
    setEspecialidadeTriagem(especialidade);
    setEtapa("agendamento");
  }

  function handleTriagemVoltar() {
    setEtapa("agendamento");
  }

  function abrirTriagem() {
    setEtapa("triagem");
  }

  async function confirmarReserva() {
    if (!horarioSel || salvando) return;
    if (!servicoSel) {
      setErroReserva("Erro interno: serviço não definido.");
      return;
    }
    setSalvando(true);
    setErroReserva(null);
    try {
      const [h, m] = horarioSel.horario.split(":").map(Number);
      const fimMin = h * 60 + m + (servicoSel.tempoMedio || 60);
      const horaFim = `${String(Math.floor(fimMin / 60)).padStart(2, "0")}:${String(fimMin % 60).padStart(2, "0")}`;

      const novo = await criarAgendamento({
        dataHoraInicio: combinarDataHora(dataSel, horarioSel.horario),
        dataHoraFim: combinarDataHora(dataSel, horaFim),
        observacao: observacaoInput,
        clienteId: usuario.clienteId,
        funcionarioId: funcionarioSel.id,
        salaId: horarioSel.salaId,
        servicoId: servicoSel.id,
      });
      setConfirmado(novo);
      setModalHorarios(false);
      setModalSucesso(true);
    } catch (err) {
      setErroReserva(
        err.response?.status === 409
          ? "Esse horário acabou de ser reservado por outra pessoa. Escolha outro."
          : "Não foi possível concluir a reserva. Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  const fluxoTriagem = !!especialidadeTriagem;

  // TELA DE TRIAGEM
  if (etapa === "triagem") {
    return (
      <div className="min-h-screen bg-brand-bg">
        <AgendaHeader
          nome={usuario?.nome ?? "Paciente"}
          subtitulo="Área do paciente"
          onSair={async () => {
            await logout();
            navigate("/login");
          }}
        />
        <div className="mx-auto max-w-2xl px-5 pb-20 pt-7">
          <AbaNav ativa="agendar" />
          <Triagem onConcluir={handleTriagemConcluir} onVoltar={handleTriagemVoltar} />
        </div>
      </div>
    );
  }

  // TELA DE AGENDAMENTO
  return (
    <div className="min-h-screen bg-brand-bg">
      <AgendaHeader
        nome={usuario?.nome ?? "Paciente"}
        subtitulo="Área do paciente"
        onSair={async () => {
          await logout();
          navigate("/login");
        }}
      />

      <div className="mx-auto max-w-3xl px-5 pb-20 pt-7">
        <AbaNav ativa="agendar" />

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <Info size={18} className="mt-0.5 flex-shrink-0" />
          <p className="text-[13.5px] leading-relaxed">
            A reserva do horário tem uma taxa de <strong>R\$ {VALOR_RESERVA}</strong>. O profissional e o procedimento
            serão definidos pela clínica conforme a disponibilidade e sua avaliação. Remarcações só podem ser feitas
            até <strong>1 dia antes</strong> da consulta.
          </p>
        </div>

        {especialidadeTriagem && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-brand-primary/5 p-3 text-brand-primary">
            <CheckCircle2 size={20} className="flex-shrink-0" />
            <div>
              <div className="text-[11px] font-bold tracking-wide">ESPECIALIDADE DA TRIAGEM</div>
              <div className="font-semibold text-base">{especialidadeTriagem.nome}</div>
            </div>
            <button
              onClick={() => {
                setEspecialidadeTriagem(null);
                setEtapa("triagem");
              }}
              className="ml-auto text-sm text-brand-primary/70 hover:underline"
            >
              Refazer triagem
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Seleção de Serviço */}
          <Secao numero={fluxoTriagem ? 2 : 1} titulo="Escolha o serviço">
            {servicos.length === 0 ? (
              <p className="text-sm text-brand-muted">Carregando serviços...</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {servicos.map((servico) => (
                  <button
                    key={servico.id}
                    type="button"
                    onClick={() => {
                      setServicoSel(servico);
                      setFuncionarioSel(null);
                      setDataSel(null);
                    }}
                    className={`rounded-xl border p-3 text-left transition ${
                      servicoSel?.id === servico.id
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-brand-border hover:border-brand-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-brand-text">{servico.nome}</div>
                        <div className="text-xs text-brand-muted">
                          R\$ {servico.valor?.toFixed(2).replace(".", ",")} • {servico.tempoMedio || 50} min
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex-shrink-0 text-brand-muted hover:text-brand-text"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Secao>

          {/* Seleção de Profissional */}
          {(fluxoTriagem || servicoSel) && (
            <Secao numero={fluxoTriagem ? 1 : 2} titulo={fluxoTriagem ? "Escolha o especialista" : "Escolha o profissional"}>
              {fluxoTriagem && carregandoServicoTriagem && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3 text-brand-muted">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-primary border-t-transparent" />
                    <p className="text-sm">Carregando especialistas da especialidade...</p>
                  </div>
                </div>
              )}
              {carregandoFuncionarios ? (
                <p className="text-sm text-brand-muted">Carregando especialistas...</p>
              ) : funcionarios.length === 0 ? (
                <p className="text-sm text-brand-muted">
                  Nenhum {fluxoTriagem ? "especialista" : "profissional"} disponível para esta {fluxoTriagem ? "especialidade" : "serviço"}.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {funcionarios.map((funcionario) => (
                    <button
                      key={funcionario.id}
                      type="button"
                      onClick={() => {
                        setFuncionarioSel(funcionario);
                        setDataSel(null);
                      }}
                      className={`rounded-xl border p-3 text-left ${
                        funcionarioSel?.id === funcionario.id
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-brand-border"
                      }`}
                    >
                      <div className="font-semibold text-brand-text">{funcionario.nome}</div>
                      <div className="text-xs text-brand-muted">
                        {funcionario.especialidades?.join(", ") || "Sem especialidade"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Secao>
          )}

          {/* Calendário */}
          {funcionarioSel && (
            <div>
              <Secao numero={fluxoTriagem ? 2 : 3} titulo="Escolha um dia disponível no calendário">
                <CalendarioMensal
                  mesRef={mesRef}
                  onMudarMes={setMesRef}
                  dataSel={dataSel}
                  onSelecionarDia={(d) => {
                    setDataSel(d);
                    setHorarioSel(null);
                    setModalHorarios(true);
                  }}
                  servicoId={servicoSel.id}
                  funcionarioId={funcionarioSel.id}
                />
              </Secao>
            </div>
          )}
        </div>
      </div>

      {/* Modal: horários disponíveis para o dia selecionado */}
      {modalHorarios && dataSel && (
        <Modal onClose={() => setModalHorarios(false)}>
          <h3 className="font-heading pr-6 text-xl font-semibold text-brand-text">Horários disponíveis</h3>
          <div className="mt-1 mb-5 text-[13.5px] capitalize text-brand-muted">Para {formatDateLong(dataSel)}</div>

          {carregandoHorarios ? (
            <div className="py-4 text-sm text-brand-muted">Carregando horários...</div>
          ) : erroHorarios ? (
            <div className="py-4 text-sm text-status-cancelado">Não foi possível carregar os horários deste dia.</div>
          ) : horarios.length === 0 ? (
            <div className="py-4 text-sm text-brand-muted">Sem horários livres neste dia.</div>
          ) : (
            <div className="mb-4 grid grid-cols-3 gap-2">
              {horarios.map((h) => (
                <button
                  key={h.horario}
                  type="button"
                  onClick={() => setHorarioSel(h)}
                  className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${
                    horarioSel?.horario === h.horario
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-brand-border bg-brand-surface text-brand-text hover:border-brand-primary/50"
                  }`}
                >
                  {h.horario}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 mb-4">
            <label className="mb-2 block text-[13.5px] font-bold text-brand-text">Observações</label>
            <textarea
              value={observacaoInput}
              onChange={(e) => setObservacaoInput(e.target.value)}
              placeholder="Descreva o que você está sentindo..."
              rows={3}
              className="w-full resize-y rounded-xl border border-brand-border p-3 text-sm text-brand-text outline-none focus:border-brand-primary"
            />
          </div>

          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 text-[12.5px] leading-relaxed text-amber-900">
            <Info size={15} className="mt-0.5 flex-shrink-0" />
            <span>
              Ao reservar, será cobrada uma taxa de <strong>R\$ {VALOR_RESERVA}</strong>. Remarcações só são permitidas
              até <strong>1 dia antes</strong> do horário reservado.
            </span>
          </div>

          {erroReserva && (
            <div className="mb-4 rounded-lg bg-status-cancelado/10 p-3 text-xs text-status-cancelado">{erroReserva}</div>
          )}

          <button
            type="button"
            disabled={!horarioSel || salvando || !servicoSel}
            onClick={confirmarReserva}
            className="btn-login mb-2.5 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? "Reservando..." : "Reservar horário"}
          </button>
          <button
            type="button"
            onClick={() => setModalHorarios(false)}
            className="w-full rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
          >
            Cancelar
          </button>
        </Modal>
      )}

      {/* Modal: confirmação de sucesso */}
      {modalSucesso && confirmado && (
        <Modal onClose={() => { setModalSucesso(false); resetFluxo(); }}>
          <div className="mb-4 flex items-start gap-3 pr-6">
            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-status-confirmado/10 text-status-confirmado">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-brand-text">Horário reservado com sucesso</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-brand-muted">
                Sua reserva foi registrada. A clínica vai definir o profissional e o procedimento e entrará em contato
                antes da sua sessão.
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-2xl bg-brand-bg p-4.5">
            <div className="mb-2.5 text-[11px] font-bold tracking-wide text-brand-muted">RESUMO DA RESERVA</div>
            <Linha label="Data" valor={formatDateLong(confirmado.dataHoraInicio?.slice(0, 10) ?? dataSel)} />
            <Linha
              label="Horário"
              valor={`${confirmado.dataHoraInicio?.slice(11, 16)} – ${confirmado.dataHoraFim?.slice(11, 16)}`}
            />
            <Linha label="Especialista" valor={funcionarioSel?.nome} />
            {fluxoTriagem && <Linha label="Especialidade" valor={especialidadeTriagem?.nome} />}
            {!fluxoTriagem && <Linha label="Serviço" valor={servicoSel?.nome} />}
            <Linha label="Taxa de reserva" valor={`R$ ${VALOR_RESERVA.toFixed(2)}`} last />
          </div>

          <Link
            to="/meusAgendamentos"
            onClick={() => { setModalSucesso(false); resetFluxo(); }}
            className="btn-login mb-2.5 block w-full text-center"
          >
            Ver meus agendamentos
          </Link>
          <button
            type="button"
            onClick={() => { setModalSucesso(false); resetFluxo(); }}
            className="w-full rounded-lg border border-brand-border py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-bg"
          >
            Reservar outro horário
          </button>
        </Modal>
      )}
    {/* Botão flutuante: "Não sabe qual serviço precisa?" */}
    {etapa === "agendamento" && !fluxoTriagem && (
      <button
        onClick={abrirTriagem}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-primary/90 transition"
      >
        <HelpCircle size={18} />
        Não sabe qual serviço precisa?
      </button>
    )}

    {/* Tela de Triagem */}
    {etapa === "triagem" && (
      <Triagem onConcluir={handleTriagemConcluir} onVoltar={handleTriagemVoltar} />
    )}
  </div>
  );
};

export function AbaNav({ ativa, contadorFuturos }) {
  return (
    <div className="mb-7 flex w-fit gap-1.5 rounded-full bg-brand-border/60 p-1.5">
      <Link
        to="/agendarConsulta"
        className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
          ativa === "agendar" ? "bg-brand-surface text-brand-text shadow-sm" : "text-brand-muted"
        }`}
      >
        <CalendarPlus size={16} /> Agendar
      </Link>
      <Link
        to="/meusAgendamentos"
        className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
          ativa === "meus" ? "bg-brand-surface text-brand-text shadow-sm" : "text-brand-muted"
        }`}
      >
        <Calendar size={16} /> Meus agendamentos
        {!!contadorFuturos && (
          <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[11px] font-bold text-white">
            {contadorFuturos}
          </span>
        )}
      </Link>
    </div>
  );
}

export default AgendarConsulta;
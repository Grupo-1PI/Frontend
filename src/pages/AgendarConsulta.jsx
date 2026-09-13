import { useEffect, useState } from "react";
import { Calendar, CalendarPlus, CheckCircle2, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Modal from "../components/Modal";
import AgendaHeader from "../components/AgendaHeader";
import Secao from "../components/Secao";
import Linha from "../components/Linha";
import CalendarioMensal from "../components/CalendarioMensal";
import { getUsuarioLogado, logout } from "../services/auth";
import { consultarHorarios, criarAgendamento } from "../services/agendamentos";
import { primeiroDiaDoMes, todayISO, combinarDataHora, formatDateLong, VALOR_RESERVA } from "../utils/agenda";

export function AgendarConsulta() {
  const navigate = useNavigate();
  const usuario = getUsuarioLogado();

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

  useEffect(() => {
    if (!dataSel) return;
    let cancelado = false;
    setCarregandoHorarios(true);
    setErroHorarios(null);
    consultarHorarios(dataSel)
      .then((res) => {
        if (!cancelado) setHorarios((res || []).filter((h) => h.disponivel));
      })
      .catch((err) => {
        if (!cancelado) setErroHorarios(err);
      })
      .finally(() => {
        if (!cancelado) setCarregandoHorarios(false);
      });
    return () => {
      cancelado = true;
    };
  }, [dataSel]);

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

  async function confirmarReserva() {
    if (!horarioSel || salvando) return;
    setSalvando(true);
    setErroReserva(null);
    try {
      // Duração padrão de 1h para o bloco de reserva — o procedimento real
      // (e portanto a duração final) é definido pela clínica depois, junto
      // com o profissional e a sala que vão atender.
      const [h, m] = horarioSel.split(":").map(Number);
      const fimMin = h * 60 + m + 60;
      const horaFim = `${String(Math.floor(fimMin / 60)).padStart(2, "0")}:${String(fimMin % 60).padStart(2, "0")}`;

      const novo = await criarAgendamento({
        dataHoraInicio: combinarDataHora(dataSel, horarioSel),
        dataHoraFim: combinarDataHora(dataSel, horaFim),
        observacao: observacaoInput,
        clienteId: usuario.clienteId,
        funcionarioId: 1,
        salaId: 1,
        servicoId: 1,
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

  return (
    <div className="min-h-screen bg-brand-bg">
      <AgendaHeader nome={usuario?.nome ?? "Paciente"} subtitulo="Área do paciente" onSair={async () => { await logout(); navigate("/login"); }} />

      <div className="mx-auto max-w-3xl px-5 pb-20 pt-7">
        <AbaNav ativa="agendar" />

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <Info size={18} className="mt-0.5 flex-shrink-0" />
          <p className="text-[13.5px] leading-relaxed">
            A reserva do horário tem uma taxa de <strong>R$ {VALOR_RESERVA}</strong>. O profissional e o procedimento
            serão definidos pela clínica conforme a disponibilidade e sua avaliação. Remarcações só podem ser feitas
            até <strong>1 dia antes</strong> da consulta.
          </p>
        </div>

        <div>
          <Secao numero={1} titulo="Escolha um dia disponível no calendário">
            <CalendarioMensal
              mesRef={mesRef}
              onMudarMes={setMesRef}
              dataSel={dataSel}
              onSelecionarDia={(d) => {
                setDataSel(d);
                setHorarioSel(null);
                setModalHorarios(true);
              }}
            />
          </Secao>
        </div>
      </div>

      {/* Modal: horários disponíveis para o dia selecionado */}
      {modalHorarios && dataSel && (
        <Modal onClose={() => setModalHorarios(false)}>
          <h3 className="font-heading pr-6 text-xl font-semibold text-brand-text">Horários disponíveis</h3>
          <div className="mt-1 mb-5 text-[13.5px] capitalize text-brand-muted">Para o dia {formatDateLong(dataSel)}</div>

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
                  onClick={() => setHorarioSel(h.horario)}
                  className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${
                    horarioSel === h.horario
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
              Ao reservar, será cobrada uma taxa de <strong>R$ {VALOR_RESERVA}</strong>. Remarcações só são permitidas
              até <strong>1 dia antes</strong> do horário reservado.
            </span>
          </div>

          {erroReserva && (
            <div className="mb-4 rounded-lg bg-status-cancelado/10 p-3 text-xs text-status-cancelado">{erroReserva}</div>
          )}

          <button
            type="button"
            disabled={!horarioSel || salvando}
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
    </div>
  );
}

/**
 * Navegação compartilhada entre as duas telas do cliente.
 * Exportada para reaproveitar em MeusAgendamentos.jsx.
 */
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

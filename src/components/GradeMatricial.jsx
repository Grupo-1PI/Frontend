import React from "react";

export function GradeMatricial({ dias = [], horarios = [], agendamentos = [], onSelectAgendamento }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#333E33] bg-white shadow-sm">
      <table
        className="w-full border-collapse text-left"
        style={{ minWidth: 120 + dias.length * 130 }}
      >
        <thead>
          <tr className="bg-[#333E33] text-white text-[11px] font-bold uppercase tracking-wider">
            <th className="p-3 border-r border-[#4A5A4A] w-24 text-center">Horário</th>
            {dias.map((dia, idx) => (
              <th key={idx} className="p-3 border-r border-[#4A5A4A] text-center last:border-r-0">
                <div className="font-bold">{dia.nome}</div>
                <div className="text-[10px] font-normal opacity-80">{dia.data}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-xs text-[#333E33]">
          {horarios.map((horario, hIdx) => {
            if (horario === "12:00") {
              return (
                <tr key={hIdx} className="bg-gray-100">
                  <td className="p-2 text-center font-bold text-[11px] text-gray-500 border-r border-gray-200">
                    12:00<br />INTERVALO
                  </td>
                  <td colSpan={dias.length} className="p-2 text-center font-bold tracking-widest text-gray-400 uppercase bg-gray-100 text-[11px]">
                    I N T E R V A L O
                  </td>
                </tr>
              );
            }

            return (
              <tr key={hIdx} className="h-18">
                <td className="p-3 text-center font-bold text-[11px] text-gray-500 border-r border-gray-200 bg-gray-50/50 align-top">
                  {horario}
                </td>
                {dias.map((dia, dIdx) => {
                  const cellAgs = agendamentos.filter((a) => {
                    if (!a.dataHoraInicio) return false;
                    const dataA = a.dataHoraInicio.slice(0, 10);
                    const horaA = a.dataHoraInicio.slice(11, 16);
                    return dataA === dia.isoDate && horaA.startsWith(horario.slice(0, 2)) && a.statusNome !== "Cancelado";
                  });

                  return (
                    <td key={dIdx} className="p-1.5 border-r border-gray-200 last:border-r-0 align-top relative group">
                      <div className="space-y-1.5">
                        {cellAgs.map((ag, agIdx) => (
                          <div
                            key={ag.id || agIdx}
                            onClick={() => onSelectAgendamento && onSelectAgendamento(ag)}
                            className="rounded-lg border-2 border-[#333E33] bg-white p-2 shadow-xs cursor-pointer hover:bg-gray-50 transition flex flex-col justify-between"
                          >
                            <div>
                              <div className="text-[11px] font-bold text-[#333E33] uppercase truncate">
                                {ag.clienteNome || "Paciente"}
                              </div>
                              <div className="text-[10px] text-gray-600 truncate mt-0.5">
                                {ag.servicoNome || ag.servicos?.[0] || "Acupuntura"}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[9px] font-semibold tracking-wider text-gray-400 uppercase truncate max-w-[70px]">
                                {ag.salaDescricao || "SALA 01"}
                              </span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${ag.statusNome === 'Confirmado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                {ag.statusNome || "Agendado"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default GradeMatricial;

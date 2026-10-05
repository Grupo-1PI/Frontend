import { useEffect, useState } from "react";
import Home from './pages/Home';
import LoginCadastro from "./pages/LoginCadastro";
import { AgendarConsulta } from "./pages/AgendarConsulta";
import { MeusAgendamentos } from "./pages/MeusAgendamentos";
import { GerenciamentoHub } from "./pages/GerenciamentoHub";
import { GerenciamentoSalas } from "./pages/GerenciamentoSalas";
import { GerenciamentoServicos } from "./pages/GerenciamentoServicos";
import { GerenciamentoEspecialidades } from "./pages/GerenciamentoEspecialidades";
import { GerenciamentoCargos } from "./pages/GerenciamentoCargos";
import { GerenciamentoFuncionarios } from "./pages/GerenciamentoFuncionarios";
import { DisponibilidadeEquipe } from "./pages/DisponibilidadeEquipe";
import { DashboardGerencial } from "./pages/DashboardGerencial";
import { AgendaClinica } from "./pages/AgendaClinica";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Alertas from "./components/Alertas";


function App() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const isChangingPage = location.pathname !== displayLocation.pathname;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayLocation(location);
    }, 300);

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <>
      <Alertas />
      {isChangingPage && <div className="route-progress" />}

      <div key={displayLocation.pathname}>
        <Routes location={displayLocation}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginCadastro initialMode="login" />} />
          <Route path="/cadastro" element={<LoginCadastro initialMode="register" />} />
          <Route path="/agendarConsulta" element={<AgendarConsulta /> }/>
          <Route path="/meusAgendamentos" element={<MeusAgendamentos /> }/>
          <Route path="/gerenciamento" element={<GerenciamentoHub />} />
          <Route path="/gerenciamento/salas" element={<GerenciamentoSalas />} />
          <Route path="/gerenciamento/servicos" element={<GerenciamentoServicos />} />
          <Route path="/gerenciamento/especialidades" element={<GerenciamentoEspecialidades />} />
          <Route path="/gerenciamento/cargos" element={<GerenciamentoCargos />} />
          <Route path="/gerenciamento/funcionarios" element={<GerenciamentoFuncionarios />} />
          <Route path="/disponibilidade" element={<DisponibilidadeEquipe />} />
          <Route path="/dashboard" element={<DashboardGerencial />} />
          <Route path="/agendamentos" element={<AgendaClinica />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  )
}

export default App

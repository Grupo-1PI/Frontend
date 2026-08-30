import { useEffect, useState } from "react";
import Home from './pages/Home';
import LoginCadastro from "./pages/LoginCadastro";
import AgendamentoCliente from "./pages/AgendamentoCliente";
import { AgendaEquipe } from "./pages/AgendaEquipe";
import { Routes, Route, useLocation } from "react-router-dom";


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
      {isChangingPage && <div className="route-progress" />}

      <div key={displayLocation.pathname}>
        <Routes location={displayLocation}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginCadastro initialMode="login" />} />
          <Route path="/cadastro" element={<LoginCadastro initialMode="register" />} />
          <Route path="/agendamentoCliente" element={<AgendamentoCliente /> }/>
          <Route path="/agendaEquipe" element={<AgendaEquipe /> }/>
        </Routes>
      </div>
    </>
  )
}

export default App

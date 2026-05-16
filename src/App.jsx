import Home from './pages/Home'
import LoginCadastro from "./pages/LoginCadastro";
import { Routes, Route } from "react-router-dom";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginCadastro initialMode="login" />} />
      <Route path="/cadastro" element={<LoginCadastro initialMode="register" />} />
    </Routes>
  )
}

export default App

import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export function AcessoNegado() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 border border-gray-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-100 text-status-cancelado flex items-center justify-center mx-auto">
          <ShieldAlert size={28} />
        </div>
        <h2 className="font-heading text-2xl font-bold text-[#333E33]">Acesso Negado</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Você não possui permissão para acessar esta tela ou realizar esta operação. Entre em contato com o administrador da clínica.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full rounded-xl bg-[#333E33] text-white py-3 text-sm font-semibold hover:bg-[#252E25] transition shadow-sm"
        >
          Voltar à tela anterior
        </button>
      </div>
    </div>
  );
}

export default AcessoNegado;

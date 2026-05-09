import React from 'react'
import { ArrowLeft } from "lucide-react";
import { Link } from 'react-router-dom';
function Home() {
  return (

  <div className="min-h-screen bg-background flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-5xl">
        <button
          className="text-background-secondary hover:opacity-70 transition"
        >
          <ArrowLeft size={32} strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-full">
        <img
          src="/logo.svg"
          alt="Tao Tenshin"
          className="w-2xl max-w-full mb-10"
        />

        <h1 className="text-4xl font-bold text-black text-center mb-2">
          Olá, bem-vindo à Tao Tenshin
        </h1>

        <p className="text-center text-gray-500 text-xl max-w-md leading-relaxed mb-10">
          Sua jornada para o equilíbrio e bem-estar começa aqui.
        </p>

        <div className="w-full max-w-4xl flex flex-col gap-5">
          <Link to="/cadastro"
            className="bg-background-secondary text-white text-2xl font-semibold py-5 pl-2 rounded-2xl hover:opacity-90 transition"
          >
            Cadastrar
          </Link>

          <Link to="/login"
            className="border-2 border-background-secondary text-background-secondary text-2xl font-semibold py-5 pl-2 rounded-2xl hover:bg-background-secondary  hover:text-white transition"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home 
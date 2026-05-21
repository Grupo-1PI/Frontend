import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="min-h-screen bg-background px-5 py-6 font-sans text-text-dark sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-6xl flex-col">
        <header className="flex items-center">
          <a
            href="https://www.taotenshin.com.br"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-background-secondary transition hover:bg-white/50"
            aria-label="Voltar para o site Tao Tenshin"
          >
            <ArrowLeft size={30} strokeWidth={2.2} />
          </a>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex justify-center lg:justify-start">
            <img
              src="/logo.svg"
              alt="Tao Tenshin"
              className="w-full max-w-[480px] sm:max-w-[560px]"
            />
          </div>

          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
            <span className="mb-4 block text-sm font-semibold uppercase tracking-[0.18em] text-background-secondary/75">
              Portal Tao Tenshin
            </span>

            <h1 className="font-heading text-5xl font-bold leading-tight text-black sm:text-6xl">
              Olá, bem-vindo à Tao Tenshin
            </h1>

            <p className="mt-4 text-lg leading-8 text-gray-600">
              Sua jornada para o equilíbrio e bem-estar começa aqui.
            </p>

            <div className="mt-9 flex w-full flex-col gap-4">
              <Link
                to="/cadastro"
                className="rounded-lg bg-background-secondary px-6 py-4 text-center text-xl font-semibold text-white transition hover:bg-[#4E6F35]"
              >
                Cadastrar
              </Link>

              <Link
                to="/login"
                className="rounded-lg border-2 border-background-secondary px-6 py-4 text-center text-xl font-semibold text-background-secondary transition hover:bg-background-secondary hover:text-white"
              >
                Fazer Login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Home;

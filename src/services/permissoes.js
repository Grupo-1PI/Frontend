import { temPermissao } from "./auth";

/**
 * Fonte unica de verdade sobre o que cada usuario pode ver/fazer.
 *
 * As telas (para o guard "Acesso Negado") e o cabeçalho (para esconder os
 * links) usam exatamente estas funcoes — assim a navbar nunca mostra algo que
 * a tela bloqueia.
 */

export const podeVerAgendamentos = () =>
  temPermissao("Ver agenda") ||
  temPermissao("Criar agendamentos") ||
  temPermissao("CRUD_AGENDAMENTO");

export const podeVerDisponibilidade = () =>
  temPermissao("Gerenciar disponibilidade") ||
  podeVerAgendamentos();

export const podeVerDashboard = () =>
  temPermissao("Dashboard") || temPermissao("CRUD_DASHBOARD");

export const podeGerenciarCargos = () =>
  temPermissao("CRUD_USUARIO") || temPermissao("Cargos");

export const podeGerenciarFuncionarios = () =>
  temPermissao("CRUD_USUARIO") || temPermissao("Funcionários");

export const podeGerenciarSalas = () =>
  temPermissao("CRUD_USUARIO") ||
  temPermissao("CRUD_AGENDAMENTO") ||
  temPermissao("Salas");

export const podeGerenciarServicos = () =>
  temPermissao("CRUD_USUARIO") ||
  temPermissao("CRUD_AGENDAMENTO") ||
  temPermissao("Serviços");

export const podeGerenciarEspecialidades = () =>
  temPermissao("CRUD_USUARIO") ||
  temPermissao("CRUD_AGENDAMENTO") ||
  temPermissao("Especialidades");

/** Só entra em Gerenciamento quem tem ao menos um dos cadastros. */
export const podeGerenciarAlgumCadastro = () =>
  podeGerenciarCargos() ||
  podeGerenciarFuncionarios() ||
  podeGerenciarSalas() ||
  podeGerenciarServicos() ||
  podeGerenciarEspecialidades();
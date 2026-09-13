import { api } from "../provider/api";

const TOKEN_KEY = "taotenshin_token";
const USUARIO_KEY = "taotenshin_usuario";

/**
 * POST /usuarios/login — autentica e guarda o token JWT + dados do usuário
 * (retornados pelo schema "Usuário - Token": usuarioId, nome, email, clienteId,
 * funcionarioId, tipo, cargo, permissoes) no localStorage.
 */
export async function login(email, senha) {
  const { data } = await api.post("/usuarios/login", { email, senha });
  // O back-end também seta um cookie HTTP-only; guardamos uma cópia acessível
  // via JS para o interceptor do axios anexar o header Authorization.
  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  localStorage.setItem(USUARIO_KEY, JSON.stringify(data));
  return data;
}

/** POST /usuarios — cria um novo usuário (cliente). */
export async function cadastrar(payload) {
  const { data } = await api.post("/usuarios", payload);
  return data;
}

/** POST /usuarios/logout — remove o cookie no back-end e limpa a sessão local. */
export async function logout() {
  try {
    await api.post("/usuarios/logout");
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  }
}

/** Lê a sessão salva no login, sem chamar a API. */
export function getUsuarioLogado() {
  const raw = localStorage.getItem(USUARIO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAutenticado() {
  return !!localStorage.getItem(TOKEN_KEY);
}

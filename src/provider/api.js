import axios from "axios";

export const api = axios.create({
    baseURL:import.meta.env.VITE_API_URL,
    withCredentials: true
})

// Anexa o token JWT salvo no login em toda requisição, quando existir.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("taotenshin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se o token expirar/for inválido, limpa a sessão local.
// A tela que consome a API decide para onde redirecionar (ex.: /login).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("taotenshin_token");
      localStorage.removeItem("taotenshin_usuario");
    }
    return Promise.reject(error);
  }
);
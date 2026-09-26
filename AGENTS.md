# AGENTS.md - Tao Tenshin Front-End

## Quickstart

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at http://localhost.localdomain:3000 (connects to backend at `http://localhost:8080`) |
| `npm run build` | Build for production (output: `dist/`) |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Architecture & Backend Integration

- **Companion Backend**: Located at `C:\Users\allyh\Documents\Tao Tenshin\Backend`.
- **API Client**: Axios instance in `src/provider/api.js` configured with `withCredentials: true` and `baseURL` from `VITE_API_URL` (local default: `http://localhost:8080`).
- **Authentication & Token Flow**:
  - `POST /usuarios/login` authenticates and returns `UsuarioTokenDto` (user data, roles, permissions).
  - **Backend Cookie & Auth Strategy**: The backend sets an `HttpOnly` cookie named `authToken` (`COOKIE_NOME`) and also supports `Authorization: Bearer` header via `AutenticacaoFilter`.
  - **Initial Flow Issue / Mismatch**: 
    1. Backend `UsuarioTokenDto` marks `token` with `@JsonIgnore`, meaning the JWT string is omitted from the JSON response body.
    2. Frontend `src/services/auth.js` (`login`) does not save a token to `localStorage` under `taotenshin_token`, yet `api.js` checks `localStorage.getItem("taotenshin_token")` to set the `Authorization` header.
    3. **Resolution**: The application relies on `withCredentials: true` sending the browser's `authToken` HttpOnly cookie automatically. However, if `taotenshin_token` is expected in localStorage for API requests or headers, either the backend must return the token in the response (removing `@JsonIgnore`) or frontend auth handling must align with cookie-only session management.
- **CORS**: Backend `SecurityConfiguracao.java` explicitly allows origins `http://localhost:5173` and `http://localhost:3000`. Ensure frontend runs on one of these allowed origins for credentialed (`withCredentials: true`) requests to succeed.
- **Routing**: `react-router-dom` managing `/`, `/login`, `/cadastro`, `/agendarConsulta`, `/meusAgendamentos`, `/agendaEquipe`.
- **Styling**: TailwindCSS v4 via `@tailwindcss/vite`.

## Build & Lint Pipeline

**Order matters**: `lint -> build`.
- `npm run lint` — ESLint on `**/*.{js,jsx}` (ignores vars matching `^[A-Z_]`).
- `npm run build` — Vite production build.

## Environment & Quirks

- **CEP lookup**: Fetches from external `https://viacep.com.br/ws/${cep}/json/`.
- **Phone masking**: Handled via `maskPhone` in `LoginCadastro.jsx`.
- **No test script**: `npm test` is not defined in `package.json`.

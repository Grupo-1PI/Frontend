# AGENTS.md - Tao Tenshin Front-End

## Quickstart

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at http://localhost.localdomain:3000 |
| `npm run build` | Build for production (output: `dist/`) |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Architecture

- **Monorepo**: Single package (`front-end`) managed via `package.json`
- **Entry point**: `src/main.jsx` → renders `App.jsx` inside `BrowserRouter`
- **Routing**: `react-router-dom` with 3 routes: `/`, `/login`, `/cadastro`
- **State**: Local component state (useState/useRef), no global store
- **Styling**: TailwindCSS v4 (configured in `vite.config.js` + `eslint.config.js`)
- **Components**: 
  - `src/components/FloatingInput.jsx` - reusable input with floating label
  - `src/components/CadastroForm.jsx` - multi-step registration form
  - `src/components/LoginForm.jsx` - login form
- **Pages**: 
  - `src/pages/Home.jsx` - landing page
  - `src/pages/LoginCadastro.jsx` - combined login/register with CEP lookup, phone masking, multi-step form

## Build & Test Pipeline

**Order matters**: `lint -> build`. Run lint before build/typecheck to catch issues early.

- `npm run lint` — ESLint on `**/*.{js,jsx}`. Rule: `no-unused-vars` ignores vars matching `^[A-Z_]` (global constants)
- `npm run build` — Vite produces `dist/`
- `npm run preview` — Serve `dist/` at http://localhost.localdomain:4173

## CI / Docker

- GitHub Actions workflow (`.github/workflows/docker-image.yml`) builds and pushes a Docker image on `production` branch push
- Manual rollback via `workflow_dispatch` with `commit_sha` input
- Docker image: `tao-tenshin_front-end:latest` and `:<sha>`
- Requires secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`

## Conventional Commits

Project uses Conventional Commits (see `README.md` for full spec). Commit formats:

```
feat: nova funcionalidade
fix: correcao de bug
docs: adiciona instrucoes do projeto
```

Scopes: `auth`, `api`, `db`, `ui`, `infra`, `docs`, `config`, `integration`

## Environment & Quirks

- **TailwindCSS v4**: No `tailwind.config.js` — all config is via class names. `@tailwindcss/vite` plugin integrates it with Vite.
- **ESLint `no-unused-vars`**: Ignores vars matching `^[A-Z_]` (intended for constants). Defined in `eslint.config.js:26`.
- **JSX `ecmaVersion: 2020`** in ESLint config.
- **No typecheck script** in `package.json` — only `dev`, `build`, `lint`, `preview`.
- **CEP lookup**: `LoginCadastro.jsx` fetches from `https://viacep.com.br/ws/${cep}/json/` (external API, may be slow/flaky).
- **Phone masking**: Applied in `handleChange` with `maskPhone` function.
- **Route progress bar**: `App.jsx` shows `.route-progress` div during page transitions (300ms timeout).
- **`yes` devDependency**: Present in `package.json` but no obvious usage found; may be for interactive prompts.

## Directory Ownership

| Directory | Purpose |
|-----------|---------|
| `src/` | React application code |
| `src/components/` | Reusable UI components |
| `src/pages/` | Page-level components routed by `react-router-dom` |
| `src/App.jsx` | Root component with route transition logic |
| `src/main.jsx` | ReactDOM root render + BrowserRouter |
| `public/` | Static assets (images, favicons, SVGs) |
| `.github/workflows/` | CI/CD Docker deployment |
| `nginx.conf` | Reverse proxy config (port 80 → port 8080 app) |

## What to Avoid

- Do not assume a `tailwind.config.js` exists — all Tailwind config is via utility classes.
- Do not run `npm test` — no test script is defined in `package.json`.
- Do not modify `package-lock.json` manually — it's auto-generated.
- The `eslint.globalIgnores(['dist'])` means linting skips the `dist/` build output.
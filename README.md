<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
# Padrão de Commits

Este projeto utiliza o padrão **Conventional Commits**
Todos os commits precisam seguir este formato:

```
Escopo: descrição curta
```

---

## Estrutura

```
Exemplos
feat: cria sistema de login
fix: corrige erro de validação
docs: adiciona instruções do projeto
```

---

## Tipos De Commit's

| Tipo     | Uso                                   |
| -------- | ------------------------------------- |
| feat     | Nova funcionalidade                   |
| fix      | Correção de bug                       |
| refactor | Refatoração sem alterar comportamento |
| perf     | Melhoria de performance               |
| style    | Formatação / UI / indentação          |
| docs     | Documentação                          |
| test     | Testes                                |
| chore    | Configuração / dependências           |
| ci       | Integração contínua                   |
| build    | Build ou ferramentas                  |
| hotfix   | Correção urgente em produção          |

---

## Escopos Comuns

| Escopo      | Quando usar          |
| ----------- | -------------------- |
| auth        | Autenticação         |
| api         | Backend / endpoints  |
| db          | Banco de dados       |
| ui          | Interface            |
| infra       | Infraestrutura       |
| docs        | Documentação         |
| config      | Configurações        |
| integration | Integrações externas |

---

## Exemplos CORRETOS

```
feat: adiciona dashboard inicial
fix: corrige retorno 500 no cadastro
refactor: melhora modelagem das tabelas
docs: adiciona diagrama de arquitetura
```

---

## Fluxo de Branch

```
main → produção
homologation → integração
development → desenvolvimento
```
>>>>>>> a0df0c51f2f82da670397874a455b5ca1d7c83d0

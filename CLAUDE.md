# Narrativas — Sistema de Gestão de Evento Acadêmico

Plataforma exclusiva do evento "Narrativas Interculturais, Decoloniais e Antirracistas em Educação" (GPDES/UnB). Substitui o Even3. Evento anual, multi-edição (V, VI, VII...) — todo o modelo de dados deve suportar múltiplas edições desde já.

## Stack (não negociável)

- **Frontend:** Next.js (App Router), **JavaScript puro + JSX**. **PROIBIDO TypeScript** (nenhum `.ts`/`.tsx`, nenhum `tsconfig.json`).
- **Estilos:** **SCSS Modules** (`*.module.scss`). **PROIBIDO Tailwind**, styled-components ou CSS-in-JS.
- **Backend:** Express (Node.js, JavaScript).
- **Banco:** PostgreSQL + **Prisma** (`backend/prisma/schema.prisma`).
- **Auth:** JWT em cookie httpOnly (access curto + refresh), senha com bcrypt.
- **E-mail:** Nodemailer, SMTP configurável por `.env` (dev: Ethereal ou console).

Antes de propor qualquer alternativa a essa stack (outra lib de estilo, TypeScript, outro ORM etc.), pare e pergunte.

## Estrutura do repositório

```
narrativas/
├── frontend/        # Next.js — porta 3000
│   ├── app/
│   │   ├── (publico)/    # identidade visual do evento (stencil/terroso)
│   │   └── (interno)/    # participante/admin — visual limpo e dessaturado
│   ├── components/
│   ├── styles/            # _tokens-publico.scss, _tokens-interno.scss, globals.scss
│   └── lib/                # apiClient, validação, helpers
└── backend/          # Express — porta 4000
    ├── prisma/schema.prisma
    └── src/
        ├── routes/ controllers/ services/ middlewares/ validators/ utils/
        └── server.js
```

## Identidade visual — duas peles

- **Site público** (`(publico)`, inclui login/cadastro): editorial, stencil, paleta terrosa (`--tinta`, `--barro`, `--ocre`, `--areia`, `--papel`, `--cerrado`). Tipografia display stencil (Allerta Stencil / Saira Stencil One) + Archivo. Ver `frontend/styles/_tokens-publico.scss`.
- **Área interna** (`(interno)`: participante/admin): limpa, silenciosa, mesma família terrosa dessaturada (`--fundo`, `--superficie`, `--borda`, `--texto`, `--acento`). Ver `frontend/styles/_tokens-interno.scss`. Hierarquia por espaçamento/peso/cor — nunca por caixas coloridas.

Nunca misture os tokens das duas peles entre si.

## Convenções

- Antes de criar ou alterar qualquer tela, leia e siga o `DESIGN.md`. Em caso de conflito com instruções antigas, o `DESIGN.md` vence.
- Código (variáveis, funções, nomes de arquivo, commits de schema) em **inglês** onde for genérico de infraestrutura; **nomes de domínio do negócio** (models Prisma, rotas, mensagens) em **português**, já que refletem o vocabulário do próprio evento (ex.: `Usuario`, `/auth/cadastro`, `PapelUsuario`). Segue o que já foi estabelecido nas rotas e no schema — não traduza para inglês.
- Toda UI, mensagens de erro/validação e e-mails em **português**.
- Estilos sempre via `*.module.scss` importado no componente; nada de estilo inline exceto casos pontuais (ex.: valor dinâmico).
- Middlewares de auth: `autenticar` (valida JWT do cookie) e `autorizar(...papeis)`.
- Mensagens de auth não devem vazar existência de conta em login/recuperação de senha (mensagens genéricas). Cadastro pode ser específico (UX exige saber que e-mail/CPF já existe).
- Exclusão de conta é anonimização (LGPD), nunca `DELETE` físico do usuário — preserva integridade referencial para módulos futuros.

## Commits

Pequenos e frequentes, mensagens em português, estilo Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`. Exemplo: `feat: cadastro de usuário com confirmação de e-mail`.

## Mapa dos módulos

**Fase 1 (até dez/2026 — V edição):**

1. Cadastro, login e autenticação — **concluído**
2. Painel administrativo (edições e atividades) — não iniciado
3. Inscrições (vagas, lista de espera, conflito de horários) — não iniciado
4. Credenciamento por QR code — não iniciado
5. Área do participante — não iniciado
6. Testes — não iniciado
7. Deploy — não iniciado
8. Suporte — não iniciado

**Fase 2 (até fev/2027):**

9. Certificados — não iniciado
10. Migração Even3 — não iniciado
11. Anais — não iniciado
12. Site institucional — não iniciado
13. Submissão de trabalhos — iniciado (LP com section de modalidades + páginas de detalhe por modalidade; fluxo de submissão em si ainda não construído)

Ao concluir um módulo, atualize o status aqui nesta mesma sessão/PR.

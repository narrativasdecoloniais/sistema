# Narrativas

Sistema de gestão do evento acadêmico "Narrativas Interculturais, Decoloniais e Antirracistas em Educação" (GPDES/UnB). Monorepo com duas aplicações independentes: `frontend` (Next.js) e `backend` (Express + Prisma).

Convenções do projeto, stack e mapa de módulos: veja [CLAUDE.md](./CLAUDE.md).

## Pré-requisitos

- Node.js 18+
- Um banco PostgreSQL (Railway, Supabase, local — qualquer um serve, basta ter a `DATABASE_URL`)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# edite .env e preencha DATABASE_URL, JWT_ACCESS_SECRET e JWT_REFRESH_SECRET
npm install
npm run prisma:migrate   # cria as tabelas no banco configurado
npm run dev              # http://localhost:4000
```

Sem `SMTP_HOST` configurado, os e-mails (confirmação de cadastro, recuperação de senha) são enviados para uma conta de teste Ethereal — o link de preview aparece no console do backend.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

### 3. Usar

Acesse `http://localhost:3000`, clique em "Inscreva-se", cadastre-se, confirme o e-mail (link no console do backend) e faça login.

## Estrutura

```
narrativas/
├── frontend/   # Next.js — App Router, JS puro + JSX, SCSS Modules
└── backend/    # Express + Prisma — API REST
```

## Módulo 1 (atual)

Cadastro, login e autenticação — cobre cadastro com confirmação de e-mail, login por CPF, sessão via JWT em cookie httpOnly (access + refresh), recuperação/troca de senha, edição de perfil e exclusão de conta (anonimização LGPD). Ver detalhes em [CLAUDE.md](./CLAUDE.md).

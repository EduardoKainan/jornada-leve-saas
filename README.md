# Jornada Leve

SaaS de acompanhamento da jornada de emagrecimento.

## Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui
- **Backend:** Next.js API Routes + Supabase (PostgreSQL, Auth, Storage, RLS)
- **ORM:** Drizzle
- **Email:** Resend + React Email
- **Pagamentos:** Efi Assinaturas
- **Deploy:** Vercel + Supabase

## Estrutura

```
apps/web       → Next.js PWA + API routes
packages/db    → Drizzle schema + migrations
packages/email → React Email templates + Resend client
packages/config → Zod env schemas
supabase/      → SQL migrations + seed data
docs/          → OpenAPI, ADRs, runbooks
```

## Desenvolvimento

```bash
npm install          # instalar dependências
npm run dev          # dev server (turbo)
npm run build        # build production
npm run lint         # lint
npm run typecheck    # type checking
```

## Rodapé

Este produto organiza registros informados pelo usuário. Não substitui acompanhamento profissional.

# Jornada Leve

SaaS em pt-BR para organizar registros da jornada de emagrecimento, acompanhar evolução e gerar relatórios privados para consultas. O produto não substitui orientação, diagnóstico ou acompanhamento profissional.

## Stack

- **Web:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4 e shadcn/ui
- **Dados:** Supabase PostgreSQL, Auth, Storage e RLS; Drizzle ORM
- **Comunicação:** Resend e templates HTML transacionais
- **Pagamentos:** assinaturas Efí
- **Relatórios:** jsPDF
- **Qualidade:** Node Test Runner, Playwright e Turborepo
- **Deploy:** Vercel + Supabase

## Estrutura

```text
apps/web        Aplicação Next.js, API Routes e E2E
packages/db     Schema Drizzle
packages/email  Templates HTML e cliente Resend
packages/config Validação de ambiente
supabase        Migrações e configuração local
 docs           PRD, checklist e runbooks
```

## Requisitos locais

- Node.js 20 ou superior
- npm 11
- Projeto Supabase configurado
- Conta Resend e Efí para validar integrações externas

## Setup local

```bash
git clone https://github.com/EduardoKainan/jornada-leve-saas.git
cd jornada-leve-saas
npm install
cp apps/web/.env.example apps/web/.env.local # se o arquivo de exemplo estiver disponível
npm run dev
```

Sem arquivo de exemplo, crie `apps/web/.env.local` a partir da lista abaixo. Nunca versione credenciais.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---:|---|
| `NEXT_PUBLIC_APP_URL` | sim | URL canônica, links e SEO |
| `NEXT_PUBLIC_SUPABASE_URL` | sim | URL do projeto Supabase, sem `/rest/v1` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | Cliente Supabase com RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | Jobs administrativos; somente servidor |
| `DATABASE_URL` | migrações | Conexão PostgreSQL usada pelo Drizzle |
| `CHECKIN_NOTES_ENCRYPTION_KEY` | produção | Chave com 32+ caracteres para notas |
| `RESEND_API_KEY` | produção | Envio transacional |
| `RESEND_FROM_EMAIL` | produção | Remetente verificado, ex. `Jornada Leve <noreply@dominio>` |
| `RESEND_WEBHOOK_SECRET` | produção | Assinatura Svix do webhook Resend |
| `PRIVACY_TOKEN_SECRET` | produção | Tokens LGPD; aleatório com 32+ caracteres |
| `CRON_SECRET` | produção | Protege jobs de dunning, relatórios e exclusões |
| `EFI_PIX_CLIENT_ID` | cobrança | Credencial Efí PIX |
| `EFI_PIX_CLIENT_SECRET` | cobrança | Credencial Efí PIX |
| `PIX_KEY` | cobrança | Chave PIX |
| `EFI_WEBHOOK_TOKEN` | cobrança | Validação do webhook Efí |
| `EFI_PIX_CERT_BASE64` | cobrança | Certificado Efí em base64 para Vercel |
| `EFI_SANDBOX` | sim | `true` local/homologação; `false` produção |
| `REPORT_RETENTION_DAYS` | não | Retenção dos PDFs; padrão 30 dias |

Variáveis E2E opcionais: `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_RUN_SIGNUP=true` e `PLAYWRIGHT_BASE_URL`.

## Comandos

```bash
npm run dev                              # monorepo em desenvolvimento
npm run build                            # build via Turbo
npm run typecheck                        # TypeScript
cd apps/web && npm test                  # testes unitários
cd apps/web && npx playwright install chromium
cd apps/web && npx playwright test       # quatro fluxos E2E
cd apps/web && npm run build              # build Next.js de produção
```

## Webhooks e jobs

- Resend: `POST /api/webhooks/resend`
- Efí: `POST /api/webhooks/efi`
- Exclusões LGPD: `GET /api/cron/privacy-deletions`, header `Authorization: Bearer $CRON_SECRET`
- Dunning: `GET /api/cron/dunning`
- Limpeza de relatórios: `GET /api/cron/reports`

Configure o job de exclusões ao menos diariamente. O processamento também é disparado em background após a confirmação do titular.

## Produto e operação

- [Deploy na Vercel](docs/VERCEL_DEPLOY.md)
- Repositório: <https://github.com/EduardoKainan/jornada-leve-saas>

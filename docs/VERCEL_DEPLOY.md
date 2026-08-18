# Deploy na Vercel

Este projeto é um monorepo npm/Turborepo. A aplicação pública fica em `apps/web`.

## Configuração recomendada do projeto Vercel

- **Framework Preset:** Next.js
- **Root Directory:** `apps/web`
- **Include source files outside of the Root Directory:** habilitado
- **Install Command:** `cd ../.. && npm install`
- **Build Command:** `cd ../.. && npm run build --workspace @jornada-leve/web`
- **Development Command:** `cd ../.. && npm run dev --workspace @jornada-leve/web`
- **Node.js:** 20 ou superior

Esses comandos também estão em `apps/web/vercel.json` para reduzir divergência entre ambiente local e Vercel.

## Variáveis obrigatórias para produção

Configure em **Project Settings → Environment Variables → Production**:

```env
NEXT_PUBLIC_APP_URL=https://seu-dominio.com.br
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CHECKIN_NOTES_ENCRYPTION_KEY=
PRIVACY_TOKEN_SECRET=
CRON_SECRET=
```

## Variáveis para integrações

```env
DATABASE_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=Jornada Leve <nao-responda@seudominio.com.br>
RESEND_WEBHOOK_SECRET=
EFI_PIX_CLIENT_ID=
EFI_PIX_CLIENT_SECRET=
PIX_KEY=
EFI_SANDBOX=false
EFI_WEBHOOK_TOKEN=
EFI_PIX_CERT_BASE64=
REPORT_RETENTION_DAYS=30
SENTRY_DSN=
```

Notas:

- `CHECKIN_NOTES_ENCRYPTION_KEY`, `PRIVACY_TOKEN_SECRET` e `CRON_SECRET` devem ser strings aleatórias fortes, com 32+ caracteres quando possível.
- Para Efí na Vercel, prefira `EFI_PIX_CERT_BASE64`; caminho de arquivo via `EFI_PIX_CERT` é mais adequado para VPS.
- O `CRON_SECRET` é usado pelos Vercel Cron Jobs nas rotas `/api/cron/dunning`, `/api/cron/reports` e `/api/cron/privacy-deletions`.

## Checklist antes de apontar domínio

1. Importar o repositório no Vercel usando as configurações acima.
2. Configurar todas as variáveis de produção.
3. Conectar domínio e ajustar `NEXT_PUBLIC_APP_URL` para a URL final.
4. Rodar um deploy de preview e validar:
   - `/`
   - `/entrar`
   - `/cadastro`
   - fluxo de auth Supabase
   - geração de relatório
   - endpoints de webhook com secrets corretos
5. Depois do primeiro deploy, conferir em **Settings → Cron Jobs** se os 3 jobs foram registrados.

## Validação local executada

```bash
npm install
npm run typecheck
npm run build
```

O build deve gerar a aplicação Next.js em `apps/web/.next`.

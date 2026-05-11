# MVP Deploy: Vercel + Railway

This project is best deployed for a demo as:

- `apps/frontend-next` on Vercel
- `apps/backend` on Railway
- Railway Postgres
- Railway Redis

## 1. Railway

Create a Railway project with these services:

1. `PostgreSQL`
2. `Redis`
3. `backend` from this repository

Backend settings:

- Root Directory: `apps/backend`
- Build: use repo Dockerfile in `apps/backend`
- Public domain: enable

Backend environment variables:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=true
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=change-me-to-a-long-random-secret-at-least-32-chars
FRONTEND_URL=https://YOUR-PROJECT.vercel.app
OPENAI_API_KEY=
OPENAI_MODEL=google/gemma-3-27b-it:free
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_TIMEOUT_MS=12000
OPENROUTER_HTTP_REFERER=https://YOUR-PROJECT.vercel.app
OPENROUTER_X_TITLE=TaskONdemand
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

After deploy, open:

- `https://YOUR-RAILWAY-DOMAIN/health`

Expected result:

- database `up`
- redis `up`

## 2. Vercel

Use the existing Vercel project and point it to the frontend app.

Project settings:

- Framework: `Next.js`
- Root Directory: `apps/frontend-next`

Environment variables:

```env
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-DOMAIN
```

Deploy production after the variable is saved.

## 3. Final wiring

When Vercel gives you the final production URL:

1. Update Railway `FRONTEND_URL`
2. Redeploy backend
3. Test:
   - register/login
   - task feed
   - create task
   - history page
   - `/health`

## Notes

- `RabbitMQ` is not required for the current MVP deploy path.
- Backend accepts both `DATABASE_URL` and classic `DB_*` variables.
- Railway Postgres usually requires SSL, so `DATABASE_SSL=true` is recommended.

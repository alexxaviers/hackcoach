# Simon API

Local backend for Simon AI coaching MVP.

Quick start (requires Postgres):

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and secrets.
2. Install deps: `pnpm install` or `npm install` in `/apps/api`.
3. Generate Prisma client: `pnpm prisma:generate`.
4. Run migrations: `pnpm prisma:migrate` (or `npx prisma migrate dev --name init`).
5. Start dev server: `pnpm dev`.

Endpoints listed in the creator brief are implemented in `src/routes`.

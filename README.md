# BANDMATE

BANDMATE is a band-management application for release planning, operations, outreach, and finances.

## Run locally

1. Install Node.js LTS and npm.
2. Install dependencies with `npm ci`.
3. Copy `.env.example` to `.env`; add only the server-side provider keys you intend to use.
4. Start the local development server with `npm run dev`.

The development server binds to loopback. Do not expose it to the public internet.

## Checks

- `npm run lint` runs the TypeScript check.
- `npm test` runs the automated unit tests that do not write to a database.
- `npm run build` creates a Vite frontend build.

The database integration test is not part of the default test command. To run it, set `RUN_DATABASE_INTEGRATION_TESTS=true` and point `DATABASE_URL` at a dedicated disposable test database; it creates and removes a test snapshot. Never run database integration tests against shared or production data.

Run `npm run check:integrations` for a non-destructive check of the Supabase Auth health endpoint and a read-only Postgres `SELECT 1`. It does not sign in or create a user. Neon testing is blocked until a supported database connection variable is configured locally.

## Architecture and readiness

The client is a Vite/React application. Much of its current data is stored in browser `localStorage`. **Neon is the intended managed Postgres database** for remote app-state snapshots; configure its connection string as the server-side `DATABASE_URL` (or `NEON_DATABASE_URL`). Supabase is used for Auth only: it gates configured accounts, namespaces browser data per signed-in account, and the Express server verifies bearer sessions before accessing Neon/Postgres snapshots scoped to each account. Existing shared snapshots are intentionally not migrated into any account. Team sharing/roles are not implemented.

The Supabase GitHub integration is for applying Supabase database migrations from `supabase/migrations`; it does not deploy this Express/Vite app and does not supply the Neon connection string. This repository currently has no Supabase migrations because app snapshots are intended for Neon. Keep “Deploy to production” disabled unless/until Supabase migrations are deliberately added and reviewed.

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend and matching `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the server. The anon key is a public identifier; do not expose service-role credentials. Configure email confirmation, password-reset redirect URLs, and SMTP in Supabase before customer signup. AI provider keys are server-only and must never use `VITE_` prefixes. Even with Supabase auth, production AI, uploads, and local-disk file serving remain deliberately disabled until quota/privacy controls and private object storage are ready. This repository is not yet ready for public customer data, payments, or paid acquisition.

`npm run preview` previews the static frontend only. It is not a production server for the Express API or cron jobs. Vercel static hosting alone does not run this application's server. A production deployment needs a compatible persistent server runtime, the configured Neon/Postgres database, durable object storage, monitoring, backup/recovery, and a deployment-specific configuration.

## Initial market validation hypothesis

The proposed initial market is self-managed bands in the United Kingdom, with English-language positioning. This is an unvalidated hypothesis, not evidence of product-market fit. Do not spend on ads until the launch workflow, customer-data security, analytics, and privacy/legal requirements are ready. The initial paid-media cap is €100 per month; test one channel at a time and prioritize qualified activation and repeated use over clicks.

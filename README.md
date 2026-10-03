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

Run `npm run check:integrations` for a non-destructive check of the Supabase Auth health endpoint and Neon/Postgres connectivity. Database checks use only `SELECT` statements, including a read-only check for the expected app tables; they do not sign in, create users, or change database schema/data. Neon testing is blocked until a supported database connection variable is configured locally.

## Architecture and readiness

The client is a Vite/React application. Much of its current data is stored in browser `localStorage`. **Neon is the intended managed Postgres database** for remote app-state snapshots; configure its connection string as the server-side `DATABASE_URL` (or `NEON_DATABASE_URL`). Supabase is used for Auth only: it gates configured accounts, namespaces browser data per signed-in account, and the Express server verifies bearer sessions before accessing Neon/Postgres snapshots scoped to each account. Existing shared snapshots are intentionally not migrated into any account. Team sharing/roles are not implemented.

The Supabase GitHub integration is for applying Supabase database migrations from `supabase/migrations`; it does not deploy this Express/Vite app and does not supply the Neon connection string. This repository currently has no Supabase migrations because app snapshots are intended for Neon. Keep “Deploy to production” disabled unless/until Supabase migrations are deliberately added and reviewed.

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend and matching `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the server. The anon key is a public identifier; do not expose service-role credentials. Configure email confirmation, password-reset redirect URLs, and SMTP in Supabase before customer signup. Text AI requests use the Vercel AI Gateway through the AI SDK and require an authenticated user. Keep `AI_GATEWAY_API_KEY` server-only; never use a `VITE_` prefix. Vercel deployments can use the platform-provided OIDC token; local development can use an AI Gateway key in ignored `.env.local`. Image generation and local-disk file serving remain disabled in production until quota/privacy controls and private object storage are ready. This repository is not yet ready for public customer data, payments, or paid acquisition.

## Vercel deployment

The Vercel adapter serves the Vite build as static output and routes `/api/*` requests to the Express serverless function in `api/[...path].ts`. Local development continues to use `npm run dev`. Vercel functions are stateless: production database schema is never auto-created by a function invocation. Before enabling database persistence, review and apply `database/migrations/001_user_app_state_snapshots.sql` to the intended Neon database using its SQL Editor.

In the Vercel project, use the repository root, Vite framework preset, `npm run build` as the build command, and `dist` as the output directory. Configure these environment variables in Vercel Project Settings → Environment Variables, never in Git:

- **Production and Preview runtime:** `DATABASE_URL` (Neon pooled connection URL), `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- **Production and Preview build:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (same Supabase project and publishable/anon key as the server variables).
- **Text AI:** Vercel deployments use OIDC with Vercel AI Gateway; no Gateway key needs to be exposed to the browser. For local development outside a linked Vercel environment, set `AI_GATEWAY_API_KEY` in `.env.local`. `AI_GATEWAY_MODEL` is optional and defaults to the live-catalog-verified `moonshotai/kimi-k3`. Never set AI credentials with a `VITE_` prefix. Local development may retain direct-provider keys for the existing fallback path; production chat uses AI Gateway.

Do not use the production Neon database for Preview deployments. Create a separate Neon branch/database for Preview, set its `DATABASE_URL` only in the Vercel Preview environment, and apply the migration there separately. Configure Supabase Authentication URL allowlists for the final Vercel deployment domain and `https://lovnis.art/**` only when the custom domain is attached. Set the Supabase Site URL to the actual production URL after DNS and HTTPS are verified.

This Vercel adapter enables authenticated text chat through AI Gateway when deployment OIDC is available. Image generation, uploads, campaign delivery, and scheduled jobs are not enabled by this change. Local-disk upload persistence and cron scheduling are not available on Vercel Functions. Configure durable private storage and any required scheduled functions as separate reviewed work before claiming those capabilities. Use `npm run check:integrations` against each environment before accepting customer data.

`npm run preview` previews only the static frontend; it does not emulate Vercel Functions. Production readiness still requires tested auth, database migration, backups/restore, custom-domain HTTPS, monitoring, and recovery.

To run the standalone AI Gateway smoke example locally, put a valid `AI_GATEWAY_API_KEY` in the ignored `.env.local` file and run `npm run example:ai`. Do not commit or share the key.

## Initial market validation hypothesis

The proposed initial market is self-managed bands in the United Kingdom, with English-language positioning. This is an unvalidated hypothesis, not evidence of product-market fit. Do not spend on ads until the launch workflow, customer-data security, analytics, and privacy/legal requirements are ready. The initial paid-media cap is €100 per month; test one channel at a time and prioritize qualified activation and repeated use over clicks.

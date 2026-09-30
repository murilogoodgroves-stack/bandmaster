# BandHQ

BandHQ is a band management dashboard with AI-powered outreach, production planning, and operations tracking.

## Run locally

1. Install dependencies:
   `npm install`
2. Copy the example environment file:
   `cp .env.example .env`
3. Add free-tier values for the providers you want to use.
4. Run the app:
   `npm run dev`

## Recommended free-tier stack

### Database
Use one of these:
- Supabase Postgres (very easy, generous free tier)
- Vercel Postgres (excellent for Vercel deployments)
- Neon (simple Postgres free tier)

### AI
Use one or more of these free-tier providers:
- OpenRouter with Gemini free model
- Google Gemini via AI Studio
- Groq
- MiniMax

## Suggested environment setup

At minimum, set the keys you want to use in `.env`:

```bash
VITE_OPENROUTER_API_KEY=your_key
VITE_GEMINI_API_KEY=your_key
VITE_GROQ_API_KEY=your_key
VITE_MINIMAX_API_KEY=your_key
DATABASE_URL=postgres://user:password@host:5432/database
```

The app already supports provider rotation in `services/aiService.ts`.

## Vercel / free deployment

This app is easiest to deploy with:
- frontend: Vercel
- database: Supabase or Vercel Postgres
- AI: OpenRouter or Gemini

If you deploy on Vercel, set the environment variables in the Vercel dashboard and keep the app server simple. The project is a Vite + Express app, so for production it is best to use a managed Postgres service rather than a self-hosted DB.

## Notes

- The app keeps a lot of data in browser localStorage by default for quick local usage.
- Real persistence should be done through a managed database such as Supabase or Vercel Postgres.
- The backend is resilient if the database is not configured yet; it will report a degraded health status instead of crashing.

## Data Sources Verification (Phase 4)

AI / Scraper endpoints (server):
- `server/utils/enhancedAiService.ts` (OLLAMA_URL/OLLAMA_MODEL)
- `server/utils/fallbackAiService.ts` (FALLBACK_AI_URL/FALLBACK_AI_KEY)
- Government data: `server/routes/news.ts`, `legal.ts`, `lobbyists.ts`, `procurement.ts`, `elections.ts` (free sources per changelog)

Client integrations:
- Supabase: `client/src/lib/supabase.ts` uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- API Base: `client/src/lib/config.ts` uses `VITE_API_BASE_URL` (optional)

Live status: Pending runtime execution against `https://civicos.onrender.com`.
Mock policy: Only if live source unavailable; fixtures to be placed under `audit/mocks/<feature>/` and clearly labeled.



## Implementation Log

Time is system clock of the build machine; see commit and build logs for exact timestamps.

### Bills/Voting groundwork
- Edited: `shared/schema.ts`
  - Added: `parliament_members`, `bill_rollcalls`, `bill_rollcall_records`, `procurement_contracts`, `lobbyist_orgs`, and `politicians.parliamentMemberId`.
- Added: `server/utils/parliamentIngestion.ts`
  - Functions: `ingestParliamentMembers()`, `ingestBillRollcallsForCurrentSession()` (stub to be completed next).
- Edited: `server/routes/voting.ts`
  - Added `GET /api/voting/bills/:id/rollcall` (returns totals + records when present).
- Edited: `server/routes/admin.ts`
  - Added `POST /api/admin/refresh/parliament` (ingest MPs + roll-calls stub).

### News ingest (live RSS)
- Added: `server/utils/newsIngestion.ts`
- Edited: `server/routes/news.ts`
  - `GET /api/news/:id` now DB-first with on-demand ingestion fallback.
  - `POST /api/admin/refresh/news` endpoint.

### AI provider fallback (Hugging Face)
- Edited: `server/utils/enhancedAiService.ts`
  - Supports `HUGGINGFACE_API_TOKEN` and `HUGGINGFACE_MODEL` as provider when Ollama unavailable.
- `server/routes/ai.ts` unchanged, benefits from provider selection.

### Transparency (DB plumbing and DB-backed routes)
- Added: `server/utils/procurementIngestion.ts` (CKAN ingest scaffold)
- Edited: `server/routes/procurement.ts` (now reads from `procurement_contracts`)
- Added: `server/utils/lobbyistsIngestion.ts` (curated upsert scaffold)
- Edited: `server/routes/lobbyists.ts` (DB-backed if present; curated fallback)

### UI polish
- Edited: `client/src/pages/civicsocial-profile.tsx` — removed sidebar; header-only layout.

### CORS and deploy verification
- Edited: `server/index.ts` — ensured CORS headers on `/health`.
- Logs: `audit/fixes/ISSUE-005/deploy.log`, `audit/fixes/ISSUE-005/verify-post-deploy.log`.

### Build logs for traces
- `audit/fixes/ISSUE-NEWS/build.log`
- `audit/fixes/DATA-INGEST/build.log`
- `audit/fixes/VOTES-INGEST/build.log`

### Next in progress (Bills/Voting)
- Implemented roll-call ingestion via OpenParliament-compatible JSON in `server/utils/parliamentIngestion.ts` with env overrides.
- Added `GET /api/politicians/:id/votes` in `server/routes/politicians.ts` (joins `bill_rollcall_records` with `bill_rollcalls`).
- Will write verification outputs to `audit/fixes/BILLS-VOTING/` (ingest.log, verify.log, samples/).

### Procurement
- Added: `server/utils/procurementIngestion.ts` (CKAN ingest; `ingestProcurementFromCKAN`)
- Edited: `server/routes/procurement.ts` (DB-backed from `procurement_contracts`)
- Edited: `server/routes/admin.ts` — added `POST /api/admin/refresh/procurement` (ingests via CKAN, optional `query`)
  - Improved `GET /api/procurement/stats` to compute real aggregates from `procurement_contracts` (count, sum(value), distinct departments/suppliers)

Next:
- Verify live ingestion and attach samples under `audit/fixes/PROCUREMENT/`.

### Lobbyists
- Added: `server/utils/lobbyistsIngestion.ts` CKAN ingest (`ingestLobbyistsFromCKAN`) alongside curated upsert
- Edited: `server/routes/lobbyists.ts` already DB-backed when records exist
- Edited: `server/routes/admin.ts` — added `POST /api/admin/refresh/lobbyists`

Next:
- Verify live ingestion and attach samples under `audit/fixes/LOBBYISTS/`.

### Legal
- Added: `server/utils/legalIngestion.ts` (curated ingest for `legal_acts` and `legal_cases`)
- Edited: `server/routes/legal.ts` to be DB-first for acts/cases with curated fallback
- Edited: `server/routes/admin.ts` — added `POST /api/admin/refresh/legal` (accepts `{ acts: [], cases: [] }`)



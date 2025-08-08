## CivicOS Audit Context

Scope: CivicOS core (CivicSocial excluded). Sources: live Render API and production Supabase. Secrets masked.

### Repo map
- Backend: `server/` (Express + TypeScript)
- Frontend: `client/` (Vite + React + TypeScript)
- Shared types/schema: `shared/`
- Migrations: `migrations/` (SQL; drizzle configured in `drizzle.config.ts`)
- Tests: `tests/` (Vitest + Playwright E2E)
- Build artifacts: `dist/`

### Detected package manager and runners
- Package manager: npm (package-lock.json present)
- Test runners: Vitest (unit/integration), Playwright (E2E)

### Scripts (root package.json)
- dev: `tsx server/index.ts`
- build: `tsc --project tsconfig.server.json --outDir dist`
- build:client: `cd client && npm run build`
- build:full: `npm run build && npm run build:client`
- start: `./start.sh`
- start:render: `bash start-render.sh`
- test:backend: `vitest run`
- test:frontend:e2e: `playwright test`
- test:integration: `vitest run tests/integration/`
- deploy:render: `bash deploy-render.sh`

### Frontend scripts (client/package.json)
- dev: `vite`
- build: `tsc && npx vite build`
- lint: `eslint .`
- preview: `vite preview`

### Env var matrix (presence only)
- DATABASE_URL: used by `drizzle.config.ts`, `server/db.ts`, migration scripts — REQUIRED — Presence: unknown (checked at runtime)
- SESSION_SECRET: used by auth and JWT (`server/index.ts`, routes) — REQUIRED — Presence: unknown
- NODE_ENV: used widely — REQUIRED — Presence: unknown
- CORS_ORIGIN: used by `server/index.ts` — OPTIONAL — Presence: unknown
- FRONTEND_BASE_URL: used for redirects/Stripe — OPTIONAL — Presence: unknown
- SUPABASE_URL: server optional — OPTIONAL — Presence: unknown
- SUPABASE_ANON_KEY: server optional; client required — REQUIRED (client) — Presence: unknown
- VITE_SUPABASE_URL: used by `client/src/lib/supabase.ts` — REQUIRED (client) — Presence: unknown
- VITE_SUPABASE_ANON_KEY: used by `client/src/lib/supabase.ts` — REQUIRED (client) — Presence: unknown
- VITE_API_BASE_URL: used by `client/src/lib/config.ts` — OPTIONAL — Presence: unknown
- STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET: used in membership/donations — OPTIONAL — Presence: unknown
- ADMIN_EMAIL: used for RBAC/admin checks — OPTIONAL — Presence: unknown
- OLLAMA_BASE_URL / OLLAMA_MODEL: AI optional — OPTIONAL — Presence: unknown
- FALLBACK_AI_URL / FALLBACK_AI_KEY: optional — OPTIONAL — Presence: unknown

Note: presence will be validated via verification scripts without printing values.

### Live endpoints (resolved)
- Playwright baseURL: `https://civicos.onrender.com`
- scripts/verify-deployment.sh API_BASE_URL: `https://civicos.onrender.com`, CLIENT_BASE_URL: `https://civicos.ca`

### Route inventory (server/routes)
Core (in scope unless marked otherwise): `admin.ts`, `ai.ts`, `announcements.ts`, `api.ts`, `auth.ts`, `bills.ts`, `cases.ts`, `contacts.ts`, `corruption.ts`, `dashboard.ts`, `donations.ts`, `elections.ts`, `finance.ts`, `foi.ts`, `identity.ts`, `leaks.ts`, `ledger.ts`, `legal.ts`, `lobbyists.ts`, `maps.ts`, `membership.ts`, `memory.ts`, `messages.ts`, `migration.ts`, `moderation.ts`, `news.ts`, `permissions.ts`, `petitions.ts`, `politicians.ts`, `procurement.ts`, `rights.ts`, `search.ts`, `trust.ts`, `upload.ts`, `users.ts`, `voting.ts`
Out of scope (CivicSocial): `social.ts`, `friends.ts` (tracked but excluded)

### Frontend route pages (client/src/pages)
Core pages include: `about.tsx`, `accessibility.tsx`, `admin/*`, `auth.tsx`, `cases.tsx`, `contact.tsx`, `contacts.tsx`, `corruption.tsx`, `dashboard.tsx`, `elections.tsx`, `finance.tsx`, `foi.tsx`, `landing.tsx`, `leaks.tsx`, `ledger.tsx`, `legal*.tsx`, `lobbyists.tsx`, `login.tsx`, `maps.tsx`, `memory.tsx`, `news.tsx`, `notifications.tsx`, `petitions.tsx`, `politicians.tsx`, `privacy.tsx`, `procurement.tsx`, `profile.tsx`, `profile/[username].tsx`, `pulse.tsx`, `rights.tsx`, `search.tsx`, `settings.tsx`, `support.tsx`, `terms.tsx`, `trust.tsx`, `user-search.tsx`, `voting.tsx`
Out of scope (CivicSocial): `civicsocial-*.tsx`

This file is generated for Phase 0. Subsequent phases will add static, migration, runtime, and datasource reports under `/audit`.



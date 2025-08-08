## Audit Test Suite

This directory contains failing stubs for issues identified during the audit. Do not modify application code when running these.

### Commands
- Unit/Integration (Vitest):
  - `npm run -s test:backend` (root) — runs `tests/**/*.test.ts`
- E2E (Playwright):
  - `npm run -s test:frontend:e2e` (root) — uses `playwright.config.ts` with baseURL `https://civicos.onrender.com`

Note: LIVE_ONLY=ON — no localhost targets.



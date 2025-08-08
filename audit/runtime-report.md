## Runtime Route Walk (Phase 3)

Base URL: https://civicos.onrender.com (LIVE)
Scope: CivicOS core only. CivicSocial routes excluded.

Method: Planned automated crawl via Playwright using `playwright.config.ts` baseURL. Requests and console logs to be captured to `audit/network-log.ndjson` during execution.

Planned Routes (server): see `audit/logs/routes-list.txt` (excluding `social.ts` and `friends.ts`).

Status: Pending execution. This document will be updated with per-route findings once the crawl runs.

### Live deployment verification (scripts/verify-deployment.sh)
Summary (see `audit/logs/verify-deployment.log`):
- PASS: /api/health, /api/auth/register (400 accessible), /api/social/follow (401 unauthorized expected), /api/voting/bills, /api/news, /api/politicians, /api/legal/search
- WARN/FAIL:
  - Rate limiting may not be working (multiple POST /api/auth/login did not trigger limit)
  - CORS headers may be missing for `Origin: https://civicos.ca`




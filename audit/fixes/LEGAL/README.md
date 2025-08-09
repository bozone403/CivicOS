## Legal Ingestion and Verification

Trigger (admin):
- POST /api/admin/refresh/legal
  - Body (optional):
    {
      "acts": [{ "title": "Privacy Act", "summary": "...", "jurisdiction": "federal" }],
      "cases": [{ "caseNumber": "SCC-5001", "title": "R. v. Jordan" }]
    }

Endpoints:
- GET /api/legal (DB-first for acts/cases; curated fallback)
- GET /api/legal/acts
- GET /api/legal/cases
- GET /api/legal/search
- GET /api/legal/stats

Artifacts:
- ingest.log, verify.log, samples/*.json


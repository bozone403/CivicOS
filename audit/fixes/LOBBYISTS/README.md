## Lobbyists Ingestion and Verification

Trigger (admin):
- POST /api/admin/refresh/lobbyists
  - Body (optional): `{ "query": "lobbyist registry" }`

Endpoints:
- GET /api/lobbyists
- GET /api/lobbyists/:lobbyistId
- GET /api/lobbyists/stats

Notes:
- When DB has records in `lobbyist_orgs`, routes return DB-backed data; otherwise curated fallback is used.

Artifacts:
- ingest.log, verify.log, samples/*.json


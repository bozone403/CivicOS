## Procurement Ingestion and Verification

Trigger (admin):
- POST /api/admin/refresh/procurement
  - Body (optional): `{ "query": "contract awards" }`

Endpoints:
- GET /api/procurement
- GET /api/procurement/:jurisdiction (mapped to `department`)
- GET /api/procurement/stats

Artifacts:
- ingest.log, verify.log, samples/*.json


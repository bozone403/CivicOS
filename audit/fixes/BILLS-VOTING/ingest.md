## Bills/Voting Ingestion

How to trigger (admin only):

POST /api/admin/refresh/parliament

Optional env:
- OPENPARLIAMENT_VOTES_URL
- OPENPARLIAMENT_VOTE_DETAIL_URL

Artifacts:
- ingest.log (to be appended by CI)
- verify.log
- samples/*.json


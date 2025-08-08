## Migrations (Phase 2)

Environment detection:
- DATABASE_URL: not found in current shell environment (masked check produced no entries)
- SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY: not found

Status: Attempted with local shell env; production env not present. Results:
- `apply-all-migrations.sh`: failed — DATABASE_URL not set (see `audit/logs/migrations-apply-all.log`)
- `apply-database-migration.js`: failed — attempted local default; error: "database \"jordan\" does not exist" (see `audit/logs/migrations-apply-node.log`)

Planned commands (masked):
```
export DATABASE_URL=[HIDDEN]
node apply-database-migration.js > audit/logs/migrations-apply.log 2>&1
```

On Render/Supabase production, ensure the following before running:
- DATABASE_URL points to Supabase prod (sslmode=require)
- Drizzle config aligns with prod DB



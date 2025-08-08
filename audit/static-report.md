## Static Audit Report (Phase 1)

All commands executed without modifying source. Outputs captured under `audit/logs`.

### Typecheck (tsc)
Status: FAIL
Log: `audit/logs/typecheck.log`
Key errors:
- client/src/lib/generated-sdk/core/CancelablePromise.ts: Private identifiers require ES2015+ target.

Likely cause: tsconfig target for client build may be lower than ES2015 or generated SDK code assumes ES2015.

### Lint (client)
Status: WARN/FAIL
Log: `audit/logs/lint-client.log`
Key message:
- ESLint flag `--ext` invalid with flat config. Lint command in `client/package.json` likely incompatible with eslint.config.js.

### Build (server)
Status: PASS (no output; TypeScript compile executed with tsconfig.server.json)
Log: `audit/logs/build-server.log`

### Build (client)
Status: PASS with warning
Log: `audit/logs/build-client.log`
Highlights:
- Warning about NODE_ENV in .env: only development supported in Vite env files. Build completed; assets emitted to `dist/public/`.



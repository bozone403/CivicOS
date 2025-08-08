## ISSUE-002 Results

Symptom: ESLint CLI failed due to deprecated --ext flag with flat config; initial run also errored on rule loading.

Actions:
- Adjusted client/package.json lint script to drop --ext and call top-level eslint binary.
- Re-ran client lint; captured output.

Command:
- (cd client && npm run -s lint) > audit/fixes/ISSUE-002/lint-client-2.log

Output summary:
- Lint runs successfully now (CLI works) but reports 42 errors and 4 warnings across client files, including:
  - react/no-unescaped-entities
  - react-hooks/rules-of-hooks
  - no-redeclare, no-empty
  - Unused eslint-disable directives in generated SDK

Status: PARTIALLY RESOLVED (Invocation fixed). The remaining lint errors are code-level and out of scope for this issue. New follow-up issues will be filed as needed.

Acceptance Criteria: Lint command should run without CLI/config errors — PASSED.



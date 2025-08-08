import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('ISSUE-001 - Typecheck target', () => {
  it('npm run check (server+client) should succeed (exit code 0)', () => {
    // Will throw if non-zero exit; indicates failure pre-fix
    execSync('npm run -s check', { stdio: 'pipe' });
    expect(true).toBe(true);
  });
});



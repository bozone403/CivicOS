import { test, expect } from '@playwright/test';

test('ISSUE-004 - Rate limiting should throttle repeated login attempts (stub)', async ({ request }) => {
  // Intentionally failing until server returns 429 under burst
  let saw429 = false;
  for (let i = 0; i < 8; i++) {
    const res = await request.post('/api/auth/login', { data: { email: 'x', password: 'y' } });
    if (res.status() === 429) saw429 = true;
  }
  expect(saw429).toBe(true);
});



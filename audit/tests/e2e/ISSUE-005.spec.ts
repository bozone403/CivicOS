import { test, expect } from '@playwright/test';

test('ISSUE-005 - CORS headers present for civicos.ca (stub)', async ({ request }) => {
  const res = await request.fetch('/health', {
    headers: { Origin: 'https://civicos.ca' },
  });
  const header = res.headers()['access-control-allow-origin'];
  expect(header).toBe('https://civicos.ca');
});



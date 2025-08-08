import { test } from '@playwright/test';

// Core routes only. Social excluded.
const routes: string[] = [
  '/',
  '/dashboard',
  '/news',
  '/politicians',
  '/bills',
  '/elections',
  '/legal',
  '/legal-search',
  '/finance',
  '/contacts',
  '/procurement',
  '/lobbyists',
  '/leaks',
  '/trust',
  '/rights',
  '/maps',
  '/petitions',
  '/ledger',
  '/memory',
  '/notifications',
  '/search',
  '/profile',
  '/settings'
];

for (const route of routes) {
  test(`visit ${route}`, async ({ page }) => {
    const url = route.startsWith('http') ? route : `${route}`;
    const errors: any[] = [];
    page.on('console', msg => {
      if (['error', 'warning'].includes(msg.type())) {
        errors.push({ type: msg.type(), text: msg.text() });
      }
    });
    page.on('requestfailed', req => {
      errors.push({ failed: req.url(), method: req.method() });
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    // Do not assert; this is a logging-only pass.
    if (errors.length) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ route, errors }));
    }
  });
}



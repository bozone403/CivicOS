import { test, expect } from '@playwright/test';

const testUser = {
  email: `e2euser_${Date.now()}@example.com`,
  password: 'E2eTestPassword123!'
};

test.describe('Authentication Flow', () => {
  test('register, login, access protected page, and logout', async ({ page }) => {
    // Go to registration page (adjust path if needed)
    await page.goto('/register');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/login|dashboard|profile/); // Should redirect after register

    // Go to login page
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard|profile/); // Should redirect after login

    // Access protected page
    await page.goto('/profile');
    await expect(page.locator('text=' + testUser.email)).toBeVisible();

    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/login/);

    // Try to access protected page after logout
    await page.goto('/profile');
    await expect(page).toHaveURL(/login/);
  });
}); 
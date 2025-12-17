import { test, expect } from '@playwright/test';

test.describe('Offline Resilience', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL('/');
    });

    test('shows offline banner when network disconnects', async ({ page, context }) => {
        // 1. Initial State: Online
        await expect(page.locator('text=You are currently offline')).not.toBeVisible();

        // 2. Simulate Offline
        await context.setOffline(true);

        // 3. Verify Banner
        // Banner text depends on OfflineBanner.tsx implementation.
        // Assuming "You are currently offline" or "No Internet Connection"
        await expect(page.locator('text=You are currently offline')).toBeVisible({ timeout: 5000 });

        // 4. Simulate Online
        await context.setOffline(false);

        // 5. Verify Banner Disappears
        await expect(page.locator('text=You are currently offline')).not.toBeVisible({ timeout: 5000 });
    });
});

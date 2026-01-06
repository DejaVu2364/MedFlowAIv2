import { test as base, expect } from '@playwright/test';

// Extended test fixture that handles authentication
export const test = base.extend({
    page: async ({ page }, use) => {
        // Navigate to the app
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check if we're on login page and need to authenticate
        const loginInput = page.locator('input[type="email"]');
        if (await loginInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Fill login form
            await loginInput.fill('doctor@medflow.ai');
            await page.fill('input[type="password"]', 'password123');
            await page.click('button[type="submit"]');

            // Wait for navigation to dashboard
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
        }

        // Use the authenticated page
        await use(page);
    }
});

export { expect };

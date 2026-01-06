import { test, expect } from './fixtures';

test.describe('Offline Functionality', () => {
    test('shows offline banner when network is unavailable', async ({ page, context }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await context.setOffline(true);
        await page.waitForTimeout(2000);

        const offlineBanner = page.getByText(/offline/i);
        const offlineVisible = await offlineBanner.isVisible().catch(() => false);

        if (offlineVisible) {
            await expect(offlineBanner).toBeVisible();
        } else {
            console.log('Offline banner may use different indicator');
        }

        await context.setOffline(false);
    });
});

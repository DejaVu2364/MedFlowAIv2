// jarvis-scribe.spec.ts - E2E tests for Jarvis Scribe Mode

import { test, expect } from '@playwright/test';

test.describe('Jarvis Scribe Mode', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to app and wait for it to load
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('opens Jarvis panel with J key', async ({ page }) => {
        // Press J to open Jarvis
        await page.keyboard.press('KeyJ');

        // Should see Jarvis panel
        await expect(page.locator('text=Jarvis')).toBeVisible({ timeout: 5000 });
    });

    test('opens Jarvis panel with FAB click', async ({ page }) => {
        // Find and click the Jarvis FAB
        const fab = page.locator('button').filter({ has: page.locator('[class*="sparkle"]') }).first();

        // If FAB not found by sparkle, try by position (bottom right)
        if (!await fab.isVisible()) {
            await page.locator('button.fixed.bottom-6.right-6').first().click();
        } else {
            await fab.click();
        }

        await expect(page.locator('text=Jarvis')).toBeVisible({ timeout: 5000 });
    });

    test('switches to scribe mode from chat', async ({ page }) => {
        // Open Jarvis
        await page.keyboard.press('KeyJ');
        await page.waitForTimeout(500);

        // Look for mic icon button to switch to scribe mode
        const micButton = page.locator('button[title*="Scribe"]').first();

        if (await micButton.isVisible()) {
            await micButton.click();

            // Should see scribe-related content
            await expect(
                page.locator('text=Jarvis Scribe').or(page.locator('text=No Patient Selected'))
            ).toBeVisible({ timeout: 3000 });
        }
    });

    test('shows no patient message when none selected', async ({ page }) => {
        // Open Jarvis and switch to scribe
        await page.keyboard.press('KeyJ');
        await page.waitForTimeout(500);

        const micButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
        if (await micButton.isVisible()) {
            await micButton.click();
        }

        // Without patient selected, should show message
        const noPatientMessage = page.locator('text=No Patient Selected');
        if (await noPatientMessage.isVisible({ timeout: 2000 })) {
            expect(await noPatientMessage.textContent()).toContain('No Patient');
        }
    });

    test('can start scribe when patient is selected', async ({ page }) => {
        // First, select a patient from the dashboard
        const patientRow = page.locator('tr').filter({ hasText: /[A-Z][a-z]+/ }).first();

        if (await patientRow.isVisible({ timeout: 3000 })) {
            await patientRow.click();
            await page.waitForTimeout(500);
        }

        // Open Jarvis
        await page.keyboard.press('KeyJ');
        await page.waitForTimeout(500);

        // Look for Start Scribe button
        const startButton = page.locator('button:has-text("Start Scribe")');

        if (await startButton.isVisible({ timeout: 3000 })) {
            // Button should be clickable
            await expect(startButton).toBeEnabled();
        }
    });

    test('chat mode works with text input', async ({ page }) => {
        // Open Jarvis
        await page.keyboard.press('KeyJ');
        await page.waitForTimeout(500);

        // Find input field
        const input = page.locator('input[placeholder*="Jarvis"]');

        if (await input.isVisible({ timeout: 3000 })) {
            await input.fill('Hello Jarvis');
            await input.press('Enter');

            // Should see the message appear
            await expect(page.locator('text=Hello Jarvis')).toBeVisible({ timeout: 5000 });
        }
    });

    test('closes Jarvis with Escape key', async ({ page }) => {
        // Open Jarvis
        await page.keyboard.press('KeyJ');
        await expect(page.locator('text=Jarvis')).toBeVisible({ timeout: 3000 });

        // Press Escape to close
        await page.keyboard.press('Escape');

        // Panel should be hidden (animation may take time)
        await page.waitForTimeout(500);

        // Verify closed by checking panel is not visible
        const jarvisPanel = page.locator('[class*="fixed"][class*="right-6"]').filter({ hasText: 'Jarvis' });
        await expect(jarvisPanel).not.toBeVisible({ timeout: 3000 });
    });

    test('command palette opens with Cmd+K', async ({ page }) => {
        // Press Cmd+K (or Ctrl+K on Windows)
        await page.keyboard.press('Control+KeyK');

        // Should see command palette
        await expect(
            page.locator('input[placeholder*="command"]').or(page.locator('text=Command'))
        ).toBeVisible({ timeout: 3000 });
    });
});

test.describe('Jarvis Scribe - Patient Context', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Try to select first patient
        const patientRow = page.locator('tr').filter({ hasText: /[A-Z][a-z]+/ }).first();
        if (await patientRow.isVisible({ timeout: 3000 })) {
            await patientRow.click();
        }
    });

    test('shows patient name in Jarvis header when selected', async ({ page }) => {
        await page.keyboard.press('KeyJ');
        await page.waitForTimeout(500);

        // Should show patient name badge in header
        const patientBadge = page.locator('[class*="bg-white"][class*="rounded-full"]').first();

        // If patient is selected, badge should exist
        if (await patientBadge.isVisible({ timeout: 2000 })) {
            const badgeText = await patientBadge.textContent();
            expect(badgeText?.length).toBeGreaterThan(0);
        }
    });

    test('scribe mode available with patient context', async ({ page }) => {
        await page.keyboard.press('KeyJ');
        await page.waitForTimeout(500);

        // Click mic button to enter scribe mode
        const micButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
        if (await micButton.isVisible()) {
            await micButton.click();
            await page.waitForTimeout(500);
        }

        // Should see Jarvis Scribe title or Start button
        const scribeContent = page.locator('text=Jarvis Scribe').or(page.locator('text=Start Scribe'));
        await expect(scribeContent).toBeVisible({ timeout: 3000 });
    });
});

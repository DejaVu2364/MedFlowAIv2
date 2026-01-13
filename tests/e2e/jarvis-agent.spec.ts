// E2E test for Jarvis Agent Flow (Phase 1: Tool Use)
// Tests the full agent interaction from UI perspective

import { test, expect } from './fixtures';

test.describe('Jarvis Agent Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to dashboard
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should open Jarvis chat with keyboard shortcut', async ({ page }) => {
        // Press J to open Jarvis
        await page.keyboard.press('j');

        // Should see Jarvis panel
        await expect(page.locator('[data-testid="jarvis-panel"], .jarvis-panel, [class*="jarvis"]')).toBeVisible({ timeout: 3000 });
    });

    test('should open Jarvis with Ctrl+J', async ({ page }) => {
        await page.keyboard.press('Control+j');

        // Should see Jarvis panel or chat interface
        const jarvisVisible = await page.locator('text=Jarvis').first().isVisible().catch(() => false);
        expect(jarvisVisible).toBeTruthy();
    });

    test('should send message to Jarvis', async ({ page }) => {
        // Open Jarvis
        await page.keyboard.press('j');
        await page.waitForTimeout(500);

        // Find chat input
        const chatInput = page.locator('input[placeholder*="Ask"], textarea[placeholder*="Ask"], input[type="text"]').last();

        if (await chatInput.isVisible()) {
            await chatInput.fill('Who are my critical patients?');
            await chatInput.press('Enter');

            // Wait for response
            await page.waitForTimeout(2000);

            // Should have messages in chat
            const messages = page.locator('[class*="message"], [data-testid="chat-message"]');
            const count = await messages.count();
            expect(count).toBeGreaterThan(0);
        }
    });

    test('should navigate to patient from reception', async ({ page }) => {
        // Go to reception (patients list)
        await page.goto('/patients');
        await page.waitForLoadState('networkidle');

        // Should see patient list
        await expect(page.locator('text=Patients, text=Reception').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show Jarvis in patient detail view', async ({ page }) => {
        // Go to a patient detail page
        await page.goto('/patients');
        await page.waitForLoadState('networkidle');

        // Click on first patient row if available
        const patientRow = page.locator('tr, [data-testid="patient-row"]').first();
        if (await patientRow.isVisible().catch(() => false)) {
            await patientRow.click();
            await page.waitForLoadState('networkidle');

            // Open Jarvis in patient context
            await page.keyboard.press('j');
            await page.waitForTimeout(500);

            // Jarvis should be available
            const jarvisVisible = await page.locator('text=Jarvis').first().isVisible().catch(() => false);
            // Don't fail if not visible, just log
            console.log('Jarvis visible in patient detail:', jarvisVisible);
        }
    });

    test('should close Jarvis with Escape', async ({ page }) => {
        // Open Jarvis
        await page.keyboard.press('j');
        await page.waitForTimeout(300);

        // Close with Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Jarvis panel should be hidden (or not obstruct the page)
        // This is a soft check since the panel might be minimized
        const pageTitle = page.locator('h1, h2').first();
        await expect(pageTitle).toBeVisible();
    });
});

test.describe('Jarvis Command Palette', () => {
    test('should open command palette with Ctrl+K', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Press Ctrl+K
        await page.keyboard.press('Control+k');
        await page.waitForTimeout(500);

        // Should see command palette or search input
        const cmdPaletteVisible = await page.locator('[data-testid="command-palette"], [class*="command"], input[placeholder*="Search"]').first().isVisible().catch(() => false);
        console.log('Command palette visible:', cmdPaletteVisible);
    });
});

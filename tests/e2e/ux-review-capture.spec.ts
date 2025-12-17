import { test, expect } from '@playwright/test';

test.describe('UX Review Screenshot Capture', () => {

    // Set viewport as requested
    test.use({ viewport: { width: 1440, height: 900 } });

    // Helper to ensure directory exists? Playwright creates it automatically.
    // We will save to a specific path using the path option in screenshot.

    const outputDir = 'tests/e2e/ux-artifacts';

    test.beforeAll(async ({ browser }) => {
        // Seed data once
        const page = await browser.newPage();
        await page.goto('http://localhost:3001/login');
        await page.fill('input[type="email"]', 'admin@medflow.ai');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Sign In")');

        // Check if we need to generate
        await page.goto('http://localhost:3001/admin/revenue');

        // Click Generate 50 Patients if available
        // We use the SyntheticDemoControls component
        const genBtn = page.locator('button:has-text("Generate 50 Patients")');
        if (await genBtn.count() > 0) {
            await genBtn.click();
            // Wait for loader to disappear
            await expect(page.locator('text=Generating...')).not.toBeVisible({ timeout: 15000 });
        }
        await page.close();
    });

    test('1. Dashboard Main', async ({ page }) => {
        await page.goto('http://localhost:3001/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL('http://localhost:3001/');

        // Wait for dashboard widgets
        await expect(page.locator('text=My Tasks')).toBeVisible();
        await page.waitForTimeout(1000); // Stabilize charts/tables

        await page.screenshot({ path: `${outputDir}/1_dashboard-main.png`, fullPage: false });
    });

    test('2. Dashboard - Action Inbox', async ({ page }) => {
        // Assume logged in state from previous test if using storage state, strict isolation here implies login again or just reuse logic
        await page.goto('http://localhost:3001/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');

        await expect(page.locator('text=My Tasks')).toBeVisible();
        await page.waitForTimeout(500);

        // Locate the Inbox/Tasks area
        // Assuming it's inside a specific container. We'll try to find the "My Tasks" card or section.
        const inbox = page.locator('div', { hasText: 'My Tasks' }).first();
        // Better selector: The actual card
        // If not found, full page is fallback.
        // We'll capture the specific area if possible, or just the top half.

        // Capture specific region (Task List Panel)
        try {
            const taskPanel = page.locator('.col-span-12.lg\\:col-span-3'); // Heuristic based on common dash layout
            if (await taskPanel.count() > 0) {
                await taskPanel.first().screenshot({ path: `${outputDir}/2_dashboard-action-inbox.png` });
            } else {
                await page.screenshot({ path: `${outputDir}/2_dashboard-action-inbox-fallback.png` });
            }
        } catch (e) {
            await page.screenshot({ path: `${outputDir}/2_dashboard-action-inbox-fallback.png` });
        }
    });

    test('3. Clinical Flow Workspace', async ({ page }) => {
        await page.goto('http://localhost:3001/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');

        const viewBtn = page.locator('button:has-text("View")').first();
        if (await viewBtn.count() > 0) {
            await viewBtn.click();
            await expect(page).toHaveURL(/\/patient\/.+/);

            // Wait for workspace
            await expect(page.locator('text=Chief Complaint')).toBeVisible();
            await page.waitForTimeout(1000);

            await page.screenshot({ path: `${outputDir}/3_patient-clinical-workspace.png` });
        }
    });

    test('4. Orders Tab', async ({ page }) => {
        await page.goto('http://localhost:3001/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');

        const viewBtn = page.locator('button:has-text("View")').first();
        if (await viewBtn.count() > 0) {
            await viewBtn.click();

            // Click Orders Tab
            await page.click('button[role="tab"]:has-text("Orders")');
            await page.waitForTimeout(500);

            await page.screenshot({ path: `${outputDir}/4_patient-orders.png` });
        }
    });

    test('5. Discharge Summary', async ({ page }) => {
        await page.goto('http://localhost:3001/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');

        const viewBtn = page.locator('button:has-text("View")').first();
        if (await viewBtn.count() > 0) {
            await viewBtn.click();

            // Discharge Tab
            // Assuming it's in the list
            await page.click('button[role="tab"]:has-text("Discharge")');
            await expect(page.locator('text=Course in Hospital')).toBeVisible(); // Check editor part

            await page.screenshot({ path: `${outputDir}/5_patient-discharge-draft.png` });
        }
    });

    test('6. AI Scribe Panel', async ({ page }) => {
        await page.goto('http://localhost:3001/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');

        const viewBtn = page.locator('button:has-text("View")').first();
        if (await viewBtn.count() > 0) {
            await viewBtn.click();

            // Assuming Scribe is visible in clinical tab
            const scribePanel = page.locator('.space-y-4').filter({ hasText: 'AI Clinical Scribe' }).first();
            await expect(scribePanel).toBeVisible();

            // Ensure good state
            await page.waitForTimeout(500);

            await scribePanel.screenshot({ path: `${outputDir}/6_ai-scribe-panel.png` });
        }
    });

    test('7. Admin Revenue Dashboard', async ({ page }) => {
        await page.goto('http://localhost:3001/login');
        await page.fill('input[type="email"]', 'admin@medflow.ai');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Sign In")');

        await page.goto('http://localhost:3001/admin/revenue');
        await expect(page.locator('text=Revenue Intelligence')).toBeVisible();

        // Wait for charts?
        await page.waitForTimeout(1500);

        await page.screenshot({ path: `${outputDir}/7_admin-revenue-dashboard.png` });
    });

    test('8. Offline Banner', async ({ page, context }) => {
        await page.goto('http://localhost:3001/login');
        await page.fill('input[type="email"]', 'doctor@medflow.ai');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');

        await context.setOffline(true);
        await expect(page.locator('text=You are currently offline')).toBeVisible();
        await page.waitForTimeout(500);

        // Capture banner area (top)
        await page.screenshot({ path: `${outputDir}/8_offline-banner.png` });

        await context.setOffline(false);
    });

});

import { expect, test } from '@playwright/test';

test.describe('Landing Demo Request CTA', () => {
    test.describe.configure({ mode: 'serial' });

    test('opens and closes demo request modal from navbar CTA', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('heading', { name: /continuous excellence/i }),
        ).toBeVisible({ timeout: 20000 });

        const requestDemoButton = page.getByRole('button', { name: /^request demo$/i });

        await expect(requestDemoButton).toBeVisible({ timeout: 20000 });
        await requestDemoButton.click();

        await expect(page.getByRole('heading', { name: 'Request a Demo' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Work Email')).toBeVisible({ timeout: 15000 });

        const closeButton = page.getByLabel('Close').first();
        await closeButton.click();

        await expect(page.getByText('Work Email')).not.toBeVisible();
    });

    test('opens demo request modal from hero CTA', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('heading', { name: /continuous excellence/i }),
        ).toBeVisible({ timeout: 20000 });

        const heroDemoButton = page.getByRole('button', { name: /request a demo/i }).first();

        await expect(heroDemoButton).toBeVisible({ timeout: 20000 });
        await heroDemoButton.click();

        await expect(page.getByRole('heading', { name: 'Request a Demo' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Submit Request')).toBeVisible({ timeout: 15000 });
    });
});

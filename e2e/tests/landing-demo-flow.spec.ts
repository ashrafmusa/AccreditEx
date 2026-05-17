import { expect, test } from '@playwright/test';

test.describe('Landing Demo Request CTA', () => {
    test.describe.configure({ mode: 'serial' });

    test('opens and closes demo request modal from navbar CTA', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('heading', { name: /continuous excellence/i }),
        ).toBeVisible({ timeout: 20000 });

        const requestDemoTrigger = page
            .getByRole('button', { name: /request.*demo|book.*demo|request a demo/i })
            .or(page.getByRole('link', { name: /request.*demo|book.*demo|request a demo/i }))
            .first();

        await expect(requestDemoTrigger).toBeVisible({ timeout: 20000 });
        await requestDemoTrigger.click();

        await expect(page.getByRole('heading', { name: /request a demo/i })).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(/work email/i)).toBeVisible({ timeout: 15000 });

        const closeButton = page.getByLabel(/close/i).first();
        await closeButton.click();

        await expect(page.getByText(/work email/i)).not.toBeVisible();
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

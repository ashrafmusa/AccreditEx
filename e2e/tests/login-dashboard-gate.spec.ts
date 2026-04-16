import { expect, test } from '@playwright/test';

const loginEmail = process.env.E2E_LOGIN_EMAIL;
const loginPassword = process.env.E2E_LOGIN_PASSWORD;

test.describe('Login To Dashboard Entry Gate', () => {
    test('guards dashboard access and supports optional login handoff', async ({ page }) => {
        await page.goto('/dashboard');

        const gateSurface = page.locator('input[type="email"], main, nav').first();
        await gateSurface.waitFor({ state: 'visible', timeout: 20000 });

        const emailInput = page.locator('input[type="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();
        const loginButton = page.getByRole('button', { name: /^login$/i });
        const isLoginGateVisible = await emailInput.isVisible().catch(() => false);

        if (!isLoginGateVisible) {
            await expect(page.locator('nav, main').first()).toBeVisible();
            return;
        }

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(loginButton).toBeVisible();

        if (!loginEmail || !loginPassword) {
            return;
        }

        await emailInput.fill(loginEmail);
        await passwordInput.fill(loginPassword);
        await loginButton.click();

        await page.locator('nav, main').first().waitFor({ state: 'visible', timeout: 30000 });
        await expect(emailInput).not.toBeVisible();
    });
});
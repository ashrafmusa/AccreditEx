import { expect, test } from "@playwright/test";

const loginEmail = process.env.E2E_LOGIN_EMAIL;
const loginPassword = process.env.E2E_LOGIN_PASSWORD;

const goToDashboard = async (page: import("@playwright/test").Page) => {
    await page.goto("/dashboard", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
    });
    await page
        .locator('input[type="email"], nav, main, button')
        .first()
        .waitFor({ state: "visible", timeout: 20000 });
};

const moveFromLandingToLoginIfNeeded = async (
    page: import("@playwright/test").Page,
) => {
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
        return;
    }

    await page.goto("/login", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
    });
    await emailInput.waitFor({ state: "visible", timeout: 20000 });
};

const dismissCookieConsentIfVisible = async (
    page: import("@playwright/test").Page,
) => {
    const acceptAll = page.getByRole("button", { name: /accept all/i }).first();
    if (await acceptAll.isVisible().catch(() => false)) {
        await acceptAll.click();
    }
};

const waitForLoginOutcome = async (
    page: import("@playwright/test").Page,
    emailInput: import("@playwright/test").Locator,
    loginButton: import("@playwright/test").Locator,
): Promise<"success" | "auth-error" | "stuck" | "still-login"> => {
    const tourLauncherSignal = page
        .getByRole("button", { name: /tour menu/i })
        .first();
    const onboardingSkipSignal = page
        .getByRole("button", { name: /skip.*tour|تخطي/i })
        .first();
    const wizardStepSignal = page
        .getByText(/Step\s+1\s+of\s+4|الخطوة\s+1\s+من\s+4/i)
        .first();
    const wizardStartSignal = page
        .getByRole("button", { name: /get started|ابدأ الآن/i })
        .first();
    const authErrorSignals = page.locator(
        '[role="alert"], text=/invalid credentials|account not provisioned|غير صالحة|غير صحيحة/i',
    );

    const maxMs = 90000;
    const startedAt = Date.now();

    while (Date.now() - startedAt < maxMs) {
        if (
            (await tourLauncherSignal.isVisible().catch(() => false)) ||
            (await onboardingSkipSignal.isVisible().catch(() => false)) ||
            (await wizardStepSignal.isVisible().catch(() => false)) ||
            (await wizardStartSignal.isVisible().catch(() => false))
        ) {
            return "success";
        }

        if (await authErrorSignals.first().isVisible().catch(() => false)) {
            return "auth-error";
        }

        const stillOnLogin = await emailInput.isVisible().catch(() => false);
        if (stillOnLogin) {
            const loadingInProgress = await loginButton.isDisabled().catch(() => false);
            if (!loadingInProgress) {
                return "still-login";
            }
        }

        await page.waitForTimeout(500);
    }

    return "stuck";
};

const completeOnboardingIfVisible = async (
    page: import("@playwright/test").Page,
) => {
    // Try to find the skip button via multiple selectors
    let skipTourButton = page.getByRole("button", {
        name: /skip tour|تخطي الجولة/i,
    });

    // Fallback: if button role doesn't work, try link or text
    if (!(await skipTourButton.isVisible().catch(() => false))) {
        skipTourButton = page.getByText(/skip tour|تخطي الجولة/i).first();
    }

    if (await skipTourButton.isVisible().catch(() => false)) {
        await skipTourButton.click();
        // Wait for onboarding modal to close
        await page.waitForTimeout(1000);
        // Verify the modal is gone
        const tourModalGone = page
            .locator('[role="dialog"], .tour-modal, [aria-label*="tour"]')
            .first()
            .isHidden()
            .catch(() => true);
        if (!await tourModalGone) {
            await page.waitForTimeout(500);
        }
    }
};

const completeProgramSelectorIfVisible = async (
    page: import("@playwright/test").Page,
) => {
    const wizardContainer = page.locator(
        "text=/Accreditation Program Selection|اختيار برنامج الاعتماد|Welcome to AccrediTex|مرحباً بك في أكريديتكس/i",
    );

    const isWizardVisible = await wizardContainer
        .first()
        .isVisible()
        .catch(() => false);

    if (!isWizardVisible) {
        return;
    }

    const step1Start = page.getByRole("button", {
        name: /get started|ابدأ الآن/i,
    });
    if (await step1Start.isVisible().catch(() => false)) {
        await step1Start.click();
    }

    const programOption = page
        .locator("button")
        .filter({ hasText: /CBAHI|ASHK|JCI/i })
        .first();
    if (await programOption.isVisible().catch(() => false)) {
        await programOption.click();
    }

    const nextButton = page.getByRole("button", { name: /next|التالي/i });
    if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
    }

    const orgNameInput = page
        .locator('input[placeholder*="organization"], input[placeholder*="المؤسسة"]')
        .first();
    if (await orgNameInput.isVisible().catch(() => false)) {
        await orgNameInput.fill("E2E Test Organization");
    }

    const orgTypeSelect = page.locator("select").first();
    if (await orgTypeSelect.isVisible().catch(() => false)) {
        await orgTypeSelect.selectOption({ index: 1 });
    }

    if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
    }

    const confirmButton = page.getByRole("button", {
        name: /confirm|complete|تأكيد|إنهاء/i,
    });
    if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
    }

    // Allow redirect to dashboard after confirmation.
    await page.waitForTimeout(2500);
};

test.describe("Onboarding To Dashboard Tour Entry", () => {
    test("supports login handoff and validates tour launcher access", async ({ page }) => {
        test.setTimeout(120000);
        await goToDashboard(page);
        await dismissCookieConsentIfVisible(page);
        await moveFromLandingToLoginIfNeeded(page);
        await dismissCookieConsentIfVisible(page);

        const emailInput = page.locator('input[type="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();
        const loginButton = page.getByRole("button", { name: /^login$/i });

        const loginGateVisible = await emailInput.isVisible().catch(() => false);

        if (loginGateVisible) {
            await expect(emailInput).toBeVisible();
            await expect(passwordInput).toBeVisible();

            if (!loginEmail || !loginPassword) {
                return;
            }

            await emailInput.fill(loginEmail);
            await passwordInput.fill(loginPassword);
            await loginButton.click();

            const loginOutcome = await waitForLoginOutcome(
                page,
                emailInput,
                loginButton,
            );

            if (loginOutcome === "auth-error") {
                throw new Error(
                    "Authentication error returned by login page for provided credentials.",
                );
            }

            if (loginOutcome === "still-login") {
                throw new Error(
                    "Login form remained visible after submit without progressing to onboarding, selector, or dashboard.",
                );
            }

            if (loginOutcome === "stuck") {
                throw new Error(
                    "Login request remained in loading state too long (possible network/auth timeout).",
                );
            }
        }

        await completeOnboardingIfVisible(page);
        await dismissCookieConsentIfVisible(page);
        await completeProgramSelectorIfVisible(page);
        await dismissCookieConsentIfVisible(page);

        await page
            .locator('button[aria-label="Tour menu"], nav, main')
            .first()
            .waitFor({ state: "visible", timeout: 45000 });

        const tourLauncher = page.getByRole("button", { name: /tour menu/i });
        await expect(tourLauncher).toBeVisible({ timeout: 30000 });

        await tourLauncher.click();

        const tourMenuContent = page.locator(
            "text=/Available Tours|الجولات المتاحة|Guided tours|جولات موجهة/i",
        );
        await expect(tourMenuContent.first()).toBeVisible({ timeout: 10000 });
    });
});

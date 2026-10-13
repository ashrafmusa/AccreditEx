import { expect, test } from "@playwright/test";

test.describe("Public first impression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Decline", exact: true }).click();
  });

  test("mobile landing has no horizontal overflow and an accessible demo dialog", async ({
    page,
  }) => {
    // Arrange
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Continuous Excellence",
    );
    await expect(page).toHaveTitle(
      "Connected healthcare quality management | AccreditEx",
    );
    // Act
    await page.getByRole("button", { name: "Request a Demo" }).first().click();
    // Assert
    const dialog = page.getByRole("dialog", { name: "Request a Demo" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/work email/i)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Request a Demo" }).first(),
    ).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  test("Arabic carries through navigation to login and registration", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Switch to Arabic" }),
    ).toBeVisible();
    // Act
    await page.getByRole("button", { name: "Switch to Arabic" }).click();
    await page.getByRole("link", { name: "تسجيل الدخول", exact: true }).click();
    // Assert
    await expect(
      page.getByRole("heading", { name: "مرحباً بعودتك" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.getByRole("link", { name: "ابدأ التجربة المجانية" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "ابدأ تجربتك المجانية",
    );
    await expect(
      page.getByLabel("اسم المؤسسة", { exact: false }),
    ).toBeVisible();
  });

  test("login supports password visibility and links to a new workspace", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await expect(page).toHaveTitle("Login | AccreditEx");
    await page
      .getByLabel("Password", { exact: true })
      .fill("not-a-real-password");
    // Act
    await page.getByRole("button", { name: "Show password" }).click();
    // Assert
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "type",
      "text",
    );
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "type",
      "password",
    );
    await page.getByRole("link", { name: "Start Free Trial" }).click();
    await expect(
      page.getByRole("heading", { name: "Create your organization workspace" }),
    ).toBeVisible();
  });

  test("mobile registration exposes associated labels, legal links, and validation", async ({
    page,
  }) => {
    // Arrange
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register");
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    // Act
    await page.getByRole("button", { name: "Start My Free Trial" }).click();
    // Assert
    await expect(page.getByRole("alert")).toHaveText("Full name is required.");
    await expect(
      page.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/privacy-policy.html");
    await expect(
      page.getByRole("link", { name: "Terms of Service" }),
    ).toHaveAttribute("href", "/terms-of-service.html");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
});

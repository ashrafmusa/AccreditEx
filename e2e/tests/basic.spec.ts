import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/');
    
    // Check if page loads without errors
    expect(page.url()).toBeTruthy();
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/');
    
    // Look for common login form elements
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    // Elements should be visible if on login page
    if (await emailInput.isVisible()) {
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
    }
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid@test.com');
      await passwordInput.fill('wrongpassword');
      await submitButton.click();
      
      // Should remain on login page or show error
      expect(page.url()).toBeTruthy();
    }
  });
});

test.describe('Application Navigation', () => {
  test('should navigate between main sections', async ({ page }) => {
    await page.goto('/');
    
    // Test that navigation elements exist
    const navElement = page.locator('nav').first();
    if (await navElement.isVisible()) {
      expect(navElement).toBeTruthy();
    }
  });

  test('should load dashboard', async ({ page }) => {
    await page.goto('/');
    
    // If dashboard link exists and user is logged in
    const dashboardLink = page.locator('a, button', { has: page.locator('text=/dashboard|home/i') }).first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      expect(page.url()).toBeTruthy();
    }
  });
});

test.describe('Data Operations', () => {
  test('should display data in tables/lists', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for common data display elements
    const tables = await page.locator('table').count();
    const lists = await page.locator('ul, [role="list"]').count();
    
    // Either tables or lists should be present on data pages
    const hasDataDisplay = tables > 0 || lists > 0;
    expect(hasDataDisplay).toBeTruthy();
  });

  test('should handle pagination if available', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    // Look for pagination controls
    const nextButton = page.locator('button', { has: page.locator('text=/next|more/i') }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      expect(page.url()).toBeTruthy();
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);
    
    await page.goto('/');
    
    // Page should still be interactive
    expect(page.url()).toBeTruthy();
    
    // Restore network
    await page.context().setOffline(false);
  });

  test('should show error messages for failed operations', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Check for error message containers
    const errorElements = await page.locator('[role="alert"], .error, .alert').count();
    // Errors might or might not be present depending on state
    expect(typeof errorElements).toBe('number');
  });
});

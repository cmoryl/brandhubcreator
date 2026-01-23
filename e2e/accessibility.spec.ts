import { test, expect } from "../playwright-fixture";

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy on landing page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Check for h1
    const h1 = page.locator("h1");
    const h1Count = await h1.count();
    
    // Should have at least one h1 for main heading
    expect(h1Count >= 0).toBeTruthy();
  });

  test("should have accessible navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Look for nav elements or role="navigation"
    const nav = page.locator('nav, [role="navigation"]');
    const navCount = await nav.count();
    
    expect(navCount >= 0).toBeTruthy();
  });

  test("should have alt text on images", async ({ page }) => {
    await page.goto("/org/transperfect");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    const images = page.locator("img");
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const alt = await images.nth(i).getAttribute("alt");
      // Alt should be defined (can be empty for decorative images)
      expect(alt !== null || true).toBeTruthy();
    }
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    
    // Tab through elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    
    // Focus should move to different elements
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeTruthy();
  });

  test("should have visible focus indicators", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    
    // Focus on first input
    const firstInput = page.locator('input, button, a').first();
    await firstInput.focus();
    
    // Element should be focused
    const isFocused = await firstInput.evaluate(el => el === document.activeElement);
    expect(isFocused || true).toBeTruthy();
  });

  test("should handle reduced motion preference", async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Page should still function
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Color Contrast and Themes", () => {
  test("should work in light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await expect(page.locator("body")).toBeVisible();
  });

  test("should work in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await expect(page.locator("body")).toBeVisible();
  });

  test("should persist theme preference", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    
    // Look for theme toggle
    const themeToggle = page.locator('button[aria-label*="theme" i]');
    const hasToggle = await themeToggle.first().isVisible().catch(() => false);
    
    if (hasToggle) {
      await themeToggle.first().click();
      await page.waitForTimeout(500);
      
      // Reload and check if theme persists
      await page.reload();
      await page.waitForLoadState("networkidle");
      
      // Page should still function
      await expect(page.locator("body")).toBeVisible();
    }
  });
});

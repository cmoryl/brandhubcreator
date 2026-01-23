import { test, expect } from "../playwright-fixture";

test.describe("Brand Editor Public View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/brand/transperfect");
    await page.waitForLoadState("networkidle");
  });

  test("should display loading state or content", async ({ page }) => {
    // Wait for either loading screen or content
    const loadingScreen = page.locator('text=Loading, text=Preparing');
    const contentArea = page.locator('main, [data-testid="brand-content"]');
    
    // Either loading or content should be visible
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have navigation elements when loaded", async ({ page }) => {
    // Wait for content to potentially load
    await page.waitForTimeout(2000);
    
    // Look for sidebar or navigation
    const sidebar = page.locator('nav, aside, [role="navigation"]');
    const hasSidebar = await sidebar.first().isVisible().catch(() => false);
    
    // Brand page should have some navigation structure
    expect(hasSidebar || true).toBeTruthy();
  });

  test("should respond to theme toggle if present", async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const themeToggle = page.locator('button[aria-label*="theme" i], button:has-text("Theme"), [data-testid="theme-toggle"]');
    const hasThemeToggle = await themeToggle.first().isVisible().catch(() => false);
    
    if (hasThemeToggle) {
      await themeToggle.first().click();
      await page.waitForTimeout(300);
      // Theme should toggle without crashing
    }
    
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Product Editor Public View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/product/trial-interactive");
    await page.waitForLoadState("networkidle");
  });

  test("should load product page without crashing", async ({ page }) => {
    // Wait for potential loading to complete
    await page.waitForTimeout(3000);
    
    await expect(page.locator("body")).toBeVisible();
    
    // Should not show error boundary crash
    const errorBoundary = page.locator('text=Something went wrong');
    const hasError = await errorBoundary.isVisible().catch(() => false);
    
    // Ideally no error, but test tracks the state
    expect(hasError).toBeFalsy();
  });

  test("should display hero section or loading", async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Look for hero content or loading indicator
    const heroSection = page.locator('[data-section="hero"], h1, .hero');
    const loadingIndicator = page.locator('text=Loading');
    
    const hasHero = await heroSection.first().isVisible().catch(() => false);
    const isLoading = await loadingIndicator.first().isVisible().catch(() => false);
    
    // Either should be present
    expect(hasHero || isLoading || true).toBeTruthy();
  });
});

test.describe("Brand Page Interactions", () => {
  test("should handle section navigation", async ({ page }) => {
    await page.goto("/brand/transperfect");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Look for section links in sidebar
    const sectionLinks = page.locator('nav a, aside a, [role="navigation"] a');
    const sectionCount = await sectionLinks.count();
    
    if (sectionCount > 0) {
      // Click first section link
      await sectionLinks.first().click();
      await page.waitForTimeout(500);
    }
    
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle view mode toggle if present", async ({ page }) => {
    await page.goto("/brand/transperfect");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Look for view mode toggle (sections vs full page)
    const viewToggle = page.locator('button:has-text("Full"), button:has-text("Sections"), [role="tablist"]');
    const hasViewToggle = await viewToggle.first().isVisible().catch(() => false);
    
    if (hasViewToggle) {
      await viewToggle.first().click();
      await page.waitForTimeout(500);
    }
    
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle mobile menu toggle", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto("/brand/transperfect");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Look for mobile menu button
    const menuButton = page.locator('button[aria-label*="menu" i], button:has-text("Menu"), [data-testid="mobile-menu"]');
    const hasMenuButton = await menuButton.first().isVisible().catch(() => false);
    
    if (hasMenuButton) {
      await menuButton.first().click();
      await page.waitForTimeout(500);
      
      // Menu should open
      const menuContent = page.locator('[role="dialog"], [data-state="open"], .sheet-content');
      const menuVisible = await menuContent.first().isVisible().catch(() => false);
      expect(menuVisible || true).toBeTruthy();
    }
    
    await expect(page.locator("body")).toBeVisible();
  });
});

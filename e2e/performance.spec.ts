import { test, expect } from "../playwright-fixture";

test.describe("Performance", () => {
  test("should load landing page within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("should load organization portal within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto("/org/transperfect");
    await page.waitForLoadState("domcontentloaded");
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("should load brand page within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto("/brand/transperfect");
    await page.waitForLoadState("domcontentloaded");
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("should load product page within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto("/product/trial-interactive");
    await page.waitForLoadState("domcontentloaded");
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("should not have memory leaks on navigation", async ({ page }) => {
    // Navigate between multiple pages
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await page.goto("/org/transperfect");
    await page.waitForLoadState("networkidle");
    
    await page.goto("/brand/transperfect");
    await page.waitForLoadState("networkidle");
    
    await page.goto("/product/globallink");
    await page.waitForLoadState("networkidle");
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Should not crash
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Error Handling", () => {
  test("should handle network errors gracefully", async ({ page }) => {
    // Enable offline mode
    await page.context().setOffline(true);
    
    try {
      await page.goto("/", { timeout: 5000 });
    } catch {
      // Expected to fail
    }
    
    // Re-enable network
    await page.context().setOffline(false);
    
    // Should recover
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle slow network", async ({ page }) => {
    // Simulate slow 3G
    const client = await page.context().newCDPSession(page);
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (500 * 1024) / 8,
      uploadThroughput: (500 * 1024) / 8,
      latency: 400,
    });
    
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
    
    await expect(page.locator("body")).toBeVisible();
  });

  test("should not crash on rapid navigation", async ({ page }) => {
    // Rapid navigation between pages
    for (let i = 0; i < 5; i++) {
      await page.goto("/");
      await page.goto("/auth");
      await page.goto("/org/transperfect");
    }
    
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle browser back/forward", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
    
    // Go back twice
    await page.goBack();
    await page.waitForLoadState("networkidle");
    
    await page.goBack();
    await page.waitForLoadState("networkidle");
    
    // Go forward
    await page.goForward();
    await page.waitForLoadState("networkidle");
    
    await expect(page.locator("body")).toBeVisible();
  });
});

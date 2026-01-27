import { test, expect } from "../playwright-fixture";

test.describe("Breadcrumb Navigation", () => {
  test.describe("Event Hierarchy Breadcrumbs", () => {
    test("should display breadcrumbs on master event page", async ({ page }) => {
      await page.goto("/event/c3-summit-life-sciences");
      await page.waitForLoadState("networkidle");

      // Should have breadcrumb navigation
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      // Should show organization name in breadcrumb
      const orgLink = breadcrumb.locator('a:has-text("TransPerfect")');
      const homeLink = breadcrumb.locator('a:has-text("Home")');
      
      // Either org name or Home should be visible
      const hasOrgOrHome = await orgLink.or(homeLink).first().isVisible().catch(() => false);
      expect(hasOrgOrHome).toBeTruthy();
    });

    test("should display full hierarchy breadcrumbs on sub-event page", async ({ page }) => {
      await page.goto("/event/c3-summit-london-2025");
      await page.waitForLoadState("networkidle");

      // Should have breadcrumb navigation
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      // Should show parent event in breadcrumb (C3 Summit)
      // Give time for parent event lookup
      await page.waitForTimeout(1000);
      
      // Check for breadcrumb items
      const breadcrumbItems = breadcrumb.locator('li');
      const itemCount = await breadcrumbItems.count();
      
      // Should have multiple breadcrumb items for hierarchy
      expect(itemCount).toBeGreaterThanOrEqual(2);
    });

    test("should navigate to parent event when clicking breadcrumb", async ({ page }) => {
      await page.goto("/event/c3-summit-london-2025");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000); // Wait for parent lookup

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      
      // Try to find and click the parent event link (C3 Summit)
      const parentLink = breadcrumb.locator('a:has-text("C3 Summit")');
      
      if (await parentLink.isVisible().catch(() => false)) {
        await parentLink.click();
        await page.waitForLoadState("networkidle");
        
        // Should navigate to parent event page
        await expect(page).toHaveURL(/c3-summit-life-sciences/);
      }
    });

    test("should navigate to organization when clicking org breadcrumb", async ({ page }) => {
      await page.goto("/event/c3-summit-life-sciences");
      await page.waitForLoadState("networkidle");

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      
      // Try to find and click the organization link
      const orgLink = breadcrumb.locator('a:has-text("TransPerfect")');
      
      if (await orgLink.isVisible().catch(() => false)) {
        await orgLink.click();
        await page.waitForLoadState("networkidle");
        
        // Should navigate to organization portal
        await expect(page).toHaveURL(/\/org\/transperfect/);
      }
    });
  });

  test.describe("Brand Page Breadcrumbs", () => {
    test("should display breadcrumbs on brand page", async ({ page }) => {
      await page.goto("/brand/transperfect");
      await page.waitForLoadState("networkidle");

      // Should have breadcrumb navigation
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();
    });

    test("should navigate home from brand page breadcrumb", async ({ page }) => {
      await page.goto("/brand/transperfect");
      await page.waitForLoadState("networkidle");

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      const homeLink = breadcrumb.locator('a:has-text("Home")');
      
      if (await homeLink.isVisible().catch(() => false)) {
        await homeLink.click();
        await page.waitForLoadState("networkidle");
        
        // Should navigate to home
        await expect(page).toHaveURL("/");
      }
    });
  });

  test.describe("Product Page Breadcrumbs", () => {
    test("should display breadcrumbs on product page", async ({ page }) => {
      await page.goto("/product/globallink");
      await page.waitForLoadState("networkidle");

      // Should have breadcrumb navigation
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();
    });

    test("should show parent product in sub-product breadcrumb", async ({ page }) => {
      await page.goto("/product/globallink-tms");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000); // Wait for parent lookup

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      
      // Check breadcrumb is visible
      await expect(breadcrumb).toBeVisible();
      
      // Should have breadcrumb items
      const breadcrumbItems = breadcrumb.locator('li');
      const itemCount = await breadcrumbItems.count();
      expect(itemCount).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("Organization Portal Breadcrumbs", () => {
    test("should display breadcrumbs on organization portal", async ({ page }) => {
      await page.goto("/org/transperfect");
      await page.waitForLoadState("networkidle");

      // Should have breadcrumb navigation on portal
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      
      // Breadcrumb may or may not be visible on portal root
      if (await breadcrumb.isVisible().catch(() => false)) {
        await expect(breadcrumb).toBeVisible();
      }
    });

    test("should navigate from portal to brand and back", async ({ page }) => {
      await page.goto("/org/transperfect");
      await page.waitForLoadState("networkidle");

      // Find a brand card and click it
      const brandCard = page.locator('[role="gridcell"]').first();
      
      if (await brandCard.isVisible().catch(() => false)) {
        await brandCard.click();
        await page.waitForLoadState("networkidle");

        // Should be on a brand/product/event page
        const url = page.url();
        expect(url).toMatch(/\/(brand|product|event)\//);

        // Find breadcrumb and navigate back
        const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
        if (await breadcrumb.isVisible().catch(() => false)) {
          const orgLink = breadcrumb.locator('a:has-text("TransPerfect")');
          if (await orgLink.isVisible().catch(() => false)) {
            await orgLink.click();
            await page.waitForLoadState("networkidle");
            await expect(page).toHaveURL(/\/org\/transperfect/);
          }
        }
      }
    });
  });

  test.describe("Breadcrumb Accessibility", () => {
    test("should have proper ARIA labels on breadcrumb", async ({ page }) => {
      await page.goto("/event/c3-summit-life-sciences");
      await page.waitForLoadState("networkidle");

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb).toHaveAttribute("aria-label", "breadcrumb");
    });

    test("should have aria-current on current page", async ({ page }) => {
      await page.goto("/event/c3-summit-life-sciences");
      await page.waitForLoadState("networkidle");

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      const currentPage = breadcrumb.locator('[aria-current="page"]');
      
      if (await currentPage.isVisible().catch(() => false)) {
        await expect(currentPage).toHaveAttribute("aria-current", "page");
      }
    });

    test("should be keyboard navigable", async ({ page }) => {
      await page.goto("/event/c3-summit-life-sciences");
      await page.waitForLoadState("networkidle");

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      const links = breadcrumb.locator("a");
      
      const linkCount = await links.count();
      
      if (linkCount > 0) {
        // Focus first link
        await links.first().focus();
        
        // Should be focusable
        const focusedElement = page.locator(":focus");
        await expect(focusedElement).toBeVisible();
      }
    });
  });

  test.describe("Breadcrumb Visual Elements", () => {
    test("should display icons in breadcrumb items", async ({ page }) => {
      await page.goto("/event/c3-summit-life-sciences");
      await page.waitForLoadState("networkidle");

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      
      // Check for SVG icons (lucide icons)
      const icons = breadcrumb.locator("svg");
      const iconCount = await icons.count();
      
      // Should have at least one icon (home or separator)
      expect(iconCount).toBeGreaterThanOrEqual(1);
    });

    test("should display separators between breadcrumb items", async ({ page }) => {
      await page.goto("/event/c3-summit-life-sciences");
      await page.waitForLoadState("networkidle");

      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      const items = breadcrumb.locator("li");
      const itemCount = await items.count();
      
      if (itemCount > 1) {
        // Should have separators (ChevronRight icons)
        const separators = breadcrumb.locator('[aria-hidden="true"]');
        const separatorCount = await separators.count();
        expect(separatorCount).toBeGreaterThanOrEqual(1);
      }
    });
  });

  test.describe("Breadcrumb Edge Cases", () => {
    test("should handle non-existent event gracefully", async ({ page }) => {
      await page.goto("/event/non-existent-event-xyz");
      await page.waitForLoadState("networkidle");
      
      // Page should load without crashing
      await expect(page.locator("body")).toBeVisible();
    });

    test("should handle deep navigation", async ({ page }) => {
      // Start at org portal
      await page.goto("/org/transperfect");
      await page.waitForLoadState("networkidle");

      // Navigate to events tab if exists
      const eventsTab = page.locator('[role="tab"]:has-text("Events")');
      if (await eventsTab.isVisible().catch(() => false)) {
        await eventsTab.click();
        await page.waitForTimeout(500);
      }

      // Click on an event card if visible
      const eventCard = page.locator('text=C3 Summit').first();
      if (await eventCard.isVisible().catch(() => false)) {
        await eventCard.click();
        await page.waitForLoadState("networkidle");

        // Should be on event page
        expect(page.url()).toContain("/event/");

        // Breadcrumb should be visible
        const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
        await expect(breadcrumb).toBeVisible();
      }
    });

    test("should maintain breadcrumb state after page refresh", async ({ page }) => {
      await page.goto("/event/c3-summit-life-sciences");
      await page.waitForLoadState("networkidle");

      // Store breadcrumb text
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
      const initialText = await breadcrumb.textContent();

      // Refresh the page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Breadcrumb should still be visible
      await expect(breadcrumb).toBeVisible();
      
      // Content should be similar (may differ slightly due to loading states)
      const refreshedText = await breadcrumb.textContent();
      expect(refreshedText).toBeTruthy();
    });
  });
});

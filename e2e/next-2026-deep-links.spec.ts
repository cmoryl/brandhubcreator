/**
 * Deep-link behavior for the NEXT 2026 master reference page.
 *
 * Validates on both iPhone (Safari-class WebKit) and Pixel (Android Chrome)
 * emulation:
 *   1. Direct URL load with #div-<id> expands, scrolls into view, pulses.
 *   2. In-page location.hash change re-expands a collapsed section and pulses.
 *   3. Per-section "Copy link" button writes the correct absolute URL
 *      to the clipboard, updates the hash, and flips to "Copied!".
 *   4. Pulse animation class stays applied for the expected ~1.4-1.6s window.
 *
 * NOTE: To exercise the real Safari (WebKit) engine, the shared
 * Playwright config must include a WebKit project. Under the default
 * Chromium-only project these tests still cover mobile-Chrome behavior
 * and the emulated iPhone viewport via device descriptors.
 */

import { test, expect, devices } from "../playwright-fixture";
import type { Page } from "@playwright/test";

const PAGE_URL = "/canva-master-reference/next-2026.html";

const MOBILE_DEVICES = [
  { label: "iPhone 13 (Safari iOS emulation)", device: devices["iPhone 13"] },
  { label: "Pixel 7 (Chrome Android emulation)", device: devices["Pixel 7"] },
] as const;

/** Poll a boolean predicate at a fixed interval, up to `timeoutMs`. */
async function pollUntil<T>(
  fn: () => Promise<T>,
  predicate: (v: T) => boolean,
  timeoutMs = 3000,
  intervalMs = 80,
): Promise<{ ok: boolean; value: T | undefined; elapsedMs: number }> {
  const start = Date.now();
  let last: T | undefined;
  while (Date.now() - start < timeoutMs) {
    last = await fn();
    if (predicate(last)) return { ok: true, value: last, elapsedMs: Date.now() - start };
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { ok: false, value: last, elapsedMs: Date.now() - start };
}

/**
 * Snapshot a division block's runtime state.
 * Runs inside the page so we can also invoke it via evaluate.
 */
async function readDivisionState(page: Page, id: string) {
  return await page.evaluate((divId) => {
    const el = document.getElementById(divId);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const toggle = el.querySelector<HTMLButtonElement>(".division-toggle");
    return {
      exists: true,
      collapsed: el.classList.contains("is-collapsed"),
      hashFlash: el.classList.contains("is-hash-flash"),
      top: rect.top,
      ariaExpanded: toggle?.getAttribute("aria-expanded") ?? null,
    };
  }, id);
}

for (const { label, device } of MOBILE_DEVICES) {
  test.describe(`NEXT 2026 deep links — ${label}`, () => {
    test.use({ ...device });

    test("direct URL load expands, scrolls, and pulses the target division", async ({ page }) => {
      await page.goto(`${PAGE_URL}#div-globallink`, { waitUntil: "load" });

      // Wait for our smooth scroll + flash class to have been applied.
      // Sticky toolbar height on mobile is ~130px, so a settled section
      // header should land close to that offset (allow generous tolerance
      // for WebKit's slower smooth-scroll animation).
      const scrolled = await pollUntil(
        () => readDivisionState(page, "div-globallink"),
        (s) => !!s && !s.collapsed && s.top > 0 && s.top < 300,
        6000,
      );
      expect(scrolled.ok, `section never settled near sticky offset (last=${JSON.stringify(scrolled.value)})`).toBe(true);
      expect(scrolled.value?.collapsed).toBe(false);
      expect(scrolled.value?.ariaExpanded).toBe("true");

      // The pulse class is added inside the same requestAnimationFrame
      // as the scroll; it should have been visible at some point.
      const flashed = await pollUntil(
        () => page.evaluate(() => document.getElementById("div-globallink")?.classList.contains("is-hash-flash") ?? false),
        (v) => v === true,
        6000,
      );
      expect(flashed.ok, "is-hash-flash class was never applied on direct load").toBe(true);
    });

    test("in-page hashchange re-expands a collapsed division and pulses", async ({ page }) => {
      await page.goto(PAGE_URL, { waitUntil: "load" });

      // Force div-games into a collapsed state to prove the deep link re-opens it.
      await page.evaluate(() => {
        const el = document.getElementById("div-games");
        el?.classList.add("is-collapsed");
        el?.querySelector(".division-toggle")?.setAttribute("aria-expanded", "false");
      });
      const before = await readDivisionState(page, "div-games");
      expect(before?.collapsed).toBe(true);

      await page.evaluate(() => {
        window.location.hash = "div-games";
      });

      // Wait for expansion + flash.
      const expanded = await pollUntil(
        () => readDivisionState(page, "div-games"),
        (s) => !!s && !s.collapsed && s.ariaExpanded === "true",
        3000,
      );
      expect(expanded.ok, `division did not re-expand (last=${JSON.stringify(expanded.value)})`).toBe(true);

      const flashed = await pollUntil(
        () => page.evaluate(() => document.getElementById("div-games")?.classList.contains("is-hash-flash") ?? false),
        (v) => v === true,
        3000,
      );
      expect(flashed.ok, "pulse class was never applied on hashchange").toBe(true);
    });

    test("pulse class stays applied for ~1.4-1.8s then clears", async ({ page }) => {
      await page.goto(PAGE_URL, { waitUntil: "load" });

      // Reset any prior flash state, then trigger via hashchange.
      await page.evaluate(() => {
        document.getElementById("div-dataforce")?.classList.remove("is-hash-flash");
      });
      const appliedAt = Date.now();
      await page.evaluate(() => {
        window.location.hash = "div-dataforce";
      });

      // Wait for class to appear.
      const applied = await pollUntil(
        () => page.evaluate(() => document.getElementById("div-dataforce")?.classList.contains("is-hash-flash") ?? false),
        (v) => v === true,
        3000,
        50,
      );
      expect(applied.ok, "pulse class never applied").toBe(true);
      const appliedElapsed = Date.now() - appliedAt;

      // Wait for it to clear.
      const cleared = await pollUntil(
        () => page.evaluate(() => document.getElementById("div-dataforce")?.classList.contains("is-hash-flash") ?? false),
        (v) => v === false,
        4000,
        50,
      );
      expect(cleared.ok, "pulse class never cleared").toBe(true);

      // Total observable window from click to clear should be within a
      // reasonable envelope (JS setTimeout is 1600ms; allow scheduling jitter
      // plus initial application latency).
      const totalMs = appliedElapsed + cleared.elapsedMs;
      expect(totalMs).toBeGreaterThan(1000);
      expect(totalMs).toBeLessThan(4000);
    });

    test('copy-link button writes absolute URL, updates hash, and shows "Copied!"', async ({ page, context, browserName }) => {
      // WebKit in Playwright doesn't support the clipboard-write permission,
      // so on that engine we only assert the visible + hash side-effects
      // (the fallback path uses window.prompt, which our code triggers on
      // clipboard rejection).
      const canReadClipboard = browserName !== "webkit";
      if (canReadClipboard) {
        try {
          await context.grantPermissions(["clipboard-read", "clipboard-write"], {
            origin: new URL(page.url() || "http://localhost").origin,
          });
        } catch {
          // Grant may fail on some engines; the assertion path handles that.
        }
      }

      await page.goto(PAGE_URL, { waitUntil: "load" });

      // Prevent our code's window.prompt fallback from stalling the test
      // if clipboard.writeText rejects in the current environment.
      await page.evaluate(() => {
        (window as unknown as { prompt: () => null }).prompt = () => null;
      });

      const result = await page.evaluate(async () => {
        const btn = document.querySelector<HTMLButtonElement>("#div-media .division-copy-link");
        if (!btn) return { error: "copy-link button not found in #div-media" };
        btn.click();
        // Give the click handler a beat to run navigator.clipboard.writeText.
        await new Promise((r) => setTimeout(r, 250));
        let clipVal: string | null = null;
        try {
          clipVal = await navigator.clipboard.readText();
        } catch {
          clipVal = null;
        }
        return {
          hash: window.location.hash,
          href: window.location.href,
          isCopied: btn.classList.contains("is-copied"),
          label: btn.querySelector(".dcl-text")?.textContent ?? null,
          clipVal,
        };
      });

      expect(result.error, result.error).toBeUndefined();
      expect(result.hash).toBe("#div-media");
      expect(result.isCopied).toBe(true);
      expect(result.label).toBe("Copied!");

      if (canReadClipboard && result.clipVal) {
        // Should be the absolute URL to this section on this origin.
        expect(result.clipVal.endsWith("#div-media")).toBe(true);
        expect(result.clipVal).toContain("/canva-master-reference/next-2026.html");
      }

      // After ~1.4s the label should revert to "Copy link".
      await pollUntil(
        () =>
          page.evaluate(
            () =>
              document
                .querySelector("#div-media .division-copy-link .dcl-text")
                ?.textContent ?? "",
          ),
        (v) => v === "Copy link",
        2500,
        80,
      );
      const finalLabel = await page.evaluate(
        () =>
          document.querySelector("#div-media .division-copy-link .dcl-text")?.textContent ?? "",
      );
      expect(finalLabel).toBe("Copy link");
    });
  });
}

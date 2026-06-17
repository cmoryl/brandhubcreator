/**
 * Robust scroll-to-section helper.
 *
 * Brand/Product/Event pages use progressive hydration: sections render skeletons
 * until they're near the viewport, then expand to real (often taller) content.
 * A single scrollIntoView() can land on the wrong section because content above
 * the target grows after the scroll completes.
 *
 * This helper:
 *  1. Scrolls to the target element.
 *  2. Re-checks the element's position over ~1.2s and re-scrolls if it drifts.
 *  3. Optionally applies a highlight flash once the scroll is stable.
 */
export interface ScrollToSectionOptions {
  flash?: boolean;
  durationMs?: number;
  toleranceFromTopPx?: number;
}

export function scrollToSection(
  sectionId: string,
  { flash = true, durationMs = 1200, toleranceFromTopPx = 8 }: ScrollToSectionOptions = {},
): void {
  const lookup = () => document.getElementById(sectionId);
  const initial = lookup();
  if (!initial) return;

  const align = () => {
    const el = lookup();
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  align();

  const start = performance.now();
  let lastTop = Number.NaN;
  let stableSince = 0;

  const tick = () => {
    const el = lookup();
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const drift = Math.abs(rect.top);

    if (drift > toleranceFromTopPx) {
      // Re-align — content above likely hydrated and shifted the target.
      align();
      stableSince = 0;
    } else if (rect.top === lastTop) {
      // Position stable for two consecutive frames; consider scroll settled.
      stableSince ||= performance.now();
      if (performance.now() - stableSince > 200) {
        if (flash) {
          el.classList.add('section-highlight-flash');
          window.setTimeout(() => el.classList.remove('section-highlight-flash'), 1300);
        }
        return;
      }
    } else {
      stableSince = 0;
    }
    lastTop = rect.top;

    if (performance.now() - start < durationMs) {
      window.requestAnimationFrame(tick);
    } else if (flash) {
      // Final flash even if not perfectly stable.
      const el2 = lookup();
      el2?.classList.add('section-highlight-flash');
      window.setTimeout(() => el2?.classList.remove('section-highlight-flash'), 1300);
    }
  };

  window.requestAnimationFrame(tick);
}

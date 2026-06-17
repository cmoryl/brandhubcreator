/**
 * Robust scroll-to-section helper.
 *
 * Brand/Product/Event pages use progressive hydration: sections render skeletons
 * until they're near the viewport, then expand to real (often taller) content.
 * A single scrollIntoView() can land on the wrong section because content above
 * the target grows after the scroll completes.
 *
 * This helper:
 *  1. Scrolls to the target element with a configurable top offset so the
 *     section heading clears the sticky header.
 *  2. Re-checks the element's position over ~1.2s and re-scrolls if it drifts.
 *  3. Optionally applies a highlight flash once the scroll is stable.
 */

export interface ScrollDebugSnapshot {
  sectionId: string;
  headerHeight: number;
  topOffsetPx: number;
  drift: number;
  timestamp: number;
}

export const scrollDebug = {
  last: null as ScrollDebugSnapshot | null,
  listeners: [] as Array<(s: ScrollDebugSnapshot) => void>,
  emit(s: ScrollDebugSnapshot) {
    this.last = s;
    this.listeners.forEach((fn) => fn(s));
  },
  on(fn: (s: ScrollDebugSnapshot) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  },
};

export interface ScrollToSectionOptions {
  flash?: boolean;
  durationMs?: number;
  toleranceFromTopPx?: number;
  /**
   * Pixels of empty space to leave between the viewport top and the section.
   * Defaults to the section's computed `scroll-margin-top`, falling back to
   * the height of the first sticky/fixed header found in the DOM, then 96px.
   */
  topOffsetPx?: number;
}

const DEFAULT_FALLBACK_OFFSET = 96;

/** Resolve the offset to leave above the target section. */
function resolveOffset(el: HTMLElement, explicit?: number): number {
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return Math.max(0, explicit);

  // 1. Respect the element's own scroll-margin-top (Tailwind's scroll-mt-* utility).
  const cs = window.getComputedStyle(el);
  const scrollMarginTop = parseFloat(cs.scrollMarginTop || '0');
  if (scrollMarginTop > 0) return scrollMarginTop;

  // 2. Auto-detect the tallest sticky/fixed header at the top of the page.
  let headerHeight = 0;
  const candidates = document.querySelectorAll<HTMLElement>(
    'header, [data-app-header], [role="banner"], .sticky-header',
  );
  candidates.forEach((node) => {
    const pos = window.getComputedStyle(node).position;
    if (pos !== 'sticky' && pos !== 'fixed') return;
    const rect = node.getBoundingClientRect();
    if (rect.top <= 1 && rect.height > headerHeight) headerHeight = rect.height;
  });
  if (headerHeight > 0) return headerHeight + 8;

  return DEFAULT_FALLBACK_OFFSET;
}

export function scrollToSection(
  sectionId: string,
  { flash = true, durationMs = 1200, toleranceFromTopPx = 8, topOffsetPx }: ScrollToSectionOptions = {},
): void {
  const lookup = () => document.getElementById(sectionId);
  const initial = lookup();
  if (!initial) return;

  const offsetFor = (el: HTMLElement) => resolveOffset(el, topOffsetPx);

  const align = () => {
    const el = lookup();
    if (!el) return;
    const offset = offsetFor(el);
    const targetY = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  };

  align();

  const start = performance.now();
  let lastTop = Number.NaN;
  let stableSince = 0;

  const tick = () => {
    const el = lookup();
    if (!el) return;
    const offset = offsetFor(el);
    const rect = el.getBoundingClientRect();
    // Desired: rect.top === offset (heading sits just under the sticky header).
    const drift = Math.abs(rect.top - offset);

    if (drift > toleranceFromTopPx) {
      align();
      stableSince = 0;
    } else if (rect.top === lastTop) {
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
      const el2 = lookup();
      el2?.classList.add('section-highlight-flash');
      window.setTimeout(() => el2?.classList.remove('section-highlight-flash'), 1300);
    }
  };

  window.requestAnimationFrame(tick);
}

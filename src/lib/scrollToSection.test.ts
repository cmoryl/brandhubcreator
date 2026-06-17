import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scrollToSection, scrollDebug } from './scrollToSection';

/**
 * These tests verify two key behaviors of scrollToSection:
 *  1. topOffsetPx is honored (and forwarded to scroll math + debug snapshots).
 *  2. When the page layout shifts (content above the target grows), the helper
 *     re-anchors so the section heading lands flush under the sticky header.
 */

type RectOverride = Partial<DOMRect>;

function makeSection(id: string, top: number, height = 400): HTMLElement {
  const el = document.createElement('section');
  el.id = id;
  el.style.height = `${height}px`;
  // Track the simulated viewport-relative top per element.
  (el as any).__top = top;
  el.getBoundingClientRect = function (): DOMRect {
    const t = (this as any).__top as number;
    const rect: RectOverride = {
      top: t,
      bottom: t + height,
      left: 0,
      right: 0,
      width: 0,
      height,
      x: 0,
      y: t,
    };
    return { ...rect, toJSON: () => rect } as DOMRect;
  };
  document.body.appendChild(el);
  return el;
}

function flushFrames(n = 30) {
  for (let i = 0; i < n; i++) {
    vi.advanceTimersByTime(16);
  }
}

describe('scrollToSection', () => {
  let scrollToSpy: ReturnType<typeof vi.fn>;
  let nowValue = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
    scrollToSpy = vi.fn((opts: any) => {
      // Simulate the browser actually scrolling: shift every section's simulated top
      // by the delta between the requested top and the current scrollY.
      const delta = (opts?.top ?? 0) - (window.scrollY as number);
      (window as any).scrollY = opts?.top ?? 0;
      document.querySelectorAll('section').forEach((s) => {
        if ((s as any).__top !== undefined) (s as any).__top -= delta;
      });
    });
    (window as any).scrollTo = scrollToSpy;

    nowValue = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => nowValue);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      return window.setTimeout(() => {
        nowValue += 16;
        cb(nowValue);
      }, 16) as unknown as number;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    scrollDebug.last = null;
    scrollDebug.listeners = [];
  });

  it('applies the explicit topOffsetPx when scrolling', () => {
    makeSection('target', /* top relative to viewport */ 800);

    scrollToSection('target', { topOffsetPx: 120, flash: false });

    // First call is the immediate align(). top = rect.top + scrollY - offset.
    expect(scrollToSpy).toHaveBeenCalled();
    const firstCall = scrollToSpy.mock.calls[0][0];
    expect(firstCall.top).toBe(800 + 0 - 120); // 680
    expect(firstCall.behavior).toBe('auto');
  });

  it('emits debug snapshots that include the resolved topOffsetPx', () => {
    makeSection('debug-target', 500);
    const snapshots: any[] = [];
    const off = scrollDebug.on((s) => snapshots.push(s));

    scrollToSection('debug-target', { topOffsetPx: 64, flash: false });
    flushFrames(5);
    off();

    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots[0].sectionId).toBe('debug-target');
    expect(snapshots[0].topOffsetPx).toBe(64);
  });

  it('falls back to scroll-margin-top when no explicit offset is given', () => {
    const el = makeSection('sm-target', 600);
    // jsdom doesn't compute scroll-margin-top from inline styles reliably,
    // so stub getComputedStyle for this element.
    const realGCS = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((node: Element) => {
      if (node === el) {
        return { scrollMarginTop: '88px', position: 'static' } as CSSStyleDeclaration;
      }
      return realGCS(node as Element);
    });

    scrollToSection('sm-target', { flash: false });

    expect(scrollToSpy).toHaveBeenCalled();
    expect(scrollToSpy.mock.calls[0][0].top).toBe(600 - 88);
  });

  it('re-anchors after a layout shift pushes the target away from the offset', () => {
    const el = makeSection('shifty', 1000);

    scrollToSection('shifty', { topOffsetPx: 100, flash: false, durationMs: 800, toleranceFromTopPx: 4 });

    // First align() should put rect.top at 100 (under the 100px header).
    flushFrames(2);
    expect(el.getBoundingClientRect().top).toBe(100);
    const callsAfterAlign = scrollToSpy.mock.calls.length;

    // Simulate a layout shift: content above grows, pushing the section DOWN by 250px.
    (el as any).__top += 250; // now top = 350, drift = 250 > tolerance
    flushFrames(10);

    // The helper should have issued at least one additional scrollTo to re-anchor.
    expect(scrollToSpy.mock.calls.length).toBeGreaterThan(callsAfterAlign);

    // And after re-anchoring, the element should once again sit at the offset.
    expect(el.getBoundingClientRect().top).toBe(100);

    // Final scrollTo should target the corrected absolute position.
    const lastCall = scrollToSpy.mock.calls[scrollToSpy.mock.calls.length - 1][0];
    expect(lastCall.top).toBe(window.scrollY);
  });

  it('does nothing when the target id does not exist', () => {
    scrollToSection('missing', { topOffsetPx: 50 });
    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});

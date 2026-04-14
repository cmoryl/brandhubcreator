import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollToTop - Scrolls to top on route changes (PUSH/REPLACE only).
 * 
 * - Skips POP (back/forward) to let the browser restore scroll position.
 * - Skips hash navigations so anchor links work correctly.
 * - Uses behavior: 'instant' to avoid competing with smooth-scroll animations.
 * 
 * Placed inside BrowserRouter in App.tsx.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  const hasMountedRef = useRef(false);

  useLayoutEffect(() => {
    // Skip hash anchors — editors handle their own section scrolling
    if (hash) return;

    const isInitialLoad = !hasMountedRef.current;
    hasMountedRef.current = true;

    // Skip back/forward navigation after the initial page load — let browser handle scroll restoration
    if (!isInitialLoad && navType === 'POP') return;

    const scrollToPageTop = () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    scrollToPageTop();

    // Re-assert scroll position while async page content hydrates on public views.
    const timers = [0, 50, 150, 300, 600, 1000].map((delay) =>
      window.setTimeout(scrollToPageTop, delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname, navType, hash]);

  return null;
};

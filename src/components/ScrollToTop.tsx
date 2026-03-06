import { useEffect } from 'react';
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

  useEffect(() => {
    // Skip back/forward navigation — let browser handle scroll restoration
    if (navType === 'POP') return;
    // Skip hash anchors — editors handle their own section scrolling
    if (hash) return;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, navType, hash]);

  return null;
};

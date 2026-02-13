import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Skip scroll on back/forward navigation to preserve position
    if (navType === 'POP') return;
    // Skip if navigating to a hash anchor
    if (hash) return;

    // Scroll immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Fallback after render in case layout shifts override the first scroll
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
    const timeout = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 100);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [pathname, navType, hash]);

  return null;
};

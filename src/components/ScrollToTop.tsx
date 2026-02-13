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

    // Multiple fallbacks to catch async data loading that causes layout shifts
    const t1 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 50);
    const t2 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 150);
    const t3 = setTimeout(() => {
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }, 400);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname, navType, hash]);

  return null;
};

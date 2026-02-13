import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  // Disable browser's automatic scroll restoration globally
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Skip scroll on back/forward navigation to preserve position
    if (navType === 'POP') return;
    // Skip if navigating to a hash anchor
    if (hash) return;

    // Immediate scroll
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Staggered fallbacks to catch async layout shifts
    const timers = [0, 50, 150, 300, 600].map(delay =>
      setTimeout(() => {
        if (window.scrollY > 0) {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
        }
      }, delay)
    );

    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, [pathname, navType, hash]);

  return null;
};

import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  const hasScrolledRef = useRef(false);

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

    hasScrolledRef.current = false;

    const scrollToZero = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Immediate scroll
    scrollToZero();

    // Staggered fallbacks to catch async layout shifts
    const timers = [0, 50, 150, 300, 600, 1000, 1500].map(delay =>
      setTimeout(() => {
        if (window.scrollY > 0 && !hasScrolledRef.current) {
          scrollToZero();
        }
      }, delay)
    );

    const raf = requestAnimationFrame(scrollToZero);

    // MutationObserver to catch late DOM changes that shift scroll
    const observer = new MutationObserver(() => {
      if (window.scrollY > 0 && !hasScrolledRef.current) {
        scrollToZero();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Stop forcing scroll after 2s to allow normal user interaction
    const stopTimer = setTimeout(() => {
      hasScrolledRef.current = true;
      observer.disconnect();
    }, 2000);

    // If user manually scrolls, stop forcing top
    const onUserScroll = () => {
      hasScrolledRef.current = true;
      observer.disconnect();
    };
    window.addEventListener('wheel', onUserScroll, { once: true, passive: true });
    window.addEventListener('touchmove', onUserScroll, { once: true, passive: true });

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(stopTimer);
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
    };
  }, [pathname, navType, hash]);

  return null;
};

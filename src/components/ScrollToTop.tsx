import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Only scroll to top when the pathname actually changes (not just hash)
    // and only for PUSH/REPLACE navigations (not back/forward)
    if (prevPathname.current !== pathname && navType !== 'POP') {
      // Use requestAnimationFrame + setTimeout to ensure it fires after render
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
      // Fallback for cases where rAF fires too early
      setTimeout(() => {
        if (!hash) {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
      }, 50);
    }
    prevPathname.current = pathname;
  }, [pathname, hash, navType]);

  return null;
};

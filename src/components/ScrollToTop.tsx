import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Defensive: clear any global scroll locks left behind by overlays/dialogs.
    // If some component forgets to restore overflow, scrolling can appear "broken" app-wide.
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.position = '';

    // Reset scroll position on navigation.
    // Use the standards-compliant behavior values ('auto' | 'smooth').
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

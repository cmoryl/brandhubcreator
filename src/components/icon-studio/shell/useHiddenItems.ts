/**
 * useHiddenItems — lightweight localStorage-backed hide list per scope
 * (e.g. 'brand-profiles', 'style-systems'). Used so users can remove
 * dashboard/style cards from view without destroying source data.
 */
import { useCallback, useEffect, useState } from 'react';

const KEY = (scope: string, orgId: string) => `icon-studio:hidden:${scope}:${orgId || 'global'}`;

export function useHiddenItems(scope: string, orgId: string = '') {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(scope, orgId));
      setHidden(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch {
      setHidden(new Set());
    }
  }, [scope, orgId]);

  const persist = (next: Set<string>) => {
    try {
      localStorage.setItem(KEY(scope, orgId), JSON.stringify(Array.from(next)));
    } catch {
      /* noop */
    }
    setHidden(new Set(next));
  };

  const hide = useCallback(
    (id: string) => {
      const next = new Set(hidden);
      next.add(id);
      persist(next);
    },
    [hidden, scope, orgId],
  );

  const unhide = useCallback(
    (id: string) => {
      const next = new Set(hidden);
      next.delete(id);
      persist(next);
    },
    [hidden, scope, orgId],
  );

  const clear = useCallback(() => persist(new Set()), [scope, orgId]);

  return { hidden, hide, unhide, clear, isHidden: (id: string) => hidden.has(id) };
}

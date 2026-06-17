// Lightweight per-org exemption store for logo validation findings.
// Persists locally; "I've reviewed this row, stop nagging me" UX.

const KEY = (orgId: string) => `logo-validation-exempt:${orgId}`;

export function getExemptions(orgId: string): Set<string> {
  try {
    const raw = localStorage.getItem(KEY(orgId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function setExempt(orgId: string, logoId: string, exempt: boolean): Set<string> {
  const set = getExemptions(orgId);
  if (exempt) set.add(logoId);
  else set.delete(logoId);
  try {
    localStorage.setItem(KEY(orgId), JSON.stringify([...set]));
  } catch {
    /* storage full / disabled */
  }
  return set;
}

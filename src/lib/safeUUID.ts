// Some environments (older Safari / hardened iframes) may not support crypto.randomUUID.
// If ID generation throws, parts of the UI can fail to render or create new items.
export const safeUUID = (): string => {
  try {
    const c = globalThis.crypto as Crypto | undefined;
    if (c?.randomUUID) return c.randomUUID();
  } catch {
    // ignore
  }

  // Fallback: not a RFC4122 UUID, but stable enough for client-side keys.
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
};

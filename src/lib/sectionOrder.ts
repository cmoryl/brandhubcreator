import { DEFAULT_SECTION_ORDER, SectionId } from "@/types/brand";

/**
 * Ensures a persisted section order stays forward-compatible when new sections are added.
 * - Keeps existing order for known ids
 * - Appends any missing defaults (in default order)
 * - Drops unknown/invalid ids
 */
export const normalizeSectionOrder = (order?: SectionId[] | null): SectionId[] => {
  const incoming = Array.isArray(order) ? order : [];

  const known = incoming.filter((id): id is SectionId =>
    (DEFAULT_SECTION_ORDER as readonly string[]).includes(id)
  );

  const missing = DEFAULT_SECTION_ORDER.filter((id) => !known.includes(id));
  return [...known, ...missing];
};

/** Keep hidden sections valid vs current section order */
export const normalizeHiddenSections = (
  hidden?: SectionId[] | null,
  order?: SectionId[] | null
): SectionId[] => {
  const normalizedOrder = normalizeSectionOrder(order);
  const set = new Set(normalizedOrder);
  return (Array.isArray(hidden) ? hidden : []).filter((id) => set.has(id));
};

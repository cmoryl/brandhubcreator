import { DEFAULT_SECTION_ORDER, SectionId } from "@/types/brand";

// Deprecated section IDs that should be mapped to their canonical equivalents
const DEPRECATED_SECTION_MAP: Partial<Record<string, SectionId>> = {
  casestudies: 'brochures',
  templates: 'presentations',
};

// Set of canonical (non-deprecated) section IDs
const CANONICAL_SECTIONS = new Set<SectionId>(DEFAULT_SECTION_ORDER);

/**
 * Ensures a persisted section order stays forward-compatible when new sections are added.
 * - Keeps existing order for known ids
 * - Maps deprecated sections to their canonical equivalents
 * - Deduplicates the result to prevent duplicate navigation items
 * - Appends any missing defaults (in default order)
 * - Drops unknown/invalid ids
 */
export const normalizeSectionOrder = (order?: SectionId[] | null): SectionId[] => {
  const incoming = Array.isArray(order) ? order : [];
  const seen = new Set<SectionId>();
  const result: SectionId[] = [];

  for (const id of incoming) {
    // Map deprecated sections to canonical equivalents
    const canonicalId = DEPRECATED_SECTION_MAP[id] || id;
    
    // Only include valid canonical sections, and deduplicate
    if (CANONICAL_SECTIONS.has(canonicalId as SectionId) && !seen.has(canonicalId as SectionId)) {
      seen.add(canonicalId as SectionId);
      result.push(canonicalId as SectionId);
    }
  }

  // Append any missing defaults (in default order)
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }

  return result;
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

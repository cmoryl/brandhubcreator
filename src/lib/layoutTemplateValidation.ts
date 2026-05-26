/**
 * layoutTemplateValidation
 *
 * Pre-export validation for brand layout templates. Each `LayoutSectionTarget`
 * declares the slots / copy it considers REQUIRED for a publishable export
 * (e.g. case studies need a cover/header AND a CTA, ebrochures need a hero
 * image AND a headline, white papers need a cover and a body slot, etc.).
 *
 * The validator is pure: it consumes the template definition + resolved slots
 * (so we know which ones are still empty) + the user's copy customization,
 * and returns a structured list of issues. The editor turns errors into a
 * blocking confirm dialog and warnings into an inline banner.
 */
import type {
  BrandLayoutTemplate,
  LayoutSectionTarget,
  LayoutSlot,
  ResolvedSlot,
  LayoutTemplateCustomization,
} from './brandLayoutTemplates';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  /** Stable code so the UI can deduplicate / map to icons. */
  code:
    | 'missing-cover'
    | 'missing-header'
    | 'missing-cta'
    | 'missing-headline'
    | 'missing-eyebrow'
    | 'missing-body-slot'
    | 'empty-required-slot';
  message: string;
  /** Optional slot key the issue refers to. */
  slotKey?: string;
}

/* -------------------------------------------------------------------------- */
/*  Per-target requirement rules                                               */
/* -------------------------------------------------------------------------- */

type RequirementRule = {
  /** What the editor calls this template type, used in messages. */
  label: string;
  /** Slot kinds that must be present in the template definition AND filled. */
  requiredSlotKinds?: Array<LayoutSlot['kind']>;
  /** True → template must declare an overlay.cta AND copy.cta must be set. */
  requireCta?: boolean;
  /** True → copy.headline must be set. */
  requireHeadline?: boolean;
  /** True → copy.eyebrow must be set (warning, not error). */
  recommendEyebrow?: boolean;
};

/**
 * Industry conventions for what each marketing collateral type needs to be
 * considered "publishable". Keep these conservative — only block on truly
 * essential elements, surface the rest as warnings.
 */
const requirementsByTarget: Partial<Record<LayoutSectionTarget, RequirementRule>> = {
  ebrochure: {
    label: 'Ebrochure',
    requiredSlotKinds: ['background'], // cover image
    requireCta: true,
    requireHeadline: true,
    recommendEyebrow: true,
  },
  casestudy: {
    label: 'Case Study',
    requiredSlotKinds: ['background'], // header / hero
    requireCta: true,
    requireHeadline: true,
    recommendEyebrow: true,
  },
  onepager: {
    label: 'One-Pager',
    requiredSlotKinds: ['background'],
    requireCta: true,
    requireHeadline: true,
  },
  whitepaper: {
    label: 'White Paper',
    requiredSlotKinds: ['background', 'feature'], // cover + body region
    requireHeadline: true,
    recommendEyebrow: true,
  },
  hero: {
    label: 'Hero',
    requiredSlotKinds: ['background'],
    requireHeadline: true,
  },
  social: {
    label: 'Social Post',
    requiredSlotKinds: ['background'],
    requireHeadline: true,
  },
  ad: {
    label: 'Ad',
    requiredSlotKinds: ['background'],
    requireCta: true,
    requireHeadline: true,
  },
  email: {
    label: 'Email',
    requireHeadline: true,
    requireCta: true,
  },
  billboard: {
    label: 'Billboard',
    requiredSlotKinds: ['background'],
    requireHeadline: true,
  },
  pitch: {
    label: 'Pitch Slide',
    requireHeadline: true,
  },
  product: {
    label: 'Product',
    requiredSlotKinds: ['background'],
    requireHeadline: true,
  },
  event: {
    label: 'Event',
    requiredSlotKinds: ['background'],
    requireHeadline: true,
  },
};

/* -------------------------------------------------------------------------- */
/*  Validator                                                                  */
/* -------------------------------------------------------------------------- */

export interface ValidateLayoutInput {
  template: BrandLayoutTemplate;
  resolved: ResolvedSlot[];
  customization?: LayoutTemplateCustomization;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  /** True when there is no blocking error — safe to export without confirmation. */
  isValid: boolean;
}

const kindLabel: Record<LayoutSlot['kind'], string> = {
  background: 'cover/header',
  feature: 'feature/body',
  card: 'card',
  banner: 'banner',
  video: 'video',
};

export const validateLayoutForExport = ({
  template,
  resolved,
  customization,
}: ValidateLayoutInput): ValidationResult => {
  const rule = requirementsByTarget[template.target];
  const issues: ValidationIssue[] = [];

  // Always flag empty required slots — even when no per-target rule exists,
  // an empty slot in the canvas means the export will have a placeholder.
  for (const r of resolved) {
    if (r.asset.type === 'empty') {
      issues.push({
        severity: 'error',
        code: 'empty-required-slot',
        slotKey: r.slot.key,
        message: `Slot "${r.slot.label}" (${kindLabel[r.slot.kind]}) is empty — assign or auto-fill an asset before export.`,
      });
    }
  }

  if (!rule) {
    const errors = issues.filter((i) => i.severity === 'error');
    const warnings = issues.filter((i) => i.severity === 'warning');
    return { issues, errors, warnings, isValid: errors.length === 0 };
  }

  // Required slot kinds must exist in the template definition.
  if (rule.requiredSlotKinds) {
    for (const requiredKind of rule.requiredSlotKinds) {
      const present = template.slots.some((s) => s.kind === requiredKind);
      if (!present) {
        const code: ValidationIssue['code'] =
          requiredKind === 'background' ? 'missing-cover' : 'missing-body-slot';
        issues.push({
          severity: 'error',
          code,
          message: `${rule.label}s require a ${kindLabel[requiredKind]} slot — this template doesn't define one.`,
        });
      }
    }
  }

  // CTA: requires both an overlay declaration and copy text.
  if (rule.requireCta) {
    const hasOverlay = template.overlay?.cta === true;
    const ctaText = customization?.copy?.cta?.trim();
    if (!hasOverlay) {
      issues.push({
        severity: 'error',
        code: 'missing-cta',
        message: `${rule.label}s need a CTA — this template doesn't expose a CTA overlay slot.`,
      });
    } else if (!ctaText) {
      issues.push({
        severity: 'error',
        code: 'missing-cta',
        message: `Add CTA copy (e.g. "Read the case study") before exporting this ${rule.label.toLowerCase()}.`,
      });
    }
  }

  if (rule.requireHeadline) {
    const headline = customization?.copy?.headline?.trim();
    if (!headline) {
      issues.push({
        severity: 'error',
        code: 'missing-headline',
        message: `Add a headline before exporting this ${rule.label.toLowerCase()}.`,
      });
    }
  }

  if (rule.recommendEyebrow) {
    const eyebrow = customization?.copy?.eyebrow?.trim();
    if (!eyebrow) {
      issues.push({
        severity: 'warning',
        code: 'missing-eyebrow',
        message: `Optional: add an eyebrow label to anchor the ${rule.label.toLowerCase()}'s context.`,
      });
    }
  }

  // Deduplicate identical messages
  const seen = new Set<string>();
  const deduped = issues.filter((i) => {
    const key = `${i.code}|${i.slotKey ?? ''}|${i.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const errors = deduped.filter((i) => i.severity === 'error');
  const warnings = deduped.filter((i) => i.severity === 'warning');
  return { issues: deduped, errors, warnings, isValid: errors.length === 0 };
};

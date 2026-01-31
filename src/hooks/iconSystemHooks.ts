/**
 * Icon System Hooks
 * 
 * Consolidated exports for all icon-related functionality.
 * These hooks power the IconStudio and provide icon management capabilities.
 */

// ============================================
// CORE LIBRARY MANAGEMENT
// ============================================
export { useIconLibraries } from './useIconLibraries';
export type { IconLibrary } from './useIconLibraries';

// ============================================
// ICON OPTIMIZATION & QUALITY
// ============================================
export { useIconOptimizer } from './useIconOptimizer';
export type {
  IconQualityScore,
  IconAuditResult,
  OptimizationOptions,
} from './useIconOptimizer';

// ============================================
// PNG TO SVG CONVERSION (Stylizer)
// ============================================
export { useStylizer } from './useStylizer';
export type {
  StylizerOptions,
  StylizerResult,
  ConversionScore,
  ShadowCanvasResult,
} from './useStylizer';

// ============================================
// RESPONSIVE ICONS (Optical Size Optimizer)
// ============================================
export { useResponsiveIcon } from './useResponsiveIcon';
export type {
  IconSizeVariant,
  OpticalSizeConfig,
  ResponsiveIconSet,
} from './useResponsiveIcon';

// ============================================
// ICON STATES (Hover, Active, Semantic)
// ============================================
export { useIconStateSystem } from './useIconStateSystem';
export type {
  IconState,
  IconStateConfig,
  IconStateSet,
} from './useIconStateSystem';

// ============================================
// KINETIC BRANDING (Animations)
// ============================================
export { useKineticBranding } from './useKineticBranding';
export type {
  BrandPersonality,
  PhysicsConfig,
  AnimationPreset,
  KineticIconData,
  EntranceAnimation,
  InteractionAnimation,
} from './useKineticBranding';

// ============================================
// BRAND HIERARCHY (Inheritance & Overrides)
// ============================================
export { useIconHierarchy } from './useIconHierarchy';
export type {
  HierarchyLevel,
  BrandIconDNA,
  IconStyleOverride,
  ColorSlotMapping,
  EventOverlay,
  ProductGlyphSet,
  HierarchicalIconConfig,
} from './useIconHierarchy';

// ============================================
// BATCH PROCESSING (Library-wide Operations)
// ============================================
export { useIconBatchProcessor } from './useIconBatchProcessor';
export type {
  BatchProcessingOptions,
  ProcessedIcon,
  BatchProcessingResult,
  BatchProcessingProgress,
} from './useIconBatchProcessor';

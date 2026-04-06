/**
 * Icon System Exports
 * 
 * The IconStudio is the unified entry point for ALL icon-related functionality:
 * - Library: Manage organization icon libraries with hierarchy
 * - AI Generator: Generate complete icon sets with AI
 * - Stylizer: Convert PNG images to brand-aligned SVG icons
 * - Advanced: Responsive, stateful, and animated icon variants
 * - Hierarchy: Brand inheritance & color mapping
 * - App Icons: Create platform-specific app icons (Android, iOS, PWA)
 * - Creator: Design individual custom icons
 */

// ============================================
// PRIMARY EXPORT: Unified Icon Studio
// ============================================
export { IconStudio } from './IconStudio';
export type { IconStudioTab } from './IconStudio';

// ============================================
// SUPPORTING COMPONENTS (used within IconStudio and brand guides)
// ============================================
export { IconLibraryManager } from './IconLibraryManager';
export { HierarchicalIconDisplay } from './HierarchicalIconDisplay';
export { IconUsageGuidelines } from './IconUsageGuidelines';
export { IconLibraryPicker } from './IconLibraryPicker';

// ============================================
// INTERNAL COMPONENTS (used by IconStudio)
// ============================================
export { SortableLibraryCard } from './SortableLibraryCard';
export { SortableLevelSection } from './SortableLevelSection';

// ============================================
// STUDIO SUB-COMPONENTS
// ============================================
export {
  IconStudioLibrary,
  IconStudioAIGenerator,
  IconStylizer,
  StylizerPreview,
  IconStudioAppIcons,
  IconStudioCreator,
  IconAdvancedFeatures,
  IconBrandHierarchy,
  IconStudioColorizer,
  IconStudioStepper,
  IconStudioExport,
  IconBrowser,
} from './studio';


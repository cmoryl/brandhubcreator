
# Updated Project Knowledge — Full Copy-Paste Version

Copy everything inside the code block below into your Project Knowledge area, replacing the current contents.

```
# BrandHub Project Rules

## Architecture
- Use React.forwardRef for layout-critical components and grid items, but NOT for dialogs or complex stateful components just to silence warnings.
- Grid sub-components must be defined outside the main function and memoized.
- Heavy libraries (Leaflet, html2pdf, three, pdf) and admin features must be lazy-loaded with Suspense via dynamic import().
- Chart components (Recharts) must use dynamic keys on containers to force re-renders when theme/SVG gradients change.
- RootLayout uses location.key to force React remount on route change.

## UI Stability & Radix Workarounds
- Global MutationObserver in src/main.tsx clears stuck `pointer-events: none` on <body> when no Radix overlay is open. Do not remove — required for Add Template Spec, dialogs, and popovers across all editors.
- Radix UI Select must use string sentinel values (e.g., 'none', 'auto') — never empty strings.
- Prefer native `overflow-y-auto` over Radix ScrollArea inside dialogs. Portal full-screen overlays to document.body.

## Database & Entities
- The 'brands' table has NO 'parent_brand_id' column — only 'products' and 'events' have it. Always use entity-specific queries.
- 'linkedGuides' JSONB must contain full metadata objects (id, type, name, slug), not just IDs.
- All data normalization goes through src/lib/guideNormalization.ts — never duplicate sanitization logic elsewhere.
- Supabase default query limit is 1000 rows — check for this before assuming missing data bugs.
- RLS policies must never use "Always True" on write operations — always check auth.uid() ownership or has_role().
- Public storage buckets (organization-assets, org-image-library) restrict bucket-listing to authenticated org members; direct asset URLs remain public for rendering.
- get_entity_text_context is the canonical RPC for assembling AI context (guide_data + samples + analyses). New AI edge functions must use it instead of raw guide_data queries.
- update_guide_section RPC is the only sanctioned way to patch a single guide_data section server-side.
- get_public_brand_data / get_public_product_data / get_public_event_data RPCs strip internalNotes and draftStatus — always use them for unauthenticated portal reads.

## Design System
- NEVER use raw color classes (text-white, bg-black) in components. Always use semantic Tailwind tokens from index.css (--background, --foreground, --primary, etc.).
- All colors must be HSL format.
- Typography hierarchy: Poppins (Headlines, 700), Montserrat (Sub-Headlines, 600), Verdana (body/web-safe).
- Poppins is the default global sans-serif (weights 300–800 via Google Fonts).

## Portal & Navigation
- Entities need is_public=true and valid hero metadata (name, tagline, coverImage/cardImage) to render in portal grids.
- Breadcrumbs link back to /org/:orgSlug using formatted slug as label, not the home page.
- Master suites and events are prioritized at top of grids with distinct rings/badges.
- Product card headers must match their hero page coverImage. All product imagery: no text or logos, abstract 16:9 photography.
- Product suite cards: minimum height md:min-h-[220px].
- UnifiedLogoSection hides empty logo slots. Award cards use white backgrounds for image containers.

## Configurable Sections
- Admins can set default layout grid styles (Grid 2/3/4, List, Large Cards, Compact) per section in the brand editor.
- Layout preference is persisted in the 'sectionLayouts' field of guide_data.
- Applies to: Gradients, Patterns, Products, Templates, Brochures, Case Studies.

## Edit Permissions & Security
- Edit-permission guards enforced across ALL guide sections (Products, Website, Iconography, QR Codes, Signatures, Digital Collateral, Social Assets, Anti-Patterns, Symbol Standards, Geometric Primitives, Platform Marketer, Events, Statistics).
- Interactive controls (Add, Link, Upload, Delete) only render for administrators.
- Non-admin users see a clean, read-only interface with indented content (max-w-7xl) and full-width hero backgrounds.
- 'isGuideAdmin' permission logic is centralized in the 'useGuideAdmin' hook for Brand, Product, and Event editors.
- During auth/org loading, useGuideAdmin returns optimistic admin=true for authenticated users to prevent eye-icon flicker. Final permission resolves once orgRole loads.
- Mutation callbacks must NO-OP when `isEditable` prop is false — never rely on UI hiding alone.
- canViewAnalytics (insights, intelligence, competitive, audit, brand health) is granted to owner/admin/member; canEdit only to owner/admin.
- Section visibility eye icon: positioned left of sidebar nav items next to drag handle, 12px, borderless, high-contrast styling with amber highlight for hidden sections. Applied consistently to desktop sidebar and MobileSectionNav.
- Have I Been Pwned (HIBP) leaked password protection enabled for signups and password changes.

## Edge Functions & Security
- All edge functions have verify_jwt=false in config.toml to allow internal auth logic (exception: process-email-queue uses verify_jwt=true).
- AI-driven edge functions require manual JWT verification via supabase.auth.getUser and role-based access control using can_use_ai_features RPC.
- GlobalLink edge functions (translate, cultural-adapt, connect-workflow) are hardened with JWT verification and organization membership checks.
- globallink-cultural-adapt uses zero-dependency static lookups instead of heavy SDKs to stay within 150MB memory limit.
- Use EdgeRuntime.waitUntil for heavy background processing to avoid timeout/memory limits.
- When adding new edge functions, add the config entry to supabase/config.toml.
- Long-running AI workflows use orchestrator + worker pattern (e.g., brand-audit → brand-audit-worker, competitive-analysis → competitive-analysis-worker, brand-intelligence → brand-intelligence-worker, discover-competitors → discover-competitors-worker) with brand_intelligence_jobs table for status tracking.
- Orchestrators clear stale "processing" jobs older than 3 minutes before creating new ones.
- Workers always update job status to 'failed' on invocation error, including completed_at timestamp.
- Rate limits enforced via REST count queries (e.g., competitive-analysis: 5 reports/hour/user).
- All DB functions must SET search_path = public (or `public, pgmq` for queue functions) to prevent search-path hijacking.
- Edge function inventory is large (~95 functions). Before creating a new one, search supabase/functions/ for an existing function covering the use case.
- Backup/restore flow: queue-backup → process-backup-queue → restore-brand-backup / restore-product-from-backup. Never bypass the queue.
- Email delivery uses pgmq via enqueue_email + process-email-queue. Never call email APIs directly from request-handler functions.

## Imagery Hub & Asset Persistence
- Approved imagery (Shutterstock, uploads, AI) writes to DB AND syncs in-memory state via BrandContext to prevent stale UI counts.
- Category counts and thumbnails must reflect approvals immediately without page refresh — verify both DB write and context update on every imagery mutation.
- Applies uniformly to Brands, Products, and Events.

## Inclusive Language & Imagery Strategy
- Single source of truth: supabase/functions/_shared/inclusive-language-patterns.ts (INCLUSIVE_PROMPTING_HEURISTICS, IMAGERY_STOP_GO, IDENTITY_DIVERSITY_GUIDELINES, WCAG_22_NEW_CRITERIA, EAA_COMPLIANCE_BASELINE).
- Consumed by bias-awareness-scan, brand-audit-worker, oracle-brain, imagery-strategy-audit. Never duplicate these patterns inline in any function.
- imagery-strategy-audit scores 6 dimensions (Diversity, Authenticity, Cultural Context, Action Orientation, Inclusive Prompting Compliance, Stock Dependency); persists in imagery_strategy_audits.

## Character Sprites & AI Image Generation
- All character sprites must have transparent backgrounds (workspace rule). Generated via generate-character-sprite edge function.
- Pillar images, client logos, gradients, shapes, and signage previews each have dedicated edge functions — never call image models directly from the client.
- Generated assets persist in brand_generated_assets with brand context (colors, archetype, industry).

## PDF Exports
- Competitive analysis PDFs use jsPDF native text/vector API (no html2canvas) — produces selectable, searchable text with programmatic radar/bar charts.
- All other exports (Schedules, Analytics) use rasterized html2canvas with JPEG 0.75 compression, 1.5x scaling, and a hidden render container (zIndex: -1, opacity: 0.01).
- Centralized style config lives in pdfStyleConfig.ts mapping design tokens to hex values.
- Rasterized exports enforce light-mode styles, use tables over CSS Grid, and implement smart page-break logic.

## PDF Document Viewing
- Uses native browser PDF viewer for compatibility.
- parse-pdf edge function (pdf-lib) extracts first-page thumbnails and metadata on upload.
- Files stored in organization-assets bucket, metadata in pdf_documents table.

## AI Integration (Lovable AI Gateway)
- ALL AI calls go through Edge Functions — never call models directly from the client.
- Use Lovable AI Gateway (https://ai.gateway.lovable.dev/v1/chat/completions) with LOVABLE_API_KEY (auto-provisioned, never ask users for it).
- Default model: google/gemini-2.5-flash-lite for most edge functions to stay within 150MB memory limits.
- Use gemini-2.5-pro only for complex analysis requiring deep reasoning.
- Always handle 429 (rate limit) and 402 (payment required) errors — surface them as user-facing toasts.
- Prompts live on the backend, never on the client side.
- Cross-entity AI uses generate-portfolio-relationships, portfolio-insights-extractor, generate-intelligence-digest — never roll new orchestrators for portfolio scope.
- Bulk operations iterate sequentially with per-item error capture; never parallel-batch in a way that exceeds 150MB worker memory.

## Brand Intelligence
- Uses async background job pattern to overcome 150MB Edge Function memory limits.
- Split into lightweight orchestrator ('brand-intelligence') and worker ('brand-intelligence-worker') using 'brand_intelligence_jobs' table.
- Worker uses cumulative merging strategy — new insights merge with existing data, never overwrite. Text fields merge, arrays deduplicate, sub-fields update independently.
- Learning architecture includes: insight_actions (feedback), confidence_history (calibration), semantic_hashes (Jaccard deduplication), decay_config (30-day half-life temporal weighting).
- Competitive context (favorite competitors + 3 most recent reports) feeds into brand intelligence via competitive_landscape JSONB column.
- Knowledge Base supports manual PDF/Text/Markdown imports via import-brand-report edge function.
- Cultural readiness scoring, regional market analysis, and GlobalLink recommendations integrated into BrandIntelligencePanel across Brand, Product, and Event editors.
- UI implements strict defensive data validation (Array.isArray checks, data coercion) to prevent crashes from legacy or unstructured AI responses.
- Product/event intelligence links to parent brands via parent_entity_id for context inheritance.

## Research Briefings
- 'brand-research' Edge Function uses async background jobs with EdgeRuntime.waitUntil and gemini-2.5-flash-lite.
- Frontend polls job status via useResearchBriefings hook.
- Multicultural Intelligence and Research panels are strictly scoped to active organization_id for tenant isolation.
- Cultural Analysis Generator orchestrates brand-intelligence and brand-research functions, feeding insights back as learned knowledge.

## Competitive Intelligence
- 8-section AI reports with radar charts (Personality Matrix), score gauges, and PDF export.
- Data persisted in competitive_analysis_reports and favorite_competitors tables.
- Accessible via CompetitiveReportCard and AdminToolbar only — explicitly excluded from Brand/Product/Event editor sidebars.

## Booth Mapper 3D
- 5-mode IDE workspace shell (BoothWorkspace): Design, Graphics, Simulate, Production, Present.
- 3-panel layout: collapsible left (Assets/Layers), center 3D canvas, collapsible right (Inspector). Toggleable via header buttons.
- Lazy-loaded from BoothsCatalog via dynamic import — never import statically.
- AI booth pipeline: booth-3d-ai-mapper, booth-analysis, booth-color-analysis, booth-score edge functions.
- Per-division+variant analyses persist in booth_ai_analyses table, keyed by (division_id, variant_label). Surfaced via useBoothAnalysis hook.

## Brand Creative Studio
- AI imagery generation using brand context (colors, archetype, industry).
- Prompt library for reusable templates (brand_prompt_library table).
- Generated assets stored in brand_generated_assets table.
- Design token export utility for CSS, JSON, and Tailwind (brand_design_tokens table).

## Icon Studio (IconKIT)
- 7-tab unified hub: Library, AI Generator, Stylizer, Advanced, Hierarchy, App Icons, Creator.
- AI generation uses style presets (Minimal Line, Bold Filled, Duotone, etc.) with batch support up to 100 icons.
- Icons follow 24x24 grid, 20px safe zone, single clean paths, <2KB file size, scored by IQS (1-100).
- Brand DNA Lock enforces global stroke/cap/corner rules across sub-brands. Style Overrides allow customization without breaking DNA.
- App Icons generate for iOS, Android, PWA, macOS, Windows, and favicons from a single source.
- Advanced features: Optical Sizing (responsive detail), Semantic States (default/hover/active/disabled/selected/error), Kinetic Branding (physics-based animations).

## DataForce AI
- Four core services: Brand Compliance AI, AI-Powered Brand Assistant (15+ languages), Cultural Validation Panel, GenAI Brand Training.
- Managed via dataforce_config table. Supports 'Live' mode (API keys) and 'Demo' mode (simulated responses).
- Centralized monitoring via 'DataForce AI' tab in Admin Dashboard + Summary Widget on Admin Overview.
- Compliance score badges (shield icons) permanently visible on Portal Brand Cards, Brand Editor Hero, and Admin Analytics table.
- Uses useLatestComplianceScores hook with color-coded thresholds (80+ Green, 60-79 Yellow, <60 Red). Shows 'N/A' placeholder when no scan data exists.
- Auto-compliance via useAutoCompliance hook triggers debounced (5s) scan on every brand guide save.
- Unified DataForceService abstraction for orchestrating all four services.

## GlobalLink Localization
- Translation system with localization_jobs table tracking source/target languages, word counts, and translation methods.
- Brand regional variants support per-field JSONB overrides (colors, typography, logos, messaging, imagery, voice) inheriting from parent variants.
- Regional hierarchy: Global → Region → Country with content inheritance and override capability.
- Localization cache (localization_cache table) deduplicates translations by source_hash for efficiency.
- GlobalLink Translation Hub integrated across BrandEditor, ProductEditor, and EventEditor.
- Credential hierarchy: org-specific config table → project-level Supabase secrets fallback. Supports per-tenant custom configs and global defaults.
- 'Regional Comparison View' for side-by-side analysis of variant differences.
- Admin Overview includes GlobalLink Summary Widget tracking translation jobs, target languages, and regional variants.

## Admin Dashboard
- 21 consolidated tabs: unified Intelligence Hub (AI Market Analysis, Multicultural Intel, Research Briefings, DataForce AI), centralized Backups (Organization, Universe, Product Suite), merged Users & Members.
- Users & Members uses expandable row pattern combining platform profiles with org memberships/roles, plus Pending Invites sub-tab.
- User approval workflow includes optional organization assignment for immediate workspace access.
- Portal Admin Actions panel: floating collapsible 'Quick Add' menu (right side) for creating Brands, Products, Events, Product Suites, and Regional Sub-Events. Defaults to collapsed.
- Insights & Updates section supports Cards, Infographic, and Timeline layouts with InsightEditorModal.
- Brand Health Score tracks 35+ sections across 8 categories with weighted depth-based scoring.
- Admin analytics use persistent caching (usePersistedAdminData) with 1-hour TTL across dashboard tabs.
- AppSettingsEditor supports light/dark logo and favicon selection via ImageLibraryPicker from org image library.

## Audit Logging
- Comprehensive audit_logs table capturing action outcomes, session details (browser, device, session_id), and full JSON diffs (old_value vs new_value).
- 30+ specialized helper functions for consistent tracking across user management, data modifications, org settings, and asset downloads.
- Dedicated ActivityLogsPanel in admin dashboard.

## Demo Ecosystem
- Demo content stored in demo_brands table, isolated from customer data.
- Admins have full editing capability for demo guide hero areas including media uploads.
- DemoGuideViewer prioritizes database-backed guides, falls back to static constants.
- Landing page tour features animated gradient highlighting frames, pulsing corner accents, cross-fade transitions, viewport-aware spotlight positioning, and swipe gestures for mobile.

## Backup System
- backup_jobs and backup_history tables for org/universe/suite backup scopes.
- Job status tracking with completion timestamps, file sizes, and error handling.

## Code Style
- Keep components small and focused. Refactor files over ~250 lines into smaller modules.
- Parallel data fetching preferred (see usePortalData pattern).
- Use src/lib/logger.ts instead of console.log/error in production code (logger is environment-gated and silenced in PROD builds).
- UUID fields must explicitly convert empty strings to null before DB writes.
- Use safeArr / safeObjArr helpers when reading JSONB columns to guard against null/legacy shapes.
- Prefer text-shadow over blur-lg for LCP-critical elements. Use WebP for raster assets. Dynamic import() for heavy libs (pdf, three, leaflet).
- Barrel exports (src/components/portal/index.ts, src/components/brand/creative-studio/index.ts, src/components/admin/globallink/index.ts, etc.) are the canonical import surface for those subsystems — add new components to the barrel rather than importing deep paths from outside the folder.
- Never edit auto-generated files: client.ts, types.ts, .env, config.toml (project-level settings only — function blocks may be added).

## Workspace Rule
- All character sprites must be created with transparent backgrounds.
```

## Summary of What Changed

Added since your current version:
- **UI Stability & Radix Workarounds** (new section)
- **Imagery Hub & Asset Persistence** (new section)
- **Inclusive Language & Imagery Strategy** (new section)
- **Character Sprites & AI Image Generation** (new section)
- **Booth Mapper 3D** (new section)
- **Database & Entities**: RLS rules, RPC canonical APIs, bucket-listing
- **Edit Permissions**: optimistic admin, NO-OP guards, role matrix, HIBP
- **Edge Functions**: orchestrator/worker, stale-job cleanup, rate limits, search_path, queue rules, inventory check
- **AI Integration**: portfolio orchestrators, sequential bulk pattern
- **Code Style**: logger, UUID null-conversion, safeArr/safeObjArr, barrel exports
- **Workspace Rule**: transparent-background sprites

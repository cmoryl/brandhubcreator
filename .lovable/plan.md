

# Tagline Variations Visual Upgrade

## Current State
The variations area is a vertical stacked list of styled cards (gradient, accent-bar, floating-card, glass, outlined). While functional, it reads like a flat list and lacks visual hierarchy, contextual richness, and editorial polish.

## Proposed Enhancements

### 1. Masonry/Staggered Grid Layout
Replace the single-column `space-y-3` stack with a responsive 2-column masonry-style grid on desktop. Variations alternate between columns with staggered entry animations, creating a more dynamic, magazine-like feel. Single column on mobile.

### 2. Context Labels & Use-Case Tags
Add an optional "context" field to each variation (e.g., "Social Media", "Print Campaign", "Internal"). Display as a small colored chip above the tagline text. Gives each variation purpose and makes the section feel like a strategic asset, not just a list.

### 3. Numbered Index Badges
Show a styled circular index badge (01, 02, 03...) on each card that's always visible (not just on hover). Uses a gradient primary circle, giving the section a curated editorial look.

### 4. Featured/Primary Variation Highlight
Allow one variation to be marked as "featured" — displayed larger at the top with a subtle glow border and a star badge. This creates visual hierarchy and signals the preferred alternative tagline.

### 5. Animated Stagger on Scroll
Add a fade-up stagger animation when the section enters view. Each card animates in with a 75ms delay, creating a cascading reveal effect.

### 6. Enhanced Empty State
Upgrade the empty state with a more editorial illustration — overlapping quote marks in brand colors, a subtle pulse animation, and more inviting copy.

## Technical Details

**Files to modify:**
- `src/types/brand.ts` — Add `context?: string` and `isFeatured?: boolean` to `TaglineVariation`
- `src/components/brand/TaglineSection.tsx` — Refactor variations display: 2-col grid, featured card, index badges, context chips, stagger animations, enhanced empty state. Add context input and featured toggle in edit mode.

**No new dependencies.** Uses existing Tailwind utilities and CSS animations. The `TaglineVariation` type changes are additive (optional fields), so no migration needed.




# Surface Compliance Scores Across the Application

## Overview

Currently, DataForce compliance scores are only visible inside the DataForce Dashboard widget and the dedicated Compliance Checker component. This plan adds compliance score badges and indicators to three high-visibility areas so users can see brand compliance health at a glance without navigating to the DataForce section.

## Where Scores Will Appear

### 1. Portal Brand Cards (Organization Dashboard)
Add a small compliance score badge to each brand card on the org portal (both `PortalBrandCard` and `StandaloneBrandCard`). The badge will show the most recent compliance score with a color-coded indicator (green/yellow/red).

### 2. Brand Hero Section (Brand Editor)
Add a compliance score stat alongside the existing Health Score in the hero stats panel. This gives editors immediate visibility into compliance status while working on a brand.

### 3. Admin Brand Analytics Hub
Add a compliance score column to the brand health table so admins can compare compliance scores alongside health scores in one view.

---

## Technical Details

### Data Fetching

**New hook: `useLatestComplianceScores`**
- Fetches the latest compliance score per entity from `dataforce_compliance_jobs` (grouped by `entity_id`, ordered by `created_at desc`, limit 1 per entity)
- Returns a `Map<entityId, { score: number, status: string, date: string }>` for efficient lookup
- Used by the portal page and admin analytics

### File Changes

**1. `src/hooks/dataforce/useLatestComplianceScores.ts`** (new)
- Custom hook accepting `organizationId`
- Queries `dataforce_compliance_jobs` for completed jobs, deduplicates to latest per entity
- Returns a lookup map and loading state

**2. `src/hooks/dataforce/index.ts`** (edit)
- Export the new hook

**3. `src/components/portal/PortalCards.tsx`** (edit)
- Accept optional `complianceScore?: number` prop on `PortalBrandCard`
- Render a small badge (e.g., shield icon + score%) in the card footer area, color-coded by threshold

**4. `src/components/portal/HierarchicalBrandGrid.tsx`** (edit)
- Accept optional `complianceScores` map prop
- Pass score to `StandaloneBrandCard` and `SubBrandCard`
- Add the same badge treatment

**5. `src/pages/OrganizationPortal.tsx`** (edit)
- Call `useLatestComplianceScores` with the org ID
- Pass the scores map down to the brand grid components

**6. `src/components/brand/HeroSection.tsx`** (edit)
- Add a compliance score stat pill next to the existing Health stat
- Fetch via `useLatestComplianceScores` (single entity) or accept as prop
- Show shield icon + percentage with color coding

**7. `src/components/admin/BrandAnalyticsHub.tsx`** (edit)
- Fetch compliance scores alongside brand health data
- Add "Compliance" column to the brand table
- Include compliance in the summary stats cards

### Score Display Component

**`src/components/dataforce/ComplianceScoreBadge.tsx`** (new)
- Reusable small badge: shield icon + score + color
- Props: `score: number`, `size: 'sm' | 'md'`, `showLabel: boolean`
- Color thresholds: 80+ green, 60-79 yellow, below 60 red
- Shows "N/A" if no score exists yet

### No Database Changes Required
All data already exists in `dataforce_compliance_jobs`. This is purely a frontend read/display feature.


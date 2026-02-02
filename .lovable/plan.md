
# Comprehensive Competitive Analysis Reporting System

## Overview
This plan implements an in-depth competitive analysis system that generates comprehensive background reports for all brand guides, including parent companies, sub-companies, products, sub-products, events, and sub-events. The system will use the detailed 8-section analysis framework you provided.

## Current Architecture

The project already has:
- **AI-powered analysis infrastructure**: `market-analysis`, `brand-audit`, `brand-intelligence` edge functions
- **Saved prompt system**: `saved_report_prompts` table and `useSavedPrompts` hook
- **Custom prompt runners**: `CustomPromptRunner.tsx` for brands, `EventCustomPromptRunner.tsx` for events
- **Brand intelligence storage**: `brand_intelligence` table with JSONB fields for storing analysis results

## Implementation Plan

### Phase 1: Database Schema Updates

**1.1 Create `competitive_analysis_reports` table**
Store generated reports separately for persistence and history tracking:

```sql
CREATE TABLE competitive_analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_id UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'competitive',
  
  -- The comprehensive analysis data (JSONB)
  report_data JSONB NOT NULL,
  
  -- User-specified competitors
  competitors JSONB DEFAULT '[]',
  
  -- Metadata
  score INTEGER,
  status TEXT DEFAULT 'completed',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_competitive_reports_entity ON competitive_analysis_reports(entity_type, entity_id);
CREATE INDEX idx_competitive_reports_org ON competitive_analysis_reports(organization_id);

-- RLS Policies
ALTER TABLE competitive_analysis_reports ENABLE ROW LEVEL SECURITY;
```

**1.2 Add default competitive analysis prompt to `saved_report_prompts`**
Pre-populate the system with your comprehensive prompt as a default template.

### Phase 2: New Edge Function

**2.1 Create `competitive-analysis` edge function**

Location: `supabase/functions/competitive-analysis/index.ts`

This function will:
- Accept entity type (brand/product/event), entity ID, and competitor list
- Fetch complete guide_data for the entity
- Extract all visual identity data (logo, colors, typography, patterns, imagery)
- Extract brand positioning data (identity, values, services, tagline)
- Call Lovable AI Gateway with the comprehensive prompt
- Return structured JSON with all 8 analysis sections
- Store results in `competitive_analysis_reports` table

Key implementation details:
- Use `google/gemini-2.5-pro` for complex reasoning (large context window needed)
- Implement rate limiting (5 reports/hour per user)
- Handle parent/child relationships for sub-products and sub-events
- Extract relevant data efficiently to stay within token limits

**2.2 Report Data Structure**

```typescript
interface CompetitiveAnalysisReport {
  // Section 1: Visual Identity Audit
  visualIdentityAudit: {
    logoAnalysis: {
      style: string;
      typography: string;
      symbolism: string;
      scalability: string;
      memorability: string;
    };
    colorPalette: {
      primary: string[];
      secondary: string[];
      psychology: string;
      accessibility: string;
      consistency: string;
    };
    typographySystem: {
      fonts: string[];
      hierarchy: string;
      personality: string;
    };
    visualStyle: {
      photographyStyle: string;
      illustrationApproach: string;
      iconography: string;
      aesthetic: string;
    };
    designPatterns: {
      uiElements: string;
      whitespace: string;
      interactions: string;
    };
  };

  // Section 2: Digital Presence Analysis
  digitalPresence: {
    homepageImpression: {
      heroImpact: string;
      hierarchy: string;
      ctaDesign: string;
      effectiveness: string;
    };
    uxAnalysis: {
      navigation: string;
      contentOrganization: string;
      mobileResponsive: string;
      overallPolish: string;
    };
    contentPresentation: {
      videoUsage: string;
      dataVisualization: string;
      caseStudyDesign: string;
    };
  };

  // Section 3: Marketing Collateral
  marketingCollateral: {
    materialQuality: string[];
    productMarketing: string[];
    socialConsistency: string;
  };

  // Section 4: Brand Positioning Matrix
  brandPositioning: {
    personalityMatrix: {
      innovationScore: number; // 1-10
      approachabilityScore: number;
      technicalScore: number;
      boldnessScore: number;
      enterpriseScore: number;
      globalScore: number;
    };
    targetAudienceSignals: string[];
    trustIndicators: string[];
    differentiation: string[];
  };

  // Section 5: Strengths & Weaknesses Matrix
  strengthsWeaknesses: {
    designSophistication: number;
    visualConsistency: number;
    userCentricity: number;
    innovation: number;
    clarity: number;
    emotionalConnection: number;
    professionalPolish: number;
  };

  // Section 6: Recommendations
  recommendations: {
    positioningOpportunities: string[];
    designPriorities: Array<{ title: string; impact: string; effort: string }>;
    brandRefinements: {
      logo: string;
      colors: string;
      typography: string;
      imagery: string;
    };
    digitalImprovements: string[];
    assetOptimization: string[];
  };

  // Section 7: Market Perception Summary
  marketPerception: {
    categoryMaturity: string;
    dominantTrends: string[];
    currentRanking: number;
    keyStrengths: string[];
    criticalGaps: string[];
    risks: string[];
  };

  // Section 8: Executive Summary & Action Plan
  executiveSummary: {
    overview: string;
    currentPosition: string;
    topPriorities: string[];
    actionPlan: {
      thirtyDay: string[];
      sixtyDay: string[];
      ninetyDay: string[];
    };
    successMetrics: string[];
  };

  // Metadata
  score: number;
  generatedAt: string;
  competitors: string[];
}
```

### Phase 3: Frontend Components

**3.1 Create `CompetitiveAnalysisGenerator.tsx`**

Location: `src/components/admin/CompetitiveAnalysisGenerator.tsx`

Features:
- Entity selector (brands, products, events dropdown)
- Competitor input (add/remove up to 10 competitors)
- Analysis type selector
- Generate button with loading state
- Results display with tabbed sections for each of the 8 analysis areas
- Export options (PDF, copy to clipboard)
- History/saved reports viewer

**3.2 Create `CompetitiveReportCard.tsx`**

Location: `src/components/brand/CompetitiveReportCard.tsx`

A card component that can be embedded in brand/product/event editors showing:
- Latest analysis score
- Quick summary
- Button to view full report or generate new one

**3.3 Update Entity Editors**

Add a "Competitive Analysis" section/button to:
- `src/pages/BrandEditor.tsx`
- `src/pages/ProductEditor.tsx`
- `src/pages/EventEditor.tsx`

**3.4 Create `CompetitiveAnalysisDialog.tsx`**

A dialog component for:
- Viewing full analysis results
- Competitor configuration
- Running new analysis
- Viewing historical reports

### Phase 4: Report Visualization Components

**4.1 Create visualization components**

Location: `src/components/admin/competitive-analysis/`

- `PersonalityMatrixChart.tsx` - Radar chart for brand personality scores
- `StrengthsWeaknessesMatrix.tsx` - Comparative bar charts
- `ActionPlanTimeline.tsx` - 30/60/90 day visual timeline
- `DesignPriorityTable.tsx` - Sortable priority table
- `ScoreGauge.tsx` - Overall score visualization

### Phase 5: Integration Points

**5.1 Add to Admin Dashboard**
- Add "Competitive Analysis" card in admin reporting section
- Link from AIMarketAnalysis component

**5.2 Quick Access from Entity Pages**
- Add "Run Competitive Analysis" button in the toolbar of brand/product/event pages
- Show last analysis score badge

**5.3 Saved Prompts Integration**
- Pre-populate competitive analysis prompt as a default template
- Allow customization and saving of modified prompts

---

## Technical Implementation Details

### Edge Function Flow

```
1. User selects entity + enters competitors
2. Frontend calls competitive-analysis function
3. Function fetches entity guide_data from DB
4. Extracts: hero, identity, values, colors, typography, 
   services, logos, patterns, social, websites
5. Builds context string (optimized for token efficiency)
6. Calls Lovable AI with comprehensive prompt
7. Parses structured JSON response
8. Stores report in competitive_analysis_reports
9. Returns report to frontend
```

### Token Optimization Strategy

Given the comprehensive prompt size:
- Use `google/gemini-2.5-pro` (large context)
- Limit competitor analysis to top 5 if more provided
- Extract only relevant fields from guide_data
- Use tool calling for structured output
- Max tokens: 8000 for response

### Rate Limiting

- 5 comprehensive analyses per hour per user
- 20 quick analyses per hour
- Logged in `audit_logs` table

---

## File Changes Summary

### New Files
1. `supabase/functions/competitive-analysis/index.ts` - Main edge function
2. `src/components/admin/CompetitiveAnalysisGenerator.tsx` - Main UI component
3. `src/components/admin/competitive-analysis/PersonalityMatrixChart.tsx`
4. `src/components/admin/competitive-analysis/StrengthsWeaknessesMatrix.tsx`
5. `src/components/admin/competitive-analysis/ActionPlanTimeline.tsx`
6. `src/components/admin/competitive-analysis/DesignPriorityTable.tsx`
7. `src/components/admin/competitive-analysis/ScoreGauge.tsx`
8. `src/components/brand/CompetitiveReportCard.tsx` - Embeddable card
9. `src/components/brand/CompetitiveAnalysisDialog.tsx` - Full report dialog
10. `src/hooks/useCompetitiveAnalysis.ts` - Hook for fetching/managing reports
11. `src/types/competitiveAnalysis.ts` - TypeScript interfaces

### Modified Files
1. `supabase/config.toml` - Add new function config
2. `src/pages/BrandEditor.tsx` - Add competitive analysis button
3. `src/pages/ProductEditor.tsx` - Add competitive analysis button
4. `src/pages/EventEditor.tsx` - Add competitive analysis button
5. `src/components/admin/AdminSidebar.tsx` - Add competitive analysis link (if applicable)

### Database Changes
1. New table: `competitive_analysis_reports`
2. New RLS policies for the table
3. Default prompt inserted into `saved_report_prompts`

---

## Estimated Effort

- **Phase 1 (Database)**: Database migration setup
- **Phase 2 (Edge Function)**: Core AI integration
- **Phase 3 (Frontend Components)**: UI components
- **Phase 4 (Visualizations)**: Charts and graphs
- **Phase 5 (Integration)**: Connecting everything

This system will provide comprehensive, AI-powered competitive intelligence for every entity in your brand management ecosystem.

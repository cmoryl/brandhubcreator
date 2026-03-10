

# Integrating GlobalLink & DataForce into the Social Asset Studio

## Current State

The Social Asset Studio currently has its own standalone AI analysis engine (`analyze-social-asset` edge function) that handles bias, compliance, engagement, and text analysis independently. **Neither GlobalLink nor DataForce are connected to the Social Studio today.**

Meanwhile, both systems are fully built and available:
- **GlobalLink**: Cultural adaptation (`globallink-cultural-adapt`), translation, regional content guidance
- **DataForce**: Brand compliance scanning, cultural validation panels, AI brand assistant, GenAI content generation

## What We Can Build

### 1. GlobalLink — Regional Asset Adaptation
Add a **"Localize"** action per placement card that:
- Calls `globallink-cultural-adapt` with the asset's platform, format, and target region
- Returns region-specific guidance: color appropriateness, imagery taboos, text translation suggestions, cultural sensitivities
- Shows a **"Cultural Insights"** panel alongside the existing AI Insights, with per-region recommendations
- Allows selecting target markets (e.g., APAC, EMEA, LATAM) and getting localized caption/copy suggestions

### 2. DataForce — Compliance & Validation Integration
Wire the existing DataForce services into the studio:
- **Brand Compliance**: Add a "Run DataForce Compliance" action that sends the uploaded asset + brand guide context through the `dataforce-compliance` edge function, surfacing compliance scores alongside the existing AI insights
- **Cultural Validation Panel**: Add a "Submit for Validation" action that sends an asset to `dataforce-validation` for human cultural review across target regions, with status tracking (pending → completed)
- **GenAI Content Generation**: Add a "Generate Caption" button per placement that uses `dataforce-training` to produce on-brand captions, hashtags, or copy for the specific platform and format

### 3. UI Integration Points

```text
PlacementCard
├── Upload / Preview / Approve (existing)
├── AI Insights (existing: Bias, Brand, Quality, Text)
├── NEW: GlobalLink Panel
│   ├── Region selector (target markets)
│   ├── Cultural adaptation insights per region
│   └── Translated caption suggestions
└── NEW: DataForce Actions
    ├── Run Compliance Check (uses DataForceService)
    ├── Submit for Cultural Validation (panel review)
    └── Generate Caption (GenAI)
```

### 4. Technical Approach
- Create `SocialGlobalLinkPanel.tsx` — collapsible panel with region selector, calling `globallink-cultural-adapt` with the asset context
- Create `SocialDataForceActions.tsx` — action buttons + result display for compliance, validation, and caption generation
- Wire both into `PlacementCard.tsx` below the existing `SocialAssetInsights`
- Reuse existing hooks: `useCulturalValidation`, `useComplianceCheck`, and `DataForceService.generateContent()`
- Pass `organizationId`, `entityId`, `entityType`, and `brandContext` (already available in PlacementCard props)

### 5. Files to Create/Modify
- **Create**: `src/components/social-studio/SocialGlobalLinkPanel.tsx`
- **Create**: `src/components/social-studio/SocialDataForceActions.tsx`
- **Modify**: `src/components/social-studio/PlacementCard.tsx` — add both new panels
- **Modify**: `supabase/functions/globallink-cultural-adapt/index.ts` — add social-asset-specific context handling if needed


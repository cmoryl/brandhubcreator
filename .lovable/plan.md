

# Visual Preferences Panel Redesign

## Problem
The Learned Visual Preferences panel is cramped, hard to read (tiny 9-10px text), and doesn't surface all the available data (preferred_colors, preferred_styles, preferred_compositions are in the VisualDNA type but never displayed).

## Plan

### 1. Redesign LearnedPreferencesPanel with tabbed sections and larger typography

Break the single dense block into a **tabbed card layout** with 4 mini-tabs:
- **Overview** — Summary text (bumped to 12px), confidence gauge (radial ring instead of thin bar), stats row with larger icons
- **Preferences** — Preferred Themes, Mood & Style keywords, Top Categories with wider progress bars, plus NEW: Preferred Colors (rendered as color swatches) and Preferred Styles (with weight bars)
- **Avoid** — Avoid keywords, rejection reasons, and preferred_compositions "dislikes" — given more visual weight with red-tinted cards
- **Insights** — Style preference narrative, diversity inclination, composition preferences — presented as readable paragraphs

### 2. Increase readability across the board
- Bump all body text from `text-[10px]` to `text-xs` (12px)
- Bump labels from `text-[10px]` to `text-xs font-medium`
- Bump badges from `text-[9px]` to `text-[11px]`
- Replace the thin 4px Progress bar with a proper radial confidence ring
- Add more vertical spacing (`space-y-3` instead of `space-y-2.5`)

### 3. Surface unused VisualDNA data
- **preferred_colors**: Render as a row of colored circles with weight-based sizing
- **preferred_styles**: Show as horizontal bars (like categories) — e.g., "Documentary: 85%", "Abstract: 60%"
- **preferred_compositions**: Show as labeled preference chips — e.g., "Rule of thirds → Preferred"

### 4. Add "Apply to Search" action button
- When preferences exist, show a button that auto-populates the search query with top themes/mood keywords — bridging intelligence into action

### 5. Make the panel scrollable with max-height
- In the Shutterstock dialog context, cap the panel at `max-h-[400px] overflow-y-auto` so it doesn't push search results off-screen
- In the VisualIntelligenceCard (entity editor), allow full expansion

### Files to modify
- `src/components/brand/approved-imagery/LearnedPreferencesPanel.tsx` — Full redesign with tabbed sub-sections
- `src/components/brand/approved-imagery/ShutterstockSearchDialog.tsx` — Add max-height wrapper and "Apply to Search" callback
- `src/components/brand/approved-imagery/VisualIntelligenceCard.tsx` — Minor spacing adjustments

### No database or edge function changes needed
All required data fields already exist in the VisualDNA type — they're just not being displayed.


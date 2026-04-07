

## Hero Treatment for Active/Selected Card

### What Changes

When a card is selected, it transforms into a mini "hero" tile with the full gradient background, glassmorphic shine overlay, ambient glow shadow, and a white icon with drop-shadow — matching the existing ActiveSectionHeader's hero aesthetic. All other cards remain minimal (subtle tint wash, muted icon, clean border).

The active state already has a gradient and glow (lines 241-256), but it's understated. This upgrade intensifies it to match the hero section feel.

### Enhancements to Active Card

1. **Stronger gradient fill** — deeper saturation, more prominent two-tone gradient
2. **Glassmorphic radial shine overlay** — matching the `ActiveSectionHeader`'s dual radial-gradient overlay with animated sheen
3. **Amplified ambient glow** — larger, more visible box-shadow halo using the tint color
4. **Icon glow ring** — icon gets a frosted circular backdrop (`bg-white/15 backdrop-blur`) like the hero header's icon container
5. **Subtle scale bump** — active card scales to `scale-[1.04]` to physically stand out from neighbors

### Non-Active Cards Stay Minimal

No changes to inactive cards — they keep the current subtle tint wash, clean border, and hover shadow behavior.

### Technical Details

**File**: `src/components/brand/SectionCardGrid.tsx` — `CardGrid` component (lines 224-287)

Changes scoped to the active card's styling:
- Increase `boxShadow` spread and add a second layer for deeper glow
- Add `transform: scale(1.04)` to the active card's inline style
- Enhance the overlay div (line 250-256) with the dual radial-gradient pattern from `ActiveSectionHeader`
- Wrap the `<Icon>` in a small frosted container (`rounded-lg bg-white/15 backdrop-blur-sm p-1.5`) when active
- Add a subtle animated shimmer keyframe on the overlay for the active card


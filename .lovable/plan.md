## NEXT 2026 Reference — UX Enhancements

Scope: single file, `public/canva-master-reference/next-2026.html`. No app-level changes, no new routes, no backend.

---

### 1. Search, filters & scroll progress

**Toolbar** (new row directly under the sticky `.divbar`, also sticky, slightly shorter):
- Live search input (`/` focuses it) that filters every `.division-block table` row by Format name, Size, and Example text. Non-matching rows hide; divisions with zero matches collapse to a "0 results" state.
- Filter chips:
  - Variant: All · Light/White · Dark/Navy (reuses the `variantKey()` logic already in the file)
  - Type: All · Social · Email · Print · Web · Video (inferred from the Format text via keyword map)
- "Clear" button resets search + chips.
- Result counter: "Showing 42 of 187 formats".

**Scroll progress + active division:**
- 3px progress bar pinned to the very top, filling left→right based on `scrollY / (scrollHeight - innerHeight)`.
- `IntersectionObserver` watches each `.division-block`; the matching `.divbar` button gets an `[aria-current="true"]` style (filled background, stronger border) as it enters the viewport. Clicking still uses the existing smooth-scroll + `scroll-margin-top` behavior.

---

### 2. Collapsible divisions + density & dark mode

**Collapsible divisions:**
- Each `.division-block` gets a header button (the existing h2 becomes the trigger) with a chevron and row count badge.
- Clicking toggles a `.is-collapsed` class that hides the block's table/notes.
- Global controls in the toolbar: "Expand all" / "Collapse all".
- Collapsed state per division persisted in `localStorage` under `next2026:collapsed`.
- Search auto-expands any division that has matching rows so results are never hidden.

**Density toggle:**
- Two states: Comfortable (current) and Compact (tighter row padding, smaller font on desktop tables, tighter mobile card gaps).
- Applied via `data-density="compact"` on `<html>`; persisted in `localStorage`.

**Dark mode:**
- Toggle in the toolbar (sun/moon). Applies `data-theme="dark"` on `<html>`; persisted in `localStorage`; defaults to `prefers-color-scheme`.
- New dark palette added alongside the existing `:root` tokens — reuses existing CSS custom properties (`--bg`, `--surface`, `--border`, `--text`, `--muted`, `--accent`) so every existing rule picks it up without edits. Division accent colors keep their hues but shift lightness for AA contrast on dark surfaces.

---

### Technical notes

- All logic is vanilla JS appended to the existing inline `<script>` block; no new dependencies, no build step.
- Search/filter runs on an in-memory index built once on `DOMContentLoaded` from the existing row DOM; each row gets a `data-search`, `data-variant`, `data-type` attribute so filtering is a single class toggle per row.
- Sticky stacking order: progress bar (top: 0) → `.divbar` → toolbar. `scroll-margin-top` values updated to account for the added toolbar height (desktop ~150px, mobile ~120px). `matchMedia` handler updated to match.
- All new controls are real `<button>` / `<input>` elements with `aria-label`, `aria-pressed`, and `aria-expanded` where appropriate; focus rings use the existing `--accent` token.
- Mobile: toolbar wraps to two rows (search full-width on top, chips + toggles below). Density toggle hidden on mobile (mobile already uses the stacked card layout).

---

### Layout sketch

```text
┌───────────────────────────────────────────────┐  progress bar (3px)
├───────────────────────────────────────────────┤
│  Divisions nav (existing .divbar)             │  sticky
├───────────────────────────────────────────────┤
│  🔍 search   [Light][Dark] [Social][Email]…   │  sticky toolbar
│  Expand▾ Collapse▴  Density◐  Theme☾  42/187  │
├───────────────────────────────────────────────┤
│  ▼ TransPerfect                        (24)   │  collapsible
│      … rows …                                  │
│  ▶ GlobalLink                          (18)   │  collapsed
│  ▼ DataForce                           (12)   │
└───────────────────────────────────────────────┘
```

---

### Out of scope (deferred)

- Copy-to-clipboard row actions and keyboard-shortcut jump menu.
- Canva PNG thumbnails (already tracked in `.lovable/plan.md`).
- Print/PDF stylesheet.

### Verification

Playwright on desktop (1280) and mobile (390):
1. Type in search → only matching rows visible, counter updates, empty divisions show "0 results".
2. Click Light chip → only light variants remain.
3. Collapse a division → table hidden, chevron rotates, state survives reload.
4. Toggle dark mode → all surfaces/text meet AA contrast; screenshot each state.
5. Scroll through page → progress bar fills, active division button highlights in the nav.

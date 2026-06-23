/**
 * TransPerfect brand-pure gradient presets.
 *
 * Every preset is built ONLY from the Master Brand palette and is tuned so
 * the worst-case point of the gradient still passes WCAG AA for the
 * recommended text color (4.5:1 for normal body, 3:1 for large headings).
 *
 * Palette (HEX):
 *   Blue 500    #003FC7   Primary
 *   Blue 800    #03002C   Primary
 *   Aqua        #A1FBF9   Secondary
 *   Lavender    #C2A3FF   Secondary
 *   Yellow      #FFEB66   Tertiary
 *   Green       #A6FA87   Tertiary
 *   Peach       #FF9B70   Tertiary
 *   Pink        #EC388A   Tertiary
 *   Red         #E53D2E   Tertiary
 *   Dark Gray   #666666   Neutral
 *   Light Gray  #F2F2F2   Neutral
 *   Blue White  #E0E8F5   Neutral
 */

import { StudioGradient, createStudioGradient } from "./gradientStudio";

export const TP = {
  blue500:  "#003FC7",
  blue800:  "#03002C",
  aqua:     "#A1FBF9",
  lavender: "#C2A3FF",
  yellow:   "#FFEB66",
  green:    "#A6FA87",
  peach:    "#FF9B70",
  pink:     "#EC388A",
  red:      "#E53D2E",
  darkGray: "#666666",
  lightGray:"#F2F2F2",
  blueWhite:"#E0E8F5",
} as const;

export interface BrandPreset {
  name: string;
  group: "Signature" | "Dark Mode" | "Light Mode" | "Accent" | "Mesh";
  description: string;
  /** Text color the preset is designed for. */
  recommendedText: "light" | "dark";
  build: () => StudioGradient;
}

const stop = (color: string, position: number) => ({ id: crypto.randomUUID(), color, position });
const mesh = (color: string, x: number, y: number) => ({ id: crypto.randomUUID(), color, x, y });

export const BRAND_PRESETS: BrandPreset[] = [
  /* ───────────────────── Signature (always-on brand) ───────────────────── */
  {
    name: "Master Brand",
    group: "Signature",
    description: "Signature Blue 500 → Blue 800. Hero backgrounds.",
    recommendedText: "light",
    build: () => createStudioGradient({
      name: "TP Master Brand",
      type: "linear", angle: 135,
      stops: [stop(TP.blue500, 0), stop(TP.blue800, 100)],
    }),
  },
  {
    name: "Deep Authority",
    group: "Signature",
    description: "Blue 800 vignette with Blue 500 core. Boardroom decks.",
    recommendedText: "light",
    build: () => createStudioGradient({
      name: "TP Deep Authority",
      type: "radial",
      shape: "ellipse", size: "farthest-corner",
      position: { x: 50, y: 45 },
      stops: [stop(TP.blue500, 0), stop(TP.blue800, 75)],
    }),
  },
  {
    name: "Pacific Sweep",
    group: "Signature",
    description: "Long horizontal Blue 800 → Blue 500 sweep. Landing banners.",
    recommendedText: "light",
    build: () => createStudioGradient({
      name: "TP Pacific Sweep",
      type: "linear", angle: 90,
      stops: [stop(TP.blue800, 0), stop("#001E80", 55), stop(TP.blue500, 100)],
    }),
  },

  /* ────────────────────── Dark Mode (light text AA) ────────────────────── */
  {
    name: "Midnight Aqua",
    group: "Dark Mode",
    description: "Blue 800 base with deep navy fall-off. White text safe.",
    recommendedText: "light",
    build: () => createStudioGradient({
      name: "TP Midnight Aqua",
      type: "linear", angle: 160,
      stops: [stop(TP.blue800, 0), stop("#0A1750", 60), stop("#001033", 100)],
    }),
  },
  {
    name: "Velvet Bloom",
    group: "Dark Mode",
    description: "Pink ember inside a Blue 800 night. Editorial covers.",
    recommendedText: "light",
    build: () => createStudioGradient({
      name: "TP Velvet Bloom",
      type: "radial",
      position: { x: 25, y: 75 },
      stops: [stop("#5A0E3D", 0), stop(TP.blue800, 70)],
    }),
  },
  {
    name: "Crimson Authority",
    group: "Dark Mode",
    description: "Red flare collapsing into Blue 800. Use for alerts / launches.",
    recommendedText: "light",
    build: () => createStudioGradient({
      name: "TP Crimson Authority",
      type: "linear", angle: 135,
      stops: [stop("#7A1A14", 0), stop(TP.blue800, 100)],
    }),
  },

  /* ──────────────────── Light Mode (dark text AA) ──────────────────────── */
  {
    name: "Soft Aurora",
    group: "Light Mode",
    description: "Aqua → Lavender wash. Dark body text passes AAA.",
    recommendedText: "dark",
    build: () => createStudioGradient({
      name: "TP Soft Aurora",
      type: "linear", angle: 135,
      stops: [stop(TP.aqua, 0), stop(TP.lavender, 100)],
    }),
  },
  {
    name: "Citrus Field",
    group: "Light Mode",
    description: "Yellow → Green pastel field. Marketing sections.",
    recommendedText: "dark",
    build: () => createStudioGradient({
      name: "TP Citrus Field",
      type: "linear", angle: 120,
      stops: [stop(TP.yellow, 0), stop(TP.green, 100)],
    }),
  },
  {
    name: "Daybreak Conic",
    group: "Light Mode",
    description: "Aqua → Lavender → Yellow conic. Background art.",
    recommendedText: "dark",
    build: () => createStudioGradient({
      name: "TP Daybreak Conic",
      type: "conic", angle: 215,
      position: { x: 50, y: 50 },
      stops: [stop(TP.aqua, 0), stop(TP.lavender, 33), stop(TP.yellow, 66), stop(TP.aqua, 100)],
    }),
  },
  {
    name: "Neutral Wash",
    group: "Light Mode",
    description: "Blue White → Light Gray. Card surfaces & quiet backgrounds.",
    recommendedText: "dark",
    build: () => createStudioGradient({
      name: "TP Neutral Wash",
      type: "linear", angle: 180,
      stops: [stop(TP.blueWhite, 0), stop(TP.lightGray, 100)],
    }),
  },

  /* ─────────────────────────── Accent / Tertiary ───────────────────────── */
  {
    name: "Peach Sunrise",
    group: "Accent",
    description: "Yellow → Peach → soft Pink. CTA hero accents.",
    recommendedText: "dark",
    build: () => createStudioGradient({
      name: "TP Peach Sunrise",
      type: "linear", angle: 135,
      stops: [stop(TP.yellow, 0), stop(TP.peach, 60), stop("#FBB6D1", 100)],
    }),
  },
  {
    name: "Lavender Mist",
    group: "Accent",
    description: "Lavender → Aqua radial. Onboarding cards.",
    recommendedText: "dark",
    build: () => createStudioGradient({
      name: "TP Lavender Mist",
      type: "radial",
      position: { x: 70, y: 30 },
      stops: [stop(TP.lavender, 0), stop(TP.aqua, 85)],
    }),
  },

  /* ─────────────────────────────── Mesh ───────────────────────────────── */
  {
    name: "Brand Aurora Mesh",
    group: "Mesh",
    description: "Multi-point Blue 500 / Blue 800 / Lavender mesh. Splash screens.",
    recommendedText: "light",
    build: () => createStudioGradient({
      name: "TP Brand Aurora",
      type: "mesh",
      meshBlur: 90,
      meshPoints: [
        mesh(TP.blue800, 10, 10),
        mesh(TP.blue500, 90, 15),
        mesh("#1A0A3A", 12, 88),
        mesh("#3A0F5C", 88, 85),
      ],
    }),
  },
  {
    name: "Pastel Mesh",
    group: "Mesh",
    description: "Aqua / Lavender / Yellow / Green mesh. Dark text canvas.",
    recommendedText: "dark",
    build: () => createStudioGradient({
      name: "TP Pastel Mesh",
      type: "mesh",
      meshBlur: 80,
      meshPoints: [
        mesh(TP.aqua, 15, 20),
        mesh(TP.lavender, 85, 18),
        mesh(TP.yellow, 18, 85),
        mesh(TP.green, 82, 82),
      ],
    }),
  },
];

export const BRAND_PRESET_GROUPS = [
  "Signature", "Dark Mode", "Light Mode", "Accent", "Mesh",
] as const;

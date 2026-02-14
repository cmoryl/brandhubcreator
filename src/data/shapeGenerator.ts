/**
 * Programmatic Shape Generator
 * Generates 100+ shapes per category using parametric SVG construction.
 * Categories: Geometric, Organic, Abstract, Arrows, UI, Layered, Minimal, Badges, Decorative, Icons
 */

import type { LibraryShape } from './shapeLibrary';

// Color palettes for variety
const PALETTES = [
  ['#6366F1', '#818CF8'], // Indigo
  ['#3B82F6', '#60A5FA'], // Blue
  ['#06B6D4', '#22D3EE'], // Cyan
  ['#10B981', '#34D399'], // Emerald
  ['#F59E0B', '#FBBF24'], // Amber
  ['#EF4444', '#F87171'], // Red
  ['#EC4899', '#F472B6'], // Pink
  ['#8B5CF6', '#A78BFA'], // Violet
  ['#F97316', '#FB923C'], // Orange
  ['#14B8A6', '#2DD4BF'], // Teal
  ['#84CC16', '#A3E635'], // Lime
  ['#E11D48', '#FB7185'], // Rose
];

const pick = (arr: string[][]) => arr[Math.floor(Math.random() * arr.length)];

let _counter = 0;
const uid = () => `sg${++_counter}`;

// ─── GEOMETRIC SHAPES ──────────────────────────────────────
function generateGeometric(): LibraryShape[] {
  const shapes: LibraryShape[] = [];
  const industry = 'general';
  const category = 'geometric';

  // Regular polygons (3-12 sides) × 3 styles = 30
  for (let sides = 3; sides <= 12; sides++) {
    const points = Array.from({ length: sides }, (_, i) => {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      return `${50 + 40 * Math.cos(angle)},${50 + 40 * Math.sin(angle)}`;
    }).join(' ');
    const names = ['Triangle', 'Square', 'Pentagon', 'Hexagon', 'Heptagon', 'Octagon', 'Nonagon', 'Decagon', '11-gon', '12-gon'];
    const name = names[sides - 3] || `${sides}-gon`;

    // Solid fill
    const c1 = PALETTES[(sides - 3) % PALETTES.length];
    const gid1 = uid();
    shapes.push({
      id: `geo-${sides}-solid`,
      name: `${name}`,
      category, industry,
      tags: [name.toLowerCase(), 'polygon', 'solid', `${sides}-sided`],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="${gid1}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1[0]}"/><stop offset="100%" stop-color="${c1[1]}"/></linearGradient></defs><polygon points="${points}" fill="url(#${gid1})"/></svg>`,
    });

    // Outline
    shapes.push({
      id: `geo-${sides}-outline`,
      name: `${name} Outline`,
      category, industry,
      tags: [name.toLowerCase(), 'outline', 'stroke'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="${points}" fill="none" stroke="${c1[0]}" stroke-width="3"/></svg>`,
    });

    // Double stroke
    const innerPoints = Array.from({ length: sides }, (_, i) => {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      return `${50 + 30 * Math.cos(angle)},${50 + 30 * Math.sin(angle)}`;
    }).join(' ');
    shapes.push({
      id: `geo-${sides}-double`,
      name: `${name} Double`,
      category, industry,
      tags: [name.toLowerCase(), 'double', 'nested'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="${points}" fill="none" stroke="${c1[0]}" stroke-width="2" opacity="0.4"/><polygon points="${innerPoints}" fill="${c1[0]}" opacity="0.7"/></svg>`,
    });
  }

  // Rounded rectangles with different radii (10 variations)
  for (let i = 0; i < 10; i++) {
    const rx = 4 + i * 4;
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    const w = 80 + (i % 3) * 20;
    const h = 50 + (i % 4) * 10;
    shapes.push({
      id: `geo-rrect-${i}`,
      name: `Rounded Rect ${rx}px`,
      category, industry,
      tags: ['rectangle', 'rounded', 'card', `radius-${rx}`],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + 20} ${h + 20}" width="${w + 20}" height="${h + 20}"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><rect x="10" y="10" width="${w}" height="${h}" rx="${rx}" fill="url(#${gid})"/></svg>`,
    });
  }

  // Stars with different point counts (5-12) × 2 = 16
  for (let pts = 5; pts <= 12; pts++) {
    const c = PALETTES[(pts - 5) % PALETTES.length];
    const outerR = 42, innerR = 20;
    const starPoints = Array.from({ length: pts * 2 }, (_, i) => {
      const angle = (i * Math.PI) / pts - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
    }).join(' ');
    shapes.push({
      id: `geo-star-${pts}`,
      name: `${pts}-Point Star`,
      category, industry,
      tags: ['star', `${pts}-point`, 'rating'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="${starPoints}" fill="${c[0]}"/></svg>`,
    });
    // Burst variant (smaller inner radius)
    const burstPoints = Array.from({ length: pts * 2 }, (_, i) => {
      const angle = (i * Math.PI) / pts - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : 12;
      return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
    }).join(' ');
    shapes.push({
      id: `geo-burst-${pts}`,
      name: `${pts}-Point Burst`,
      category, industry,
      tags: ['burst', `${pts}-point`, 'starburst'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="${burstPoints}" fill="${c[1]}"/></svg>`,
    });
  }

  // Rotated squares at different angles (8 variations)
  for (let i = 0; i < 8; i++) {
    const angle = i * 11.25;
    const c = PALETTES[i % PALETTES.length];
    shapes.push({
      id: `geo-rotsq-${i}`,
      name: `Tilted Square ${angle}°`,
      category, industry,
      tags: ['square', 'rotated', 'tilted', 'diamond'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="25" y="25" width="50" height="50" rx="4" fill="${c[0]}" transform="rotate(${angle} 50 50)"/></svg>`,
    });
  }

  // Circles with different treatments (6 variations)
  const circleStyles = [
    { name: 'Dotted Circle', stroke: 'stroke-dasharray="4 4"', fill: 'none' },
    { name: 'Dashed Circle', stroke: 'stroke-dasharray="10 5"', fill: 'none' },
    { name: 'Thick Ring', stroke: 'stroke-width="12"', fill: 'none' },
    { name: 'Half Circle', stroke: '', fill: 'clip' },
    { name: 'Gradient Disc', stroke: '', fill: 'gradient' },
    { name: 'Concentric Rings', stroke: '', fill: 'concentric' },
  ];
  circleStyles.forEach((cs, i) => {
    const c = PALETTES[i % PALETTES.length];
    let svg: string;
    if (cs.fill === 'concentric') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="44" fill="none" stroke="${c[0]}" stroke-width="2"/><circle cx="50" cy="50" r="34" fill="none" stroke="${c[0]}" stroke-width="2" opacity="0.7"/><circle cx="50" cy="50" r="24" fill="none" stroke="${c[0]}" stroke-width="2" opacity="0.5"/><circle cx="50" cy="50" r="14" fill="${c[0]}" opacity="0.3"/></svg>`;
    } else if (cs.fill === 'clip') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><clipPath id="hc${i}"><rect x="0" y="0" width="100" height="50"/></clipPath></defs><circle cx="50" cy="50" r="40" fill="${c[0]}" clip-path="url(#hc${i})"/></svg>`;
    } else if (cs.fill === 'gradient') {
      const gid = uid();
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="${gid}" cx="30%" cy="30%"><stop offset="0%" stop-color="${c[1]}"/><stop offset="100%" stop-color="${c[0]}"/></radialGradient></defs><circle cx="50" cy="50" r="42" fill="url(#${gid})"/></svg>`;
    } else {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="${cs.fill}" stroke="${c[0]}" stroke-width="3" ${cs.stroke}/></svg>`;
    }
    shapes.push({
      id: `geo-circle-${i}`,
      name: cs.name,
      category, industry,
      tags: ['circle', cs.name.toLowerCase().split(' ')[0]],
      svg,
    });
  });

  return shapes;
}

// ─── ORGANIC SHAPES ──────────────────────────────────────
function generateOrganic(): LibraryShape[] {
  const shapes: LibraryShape[] = [];
  const category = 'organic';
  const industry = 'general';

  // Blobs with different distortions (20 variations)
  for (let i = 0; i < 20; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    const seed = i * 137.5;
    const pts = Array.from({ length: 8 }, (_, j) => {
      const angle = (j * Math.PI * 2) / 8;
      const r = 30 + 15 * Math.sin(seed + j * 1.7);
      return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
    });
    const d = `M${pts[0]} C${pts[1]},${pts[2]},${pts[3]} S${pts[5]},${pts[4]} S${pts[7]},${pts[6]} Z`;
    shapes.push({
      id: `org-blob-${i}`,
      name: `Blob ${i + 1}`,
      category, industry,
      tags: ['blob', 'organic', 'amorphous', `variant-${i + 1}`],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="${gid}" cx="40%" cy="35%"><stop offset="0%" stop-color="${c[1]}"/><stop offset="100%" stop-color="${c[0]}"/></radialGradient></defs><path d="${d}" fill="url(#${gid})"/></svg>`,
    });
  }

  // Waves (15 variations)
  for (let i = 0; i < 15; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    const amp = 10 + (i % 5) * 5;
    const freq = 1 + (i % 3);
    const segments = Array.from({ length: freq * 2 }, (_, j) => {
      const x = (j * 200) / (freq * 2);
      const dir = j % 2 === 0 ? -amp : amp;
      return `Q${x + 200 / (freq * 4)} ${40 + dir}, ${x + 200 / (freq * 2)} 40`;
    }).join(' ');
    shapes.push({
      id: `org-wave-${i}`,
      name: `Wave ${i + 1}`,
      category, industry,
      tags: ['wave', 'flow', 'water', 'motion'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><path d="M0 40 ${segments} L200 80 L0 80 Z" fill="url(#${gid})" opacity="0.8"/></svg>`,
    });
  }

  // Drops / Teardrops (10 variations)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    const scale = 0.8 + (i % 3) * 0.15;
    const rot = i * 36;
    shapes.push({
      id: `org-drop-${i}`,
      name: `Teardrop ${i + 1}`,
      category, industry,
      tags: ['drop', 'teardrop', 'water', 'rain'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="${gid}" cx="40%" cy="60%"><stop offset="0%" stop-color="${c[1]}"/><stop offset="100%" stop-color="${c[0]}"/></radialGradient></defs><path d="M50 10 C50 10, 85 50, 85 65 C85 80, 68 92, 50 92 C32 92, 15 80, 15 65 C15 50, 50 10, 50 10 Z" fill="url(#${gid})" transform="rotate(${rot} 50 50) scale(${scale})" transform-origin="50 50"/></svg>`,
    });
  }

  // Leaves (10 variations)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[(i + 4) % PALETTES.length];
    const gid = uid();
    const rot = i * 36;
    shapes.push({
      id: `org-leaf-${i}`,
      name: `Leaf ${i + 1}`,
      category, industry,
      tags: ['leaf', 'nature', 'plant', 'eco'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><path d="M50 10 C75 15, 90 40, 85 65 C80 85, 55 95, 50 90 C45 95, 20 85, 15 65 C10 40, 25 15, 50 10 Z" fill="url(#${gid})" transform="rotate(${rot} 50 50)"/><line x1="50" y1="90" x2="50" y2="30" stroke="${c[0]}" stroke-width="1.5" opacity="0.3" transform="rotate(${rot} 50 50)"/></svg>`,
    });
  }

  // Petals / Flowers (10 variations)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const petalCount = 4 + (i % 5);
    const petals = Array.from({ length: petalCount }, (_, j) => {
      const angle = (j * 360) / petalCount;
      return `<ellipse cx="50" cy="25" rx="10" ry="22" fill="${c[0]}" opacity="${0.6 + (j % 3) * 0.15}" transform="rotate(${angle} 50 50)"/>`;
    }).join('');
    shapes.push({
      id: `org-flower-${i}`,
      name: `Flower ${petalCount} Petals`,
      category, industry,
      tags: ['flower', 'petal', 'nature', 'bloom'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${petals}<circle cx="50" cy="50" r="8" fill="${c[1]}"/></svg>`,
    });
  }

  // Clouds (10 variations)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    const r1 = 18 + (i % 4) * 3;
    const r2 = 14 + (i % 3) * 4;
    shapes.push({
      id: `org-cloud-${i}`,
      name: `Cloud ${i + 1}`,
      category, industry,
      tags: ['cloud', 'soft', 'fluffy', 'sky'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 80" width="140" height="80"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c[1]}"/><stop offset="100%" stop-color="${c[0]}"/></linearGradient></defs><circle cx="45" cy="45" r="${r1}" fill="url(#${gid})"/><circle cx="75" cy="40" r="${r2 + 4}" fill="url(#${gid})"/><circle cx="60" cy="30" r="${r2}" fill="url(#${gid})"/><rect x="${45 - r1}" y="45" width="${30 + r1 + r2}" height="15" fill="url(#${gid})"/></svg>`,
    });
  }

  // Spirals (5 variations)
  for (let i = 0; i < 5; i++) {
    const c = PALETTES[i % PALETTES.length];
    const turns = 2 + i;
    const pts = Array.from({ length: turns * 20 }, (_, j) => {
      const t = j / (turns * 20);
      const angle = t * turns * 2 * Math.PI;
      const r = 5 + t * 35;
      return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
    }).join(' L');
    shapes.push({
      id: `org-spiral-${i}`,
      name: `Spiral ${turns} Turns`,
      category, industry,
      tags: ['spiral', 'helix', 'swirl', 'vortex'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M${pts}" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    });
  }

  return shapes;
}

// ─── ABSTRACT SHAPES ──────────────────────────────────────
function generateAbstract(): LibraryShape[] {
  const shapes: LibraryShape[] = [];
  const category = 'abstract';
  const industry = 'general';

  // Intersecting circles (15 variations)
  for (let i = 0; i < 15; i++) {
    const c = PALETTES[i % PALETTES.length];
    const count = 2 + (i % 4);
    const circles = Array.from({ length: count }, (_, j) => {
      const angle = (j * 2 * Math.PI) / count;
      const cx = 50 + 15 * Math.cos(angle);
      const cy = 50 + 15 * Math.sin(angle);
      return `<circle cx="${cx}" cy="${cy}" r="25" fill="${c[j % 2]}" opacity="${0.3 + (j * 0.1)}"/>`;
    }).join('');
    shapes.push({
      id: `abs-venn-${i}`,
      name: `Venn ${count} Circles`,
      category, industry,
      tags: ['venn', 'overlap', 'intersection', 'blend'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${circles}</svg>`,
    });
  }

  // Noise / Scatter patterns (10 variations)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const dotCount = 15 + i * 3;
    const dots = Array.from({ length: dotCount }, (_, j) => {
      const x = 10 + ((j * 137.5 + i * 50) % 80);
      const y = 10 + ((j * 89.3 + i * 30) % 80);
      const r = 1.5 + (j % 4) * 1.2;
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c[j % 2]}" opacity="${0.3 + (j % 5) * 0.15}"/>`;
    }).join('');
    shapes.push({
      id: `abs-scatter-${i}`,
      name: `Scatter ${i + 1}`,
      category, industry,
      tags: ['scatter', 'dots', 'noise', 'particles'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${dots}</svg>`,
    });
  }

  // Gradient mesh / aurora (10 variations)
  for (let i = 0; i < 10; i++) {
    const c1 = PALETTES[i % PALETTES.length];
    const c2 = PALETTES[(i + 3) % PALETTES.length];
    const gid1 = uid(); const gid2 = uid();
    shapes.push({
      id: `abs-aurora-${i}`,
      name: `Aurora ${i + 1}`,
      category, industry,
      tags: ['aurora', 'gradient', 'glow', 'atmosphere'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100"><defs><linearGradient id="${gid1}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c1[0]}"/><stop offset="50%" stop-color="${c2[0]}"/><stop offset="100%" stop-color="${c1[1]}"/></linearGradient></defs><ellipse cx="100" cy="50" rx="90" ry="${30 + (i % 4) * 8}" fill="url(#${gid1})" opacity="0.7"/><ellipse cx="${80 + (i % 3) * 20}" cy="${40 + (i % 2) * 20}" rx="60" ry="${20 + (i % 3) * 5}" fill="${c2[1]}" opacity="0.3"/></svg>`,
    });
  }

  // Line art patterns (10 variations)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const lineCount = 6 + i * 2;
    const lines = Array.from({ length: lineCount }, (_, j) => {
      const angle = (j * 180) / lineCount;
      return `<line x1="50" y1="50" x2="${50 + 40 * Math.cos(angle * Math.PI / 180)}" y2="${50 + 40 * Math.sin(angle * Math.PI / 180)}" stroke="${c[0]}" stroke-width="1.5" opacity="${0.3 + (j % 3) * 0.2}"/>`;
    }).join('');
    shapes.push({
      id: `abs-rays-${i}`,
      name: `Radial Lines ${lineCount}`,
      category, industry,
      tags: ['rays', 'radial', 'lines', 'sunburst'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${lines}<circle cx="50" cy="50" r="5" fill="${c[0]}"/></svg>`,
    });
  }

  // Grid patterns (10 variations)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const cellSize = 8 + (i % 4) * 4;
    const cols = Math.floor(80 / cellSize);
    const rows = Math.floor(80 / cellSize);
    const rects = Array.from({ length: cols * rows }, (_, j) => {
      const col = j % cols;
      const row = Math.floor(j / cols);
      const opacity = ((col + row + i) % 4) * 0.25 + 0.1;
      return `<rect x="${10 + col * cellSize}" y="${10 + row * cellSize}" width="${cellSize - 1}" height="${cellSize - 1}" fill="${c[(col + row) % 2]}" opacity="${opacity}" rx="1"/>`;
    }).join('');
    shapes.push({
      id: `abs-grid-${i}`,
      name: `Grid Pattern ${i + 1}`,
      category, industry,
      tags: ['grid', 'pattern', 'tiles', 'mosaic'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${rects}</svg>`,
    });
  }

  // Wavy lines (10 variations)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const lineCount = 3 + (i % 4);
    const wlines = Array.from({ length: lineCount }, (_, j) => {
      const y = 20 + (j * 60) / (lineCount - 1 || 1);
      const amp = 5 + (j % 3) * 5;
      return `<path d="M0 ${y} Q25 ${y - amp}, 50 ${y} T100 ${y}" fill="none" stroke="${c[j % 2]}" stroke-width="${1.5 + (j % 2)}" opacity="${0.4 + j * 0.15}"/>`;
    }).join('');
    shapes.push({
      id: `abs-wlines-${i}`,
      name: `Wavy Lines ${i + 1}`,
      category, industry,
      tags: ['wavy', 'lines', 'parallel', 'flow'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${wlines}</svg>`,
    });
  }

  // Infinity / Lemniscate (5)
  for (let i = 0; i < 5; i++) {
    const c = PALETTES[i % PALETTES.length];
    const sw = 2 + i;
    shapes.push({
      id: `abs-infinity-${i}`,
      name: `Infinity ${i + 1}`,
      category, industry,
      tags: ['infinity', 'loop', 'endless', 'lemniscate'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 80" width="140" height="80"><path d="M70 40 C70 15, 20 15, 20 40 C20 65, 70 65, 70 40 C70 15, 120 15, 120 40 C120 65, 70 65, 70 40" fill="none" stroke="${c[0]}" stroke-width="${sw}" stroke-linecap="round"/></svg>`,
    });
  }

  return shapes;
}

// ─── ARROWS & INDICATORS ─────────────────────────────────
function generateArrows(): LibraryShape[] {
  const shapes: LibraryShape[] = [];
  const category = 'minimal';
  const industry = 'general';

  // Directional arrows (8 directions × 3 styles = 24)
  const directions = [
    { name: 'Right', angle: 0 },
    { name: 'Down-Right', angle: 45 },
    { name: 'Down', angle: 90 },
    { name: 'Down-Left', angle: 135 },
    { name: 'Left', angle: 180 },
    { name: 'Up-Left', angle: 225 },
    { name: 'Up', angle: 270 },
    { name: 'Up-Right', angle: 315 },
  ];

  directions.forEach((dir, i) => {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    // Filled arrow
    shapes.push({
      id: `arr-filled-${i}`,
      name: `Arrow ${dir.name}`,
      category, industry,
      tags: ['arrow', dir.name.toLowerCase(), 'direction', 'filled'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><polygon points="20,35 65,35 65,20 90,50 65,80 65,65 20,65" fill="url(#${gid})" transform="rotate(${dir.angle} 50 50)"/></svg>`,
    });

    // Line arrow
    shapes.push({
      id: `arr-line-${i}`,
      name: `Line Arrow ${dir.name}`,
      category, industry,
      tags: ['arrow', dir.name.toLowerCase(), 'line', 'thin'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><line x1="20" y1="50" x2="80" y2="50" stroke="${c[0]}" stroke-width="3" stroke-linecap="round" transform="rotate(${dir.angle} 50 50)"/><polyline points="65,35 80,50 65,65" fill="none" stroke="${c[0]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${dir.angle} 50 50)"/></svg>`,
    });
  });

  // Chevrons (10 variations)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const angle = (i % 4) * 90;
    const count = 1 + (i % 3);
    const chevrons = Array.from({ length: count }, (_, j) => {
      const x = 35 + j * 12;
      return `<polyline points="${x},25 ${x + 15},50 ${x},75" fill="none" stroke="${c[0]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="${1 - j * 0.2}"/>`;
    }).join('');
    shapes.push({
      id: `arr-chevron-${i}`,
      name: `Chevron ${count}x ${['Right', 'Down', 'Left', 'Up'][i % 4]}`,
      category, industry,
      tags: ['chevron', 'direction', 'indicator', 'caret'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g transform="rotate(${angle} 50 50)">${chevrons}</g></svg>`,
    });
  }

  // Circular arrows (5 variations)
  for (let i = 0; i < 5; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gap = 30 + i * 15;
    shapes.push({
      id: `arr-circular-${i}`,
      name: `Circular Arrow ${i + 1}`,
      category, industry,
      tags: ['circular', 'refresh', 'rotate', 'cycle'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 15 A35 35 0 1 1 ${50 - 35 * Math.cos(gap * Math.PI / 180)} ${50 - 35 * Math.sin(gap * Math.PI / 180)}" fill="none" stroke="${c[0]}" stroke-width="4" stroke-linecap="round"/><polygon points="50,8 56,20 44,20" fill="${c[0]}"/></svg>`,
    });
  }

  // Double-headed arrows (5 variations)
  for (let i = 0; i < 5; i++) {
    const c = PALETTES[i % PALETTES.length];
    const angle = i * 36;
    shapes.push({
      id: `arr-double-${i}`,
      name: `Double Arrow ${i + 1}`,
      category, industry,
      tags: ['double', 'bidirectional', 'resize', 'expand'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g transform="rotate(${angle} 50 50)"><line x1="25" y1="50" x2="75" y2="50" stroke="${c[0]}" stroke-width="3"/><polygon points="10,50 25,40 25,60" fill="${c[0]}"/><polygon points="90,50 75,40 75,60" fill="${c[0]}"/></g></svg>`,
    });
  }

  // Pointers / Cursors (6)
  for (let i = 0; i < 6; i++) {
    const c = PALETTES[i % PALETTES.length];
    const angle = i * 60;
    shapes.push({
      id: `arr-pointer-${i}`,
      name: `Pointer ${i + 1}`,
      category, industry,
      tags: ['pointer', 'cursor', 'click', 'select'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="30,15 30,80 45,65 65,85 75,78 55,58 75,55" fill="${c[0]}" stroke="${c[1]}" stroke-width="2" stroke-linejoin="round" transform="rotate(${angle} 50 50)"/></svg>`,
    });
  }

  return shapes;
}

// ─── BADGES & SHIELDS ────────────────────────────────────
function generateBadges(): LibraryShape[] {
  const shapes: LibraryShape[] = [];
  const category = 'badges';
  const industry = 'general';

  // Shield variations (15)
  for (let i = 0; i < 15; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    const bottomCurve = 70 + (i % 5) * 5;
    const topWidth = 35 + (i % 3) * 5;
    shapes.push({
      id: `badge-shield-${i}`,
      name: `Shield ${i + 1}`,
      category, industry,
      tags: ['shield', 'protection', 'security', 'badge'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><path d="M50 8 L${50 + topWidth} 20 L${50 + topWidth} 55 Q${50 + topWidth} ${bottomCurve}, 50 92 Q${50 - topWidth} ${bottomCurve}, ${50 - topWidth} 55 L${50 - topWidth} 20 Z" fill="url(#${gid})"/></svg>`,
    });
  }

  // Ribbon badges (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    shapes.push({
      id: `badge-ribbon-${i}`,
      name: `Ribbon Badge ${i + 1}`,
      category, industry,
      tags: ['ribbon', 'badge', 'award', 'medal'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><circle cx="50" cy="40" r="${25 + (i % 3) * 3}" fill="url(#${gid})"/><polygon points="35,55 25,90 50,75 75,90 65,55" fill="${c[0]}" opacity="0.8"/></svg>`,
    });
  }

  // Seal / rosette (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const pts = 8 + i * 2;
    const sealPoints = Array.from({ length: pts * 2 }, (_, j) => {
      const angle = (j * Math.PI) / pts - Math.PI / 2;
      const r = j % 2 === 0 ? 42 : 35;
      return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
    }).join(' ');
    shapes.push({
      id: `badge-seal-${i}`,
      name: `Seal ${pts / 2 + pts / 2} Points`,
      category, industry,
      tags: ['seal', 'rosette', 'stamp', 'certification'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="${sealPoints}" fill="${c[0]}"/><circle cx="50" cy="50" r="25" fill="${c[1]}" opacity="0.3"/></svg>`,
    });
  }

  // Banners (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    const notch = 5 + (i % 4) * 3;
    shapes.push({
      id: `badge-banner-${i}`,
      name: `Banner ${i + 1}`,
      category, industry,
      tags: ['banner', 'ribbon', 'label', 'tag'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 60" width="160" height="60"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><polygon points="0,10 ${notch},30 0,50 150,50 ${150 - notch},30 150,50 150,10" fill="url(#${gid})"/></svg>`,
    });
  }

  // Hexagonal badges (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    shapes.push({
      id: `badge-hex-${i}`,
      name: `Hex Badge ${i + 1}`,
      category, industry,
      tags: ['hexagon', 'badge', 'status', 'rank'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="url(#${gid})" stroke="${c[0]}" stroke-width="${1 + (i % 3)}"/><polygon points="50,20 75,35 75,65 50,80 25,65 25,35" fill="none" stroke="${c[1]}" stroke-width="1" opacity="0.5"/></svg>`,
    });
  }

  // Corner frames (10) 
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const len = 15 + (i % 5) * 5;
    const sw = 2 + (i % 3);
    shapes.push({
      id: `badge-frame-${i}`,
      name: `Corner Frame ${i + 1}`,
      category: 'frames',
      industry,
      tags: ['frame', 'border', 'corner', 'decorative'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polyline points="${len},10 10,10 10,${len}" fill="none" stroke="${c[0]}" stroke-width="${sw}" stroke-linecap="round"/><polyline points="${100 - len},10 90,10 90,${len}" fill="none" stroke="${c[0]}" stroke-width="${sw}" stroke-linecap="round"/><polyline points="10,${100 - len} 10,90 ${len},90" fill="none" stroke="${c[0]}" stroke-width="${sw}" stroke-linecap="round"/><polyline points="90,${100 - len} 90,90 ${100 - len},90" fill="none" stroke="${c[0]}" stroke-width="${sw}" stroke-linecap="round"/></svg>`,
    });
  }

  return shapes;
}

// ─── DECORATIVE ──────────────────────────────────────────
function generateDecorative(): LibraryShape[] {
  const shapes: LibraryShape[] = [];
  const category = 'decorative';
  const industry = 'general';

  // Ornamental dividers (15)
  for (let i = 0; i < 15; i++) {
    const c = PALETTES[i % PALETTES.length];
    const style = i % 5;
    let inner: string;
    if (style === 0) {
      inner = `<line x1="10" y1="40" x2="190" y2="40" stroke="${c[0]}" stroke-width="1.5"/><circle cx="100" cy="40" r="5" fill="${c[0]}"/>`;
    } else if (style === 1) {
      inner = `<line x1="10" y1="40" x2="85" y2="40" stroke="${c[0]}" stroke-width="1.5"/><diamond cx="100" cy="40"/><polygon points="100,33 107,40 100,47 93,40" fill="${c[0]}"/><line x1="115" y1="40" x2="190" y2="40" stroke="${c[0]}" stroke-width="1.5"/>`;
    } else if (style === 2) {
      inner = `<path d="M10 40 Q55 ${20 + (i % 3) * 10}, 100 40 T190 40" fill="none" stroke="${c[0]}" stroke-width="2"/>`;
    } else if (style === 3) {
      inner = `<line x1="10" y1="38" x2="190" y2="38" stroke="${c[0]}" stroke-width="1"/><line x1="10" y1="42" x2="190" y2="42" stroke="${c[0]}" stroke-width="1"/><circle cx="100" cy="40" r="4" fill="${c[0]}"/>`;
    } else {
      inner = `<line x1="10" y1="40" x2="190" y2="40" stroke="${c[0]}" stroke-width="1" stroke-dasharray="${3 + i % 4} ${2 + i % 3}"/>`;
    }
    shapes.push({
      id: `dec-divider-${i}`,
      name: `Divider ${i + 1}`,
      category, industry,
      tags: ['divider', 'separator', 'line', 'ornament'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80">${inner}</svg>`,
    });
  }

  // Decorative dots / circles patterns (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const spacing = 12 + (i % 3) * 4;
    const dotR = 2 + (i % 4);
    const dots = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const x = 15 + col * spacing;
        const y = 15 + row * spacing;
        dots.push(`<circle cx="${x}" cy="${y}" r="${dotR}" fill="${c[(row + col) % 2]}" opacity="${0.3 + ((row + col) % 4) * 0.2}"/>`);
      }
    }
    shapes.push({
      id: `dec-dotgrid-${i}`,
      name: `Dot Grid ${i + 1}`,
      category, industry,
      tags: ['dots', 'grid', 'pattern', 'halftone'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${dots.join('')}</svg>`,
    });
  }

  // Zigzag / chevron borders (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const zigCount = 5 + i;
    const amp = 8 + (i % 4) * 3;
    const points = Array.from({ length: zigCount + 1 }, (_, j) => {
      const x = (j * 180) / zigCount + 10;
      const y = j % 2 === 0 ? 40 - amp : 40 + amp;
      return `${x},${y}`;
    }).join(' ');
    shapes.push({
      id: `dec-zigzag-${i}`,
      name: `Zigzag ${i + 1}`,
      category, industry,
      tags: ['zigzag', 'chevron', 'border', 'pattern'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><polyline points="${points}" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
    });
  }

  // Crescents / moon shapes (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const offset = 10 + i * 3;
    const rot = i * 36;
    shapes.push({
      id: `dec-crescent-${i}`,
      name: `Crescent ${i + 1}`,
      category, industry,
      tags: ['crescent', 'moon', 'arc', 'curve'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="38" fill="${c[0]}"/><circle cx="${50 + offset}" cy="45" r="32" fill="var(--background, #fff)" transform="rotate(${rot} 50 50)"/></svg>`,
    });
  }

  // Cross-hatch patterns (5)
  for (let i = 0; i < 5; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gap = 8 + i * 2;
    const lines = [];
    for (let j = 0; j * gap < 100; j++) {
      lines.push(`<line x1="${j * gap}" y1="0" x2="${j * gap}" y2="100" stroke="${c[0]}" stroke-width="0.8" opacity="0.4"/>`);
      lines.push(`<line x1="0" y1="${j * gap}" x2="100" y2="${j * gap}" stroke="${c[0]}" stroke-width="0.8" opacity="0.4"/>`);
    }
    shapes.push({
      id: `dec-crosshatch-${i}`,
      name: `Crosshatch ${i + 1}`,
      category, industry,
      tags: ['crosshatch', 'hatch', 'grid', 'texture'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${lines.join('')}</svg>`,
    });
  }

  return shapes;
}

// ─── UI & INTERFACE ──────────────────────────────────────
function generateUI(): LibraryShape[] {
  const shapes: LibraryShape[] = [];
  const category = 'icons';
  const industry = 'general';

  // Button shapes (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    const rx = (i % 5) * 8;
    const w = 100 + (i % 3) * 20;
    shapes.push({
      id: `ui-button-${i}`,
      name: `Button ${i + 1}`,
      category, industry,
      tags: ['button', 'cta', 'action', 'ui'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + 20} 60" width="${w + 20}" height="60"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><rect x="10" y="10" width="${w}" height="40" rx="${rx}" fill="url(#${gid})"/></svg>`,
    });
  }

  // Card shapes (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    shapes.push({
      id: `ui-card-${i}`,
      name: `Card ${i + 1}`,
      category, industry,
      tags: ['card', 'container', 'panel', 'ui'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="120" height="90"><rect x="5" y="5" width="110" height="80" rx="${6 + (i % 4) * 3}" fill="none" stroke="${c[0]}" stroke-width="2"/><rect x="5" y="5" width="110" height="20" rx="${6 + (i % 4) * 3}" fill="${c[0]}" opacity="0.15"/><line x1="5" y1="25" x2="115" y2="25" stroke="${c[0]}" stroke-width="1" opacity="0.3"/></svg>`,
    });
  }

  // Toggle / switch shapes (5)
  for (let i = 0; i < 5; i++) {
    const c = PALETTES[i % PALETTES.length];
    const isOn = i % 2 === 0;
    shapes.push({
      id: `ui-toggle-${i}`,
      name: `Toggle ${isOn ? 'On' : 'Off'} ${i + 1}`,
      category, industry,
      tags: ['toggle', 'switch', 'on-off', 'boolean'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40" width="80" height="40"><rect x="5" y="5" width="70" height="30" rx="15" fill="${isOn ? c[0] : '#94A3B8'}" opacity="${isOn ? 1 : 0.4}"/><circle cx="${isOn ? 55 : 25}" cy="20" r="11" fill="white"/></svg>`,
    });
  }

  // Progress bars (8)
  for (let i = 0; i < 8; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    const pct = 15 + i * 10;
    shapes.push({
      id: `ui-progress-${i}`,
      name: `Progress ${pct}%`,
      category, industry,
      tags: ['progress', 'bar', 'loading', 'status'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 30" width="160" height="30"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><rect x="5" y="8" width="150" height="14" rx="7" fill="${c[0]}" opacity="0.15"/><rect x="5" y="8" width="${pct * 1.5}" height="14" rx="7" fill="url(#${gid})"/></svg>`,
    });
  }

  // Notification dots / badges (8)
  for (let i = 0; i < 8; i++) {
    const c = PALETTES[i % PALETTES.length];
    const size = 8 + i * 2;
    shapes.push({
      id: `ui-notif-${i}`,
      name: `Notification Dot ${i + 1}`,
      category, industry,
      tags: ['notification', 'dot', 'badge', 'alert'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60"><circle cx="30" cy="30" r="${size}" fill="${c[0]}"/><circle cx="30" cy="30" r="${size - 3}" fill="none" stroke="white" stroke-width="1.5" opacity="0.5"/></svg>`,
    });
  }

  // Tab shapes (6)
  for (let i = 0; i < 6; i++) {
    const c = PALETTES[i % PALETTES.length];
    shapes.push({
      id: `ui-tab-${i}`,
      name: `Tab ${i + 1}`,
      category, industry,
      tags: ['tab', 'navigation', 'menu', 'ui'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="100" height="50"><path d="M0 45 L${8 + (i % 3) * 2} 8 Q${10 + (i % 3) * 2} 5, ${14 + (i % 3) * 2} 5 L${86 - (i % 3) * 2} 5 Q${90 - (i % 3) * 2} 5, ${92 - (i % 3) * 2} 8 L100 45" fill="${c[0]}" opacity="0.8"/></svg>`,
    });
  }

  // Tooltips (6)
  for (let i = 0; i < 6; i++) {
    const c = PALETTES[i % PALETTES.length];
    const dirs = ['bottom', 'top', 'right', 'left', 'bottom', 'top'];
    let path: string;
    if (dirs[i] === 'bottom') {
      path = `M10 5 h80 a5 5 0 0 1 5 5 v30 a5 5 0 0 1 -5 5 h-30 l-10 10 l-10 -10 h-30 a5 5 0 0 1 -5 -5 v-30 a5 5 0 0 1 5 -5 z`;
    } else if (dirs[i] === 'top') {
      path = `M50 5 l10 10 h30 a5 5 0 0 1 5 5 v30 a5 5 0 0 1 -5 5 h-80 a5 5 0 0 1 -5 -5 v-30 a5 5 0 0 1 5 -5 h30 z`;
    } else {
      path = `M10 5 h80 a5 5 0 0 1 5 5 v30 a5 5 0 0 1 -5 5 h-30 l-10 10 l-10 -10 h-30 a5 5 0 0 1 -5 -5 v-30 a5 5 0 0 1 5 -5 z`;
    }
    shapes.push({
      id: `ui-tooltip-${i}`,
      name: `Tooltip ${dirs[i]}`,
      category, industry,
      tags: ['tooltip', 'popup', 'speech', 'callout'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 65" width="100" height="65"><path d="${path}" fill="${c[0]}"/></svg>`,
    });
  }

  // Checkmarks & X marks (8)
  const marks = [
    { name: 'Checkmark', d: 'M25 50 L42 67 L75 33', tags: ['check', 'success', 'done'] },
    { name: 'X Mark', d: 'M30 30 L70 70 M70 30 L30 70', tags: ['x', 'close', 'delete'] },
    { name: 'Circle Check', d: '', tags: ['check', 'circle', 'success'] },
    { name: 'Circle X', d: '', tags: ['x', 'circle', 'error'] },
  ];
  marks.forEach((m, i) => {
    const c = PALETTES[i % PALETTES.length];
    let svg: string;
    if (m.name === 'Circle Check') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="${c[0]}" opacity="0.15"/><circle cx="50" cy="50" r="40" fill="none" stroke="${c[0]}" stroke-width="3"/><polyline points="30,50 45,65 72,38" fill="none" stroke="${c[0]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    } else if (m.name === 'Circle X') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="${c[0]}" opacity="0.15"/><circle cx="50" cy="50" r="40" fill="none" stroke="${c[0]}" stroke-width="3"/><line x1="35" y1="35" x2="65" y2="65" stroke="${c[0]}" stroke-width="4" stroke-linecap="round"/><line x1="65" y1="35" x2="35" y2="65" stroke="${c[0]}" stroke-width="4" stroke-linecap="round"/></svg>`;
    } else {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="${m.d}" fill="none" stroke="${c[0]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
    shapes.push({
      id: `ui-mark-${i}`,
      name: m.name,
      category, industry,
      tags: m.tags,
      svg,
    });
  });

  return shapes;
}

// ─── LAYERED / DEPTH ─────────────────────────────────────
function generateLayered(): LibraryShape[] {
  const shapes: LibraryShape[] = [];
  const category = 'layered';
  const industry = 'general';

  // Stacked cards (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    const layers = 2 + (i % 3);
    const cards = Array.from({ length: layers }, (_, j) => {
      const offset = j * 6;
      const opac = 0.3 + (j / layers) * 0.7;
      return `<rect x="${10 + offset}" y="${20 - offset}" width="80" height="55" rx="8" fill="${c[0]}" opacity="${opac}"/>`;
    }).join('');
    shapes.push({
      id: `lay-stacked-${i}`,
      name: `Stacked ${layers} Cards`,
      category, industry,
      tags: ['stacked', 'layers', 'cards', 'depth'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${cards}</svg>`,
    });
  }

  // Concentric shapes (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const ringCount = 3 + (i % 3);
    const rings = Array.from({ length: ringCount }, (_, j) => {
      const r = 42 - j * (35 / ringCount);
      return `<circle cx="50" cy="50" r="${r}" fill="${c[j % 2]}" opacity="${0.2 + (j / ringCount) * 0.6}"/>`;
    }).join('');
    shapes.push({
      id: `lay-concentric-${i}`,
      name: `Concentric ${ringCount} Rings`,
      category, industry,
      tags: ['concentric', 'rings', 'target', 'ripple'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${rings}</svg>`,
    });
  }

  // Overlapping circles (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const count = 2 + (i % 4);
    const overlapCircles = Array.from({ length: count }, (_, j) => {
      const cx = 30 + j * (40 / count);
      return `<circle cx="${cx}" cy="50" r="22" fill="${c[j % 2]}" opacity="${0.5 + j * 0.1}"/>`;
    }).join('');
    shapes.push({
      id: `lay-overlap-${i}`,
      name: `Overlap ${count} Circles`,
      category, industry,
      tags: ['overlap', 'circles', 'blend', 'intersection'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${overlapCircles}</svg>`,
    });
  }

  // Shadow shapes (10)
  for (let i = 0; i < 10; i++) {
    const c = PALETTES[i % PALETTES.length];
    const gid = uid();
    const shadowOffset = 3 + (i % 4);
    shapes.push({
      id: `lay-shadow-${i}`,
      name: `Shadow Shape ${i + 1}`,
      category, industry,
      tags: ['shadow', 'elevated', 'floating', '3d'],
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><rect x="${20 + shadowOffset}" y="${20 + shadowOffset}" width="55" height="55" rx="10" fill="#000" opacity="0.12"/><rect x="20" y="20" width="55" height="55" rx="10" fill="url(#${gid})"/></svg>`,
    });
  }

  return shapes;
}

// ─── MASTER GENERATOR ────────────────────────────────────
let _generatedShapes: LibraryShape[] | null = null;

export function getGeneratedShapes(): LibraryShape[] {
  if (_generatedShapes) return _generatedShapes;
  
  _counter = 0; // Reset UID counter
  _generatedShapes = [
    ...generateGeometric(),
    ...generateOrganic(),
    ...generateAbstract(),
    ...generateArrows(),
    ...generateBadges(),
    ...generateDecorative(),
    ...generateUI(),
    ...generateLayered(),
  ];
  
  return _generatedShapes;
}

// Category counts for display
export function getGeneratedCategoryCounts(): Record<string, number> {
  const shapes = getGeneratedShapes();
  const counts: Record<string, number> = { all: shapes.length };
  shapes.forEach(s => {
    counts[s.category] = (counts[s.category] || 0) + 1;
  });
  return counts;
}

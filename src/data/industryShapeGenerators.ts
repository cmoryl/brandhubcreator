/**
 * Industry-Specific Shape Generators
 * Generates 50 shapes per industry using parametric SVG construction.
 */

import type { LibraryShape } from './shapeLibrary';

const PALETTES = [
  ['#6366F1', '#818CF8'], ['#3B82F6', '#60A5FA'], ['#06B6D4', '#22D3EE'],
  ['#10B981', '#34D399'], ['#F59E0B', '#FBBF24'], ['#EF4444', '#F87171'],
  ['#EC4899', '#F472B6'], ['#8B5CF6', '#A78BFA'], ['#F97316', '#FB923C'],
  ['#14B8A6', '#2DD4BF'], ['#84CC16', '#A3E635'], ['#E11D48', '#FB7185'],
];

let _uid = 10000;
const uid = () => `isg${++_uid}`;

function p(i: number) { return PALETTES[i % PALETTES.length]; }

function poly(cx: number, cy: number, r: number, sides: number): string {
  return Array.from({ length: sides }, (_, i) => {
    const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

function gradSvg(id: string, c: string[], content: string, vb = '0 0 100 100', w = 100, h = 100): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}"><defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs>${content}</svg>`;
}

function shape(id: string, name: string, category: string, industry: string, tags: string[], svg: string): LibraryShape {
  return { id, name, category, industry, tags, svg };
}

// ─── TECHNOLOGY (50) ──────────────────────────────────────
function genTechnology(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'technology';

  // Circuit boards (10)
  for (let i = 0; i < 10; i++) {
    const c = p(i); const g = uid();
    const lines = Array.from({ length: 4 + i % 3 }, (_, j) => {
      const y = 15 + j * 15;
      return `<line x1="10" y1="${y}" x2="90" y2="${y}" stroke="${c[0]}" stroke-width="1.5" opacity="${0.3 + j * 0.1}"/><circle cx="${20 + j * 15}" cy="${y}" r="3" fill="${c[1]}"/>`;
    }).join('');
    s.push(shape(`tech-circuit-${i}`, `Circuit Board ${i + 1}`, 'abstract', ind, ['circuit', 'board', 'pcb', 'tech'], gradSvg(g, c, `<rect x="5" y="5" width="90" height="90" rx="6" fill="url(#${g})" opacity="0.1"/>${lines}`)));
  }

  // Binary/data blocks (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i);
    const blocks = Array.from({ length: 16 }, (_, j) => {
      const x = 10 + (j % 4) * 22; const y = 10 + Math.floor(j / 4) * 22;
      return `<rect x="${x}" y="${y}" width="18" height="18" rx="3" fill="${c[(j + i) % 2]}" opacity="${0.2 + ((j + i) % 4) * 0.2}"/>`;
    }).join('');
    s.push(shape(`tech-binary-${i}`, `Data Grid ${i + 1}`, 'geometric', ind, ['binary', 'data', 'digital', 'grid'], `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${blocks}</svg>`));
  }

  // Network nodes (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i);
    const nodes = Array.from({ length: 5 }, (_, j) => {
      const cx = 20 + (j % 3) * 30; const cy = 25 + Math.floor(j / 3) * 40;
      return `<circle cx="${cx}" cy="${cy}" r="${6 + j % 3}" fill="${c[j % 2]}" opacity="0.8"/>`;
    }).join('');
    const edges = `<line x1="20" y1="25" x2="50" y2="25" stroke="${c[0]}" stroke-width="1.5" opacity="0.4"/><line x1="50" y1="25" x2="80" y2="25" stroke="${c[0]}" stroke-width="1.5" opacity="0.4"/><line x1="20" y1="65" x2="50" y2="65" stroke="${c[0]}" stroke-width="1.5" opacity="0.4"/><line x1="50" y1="25" x2="20" y2="65" stroke="${c[0]}" stroke-width="1" opacity="0.3"/>`;
    s.push(shape(`tech-network-${i}`, `Network ${i + 1}`, 'abstract', ind, ['network', 'nodes', 'connected', 'topology'], `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${edges}${nodes}</svg>`));
  }

  // Server racks (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i); const g = uid();
    const slots = Array.from({ length: 4 }, (_, j) => `<rect x="20" y="${15 + j * 18}" width="60" height="14" rx="2" fill="${c[0]}" opacity="${0.3 + j * 0.15}"/><circle cx="72" cy="${22 + j * 18}" r="3" fill="${c[1]}"/>`).join('');
    s.push(shape(`tech-server-${i}`, `Server Rack ${i + 1}`, 'icons', ind, ['server', 'rack', 'hosting', 'infrastructure'], gradSvg(g, c, `<rect x="15" y="8" width="70" height="84" rx="5" fill="none" stroke="${c[0]}" stroke-width="2"/>${slots}`)));
  }

  // API/endpoint symbols (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    s.push(shape(`tech-api-${i}`, `API Endpoint ${i + 1}`, 'minimal', ind, ['api', 'endpoint', 'rest', 'webhook'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" width="120" height="60"><rect x="5" y="5" width="50" height="50" rx="8" fill="${c[0]}" opacity="0.2"/><rect x="65" y="5" width="50" height="50" rx="8" fill="${c[1]}" opacity="0.2"/><line x1="55" y1="30" x2="65" y2="30" stroke="${c[0]}" stroke-width="3" stroke-dasharray="${3 + i}"/><polygon points="63,25 70,30 63,35" fill="${c[0]}"/></svg>`));
  }

  // Satellite/signal (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    const arcs = Array.from({ length: 3 }, (_, j) => `<path d="M${60 + j * 10} ${40 - j * 10} A${10 + j * 10} ${10 + j * 10} 0 0 0 ${40 - j * 10} ${60 + j * 10}" fill="none" stroke="${c[0]}" stroke-width="2" opacity="${0.8 - j * 0.2}"/>`).join('');
    s.push(shape(`tech-signal-${i}`, `Signal Wave ${i + 1}`, 'abstract', ind, ['signal', 'wifi', 'wireless', 'broadcast'], `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="5" fill="${c[0]}"/>${arcs}</svg>`));
  }

  // Code windows (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    s.push(shape(`tech-window-${i}`, `Code Window ${i + 1}`, 'icons', ind, ['window', 'browser', 'code', 'ide'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><rect x="5" y="5" width="110" height="70" rx="6" fill="${c[0]}" opacity="0.1" stroke="${c[0]}" stroke-width="1.5"/><rect x="5" y="5" width="110" height="16" rx="6" fill="${c[0]}" opacity="0.2"/><circle cx="16" cy="13" r="3" fill="#EF4444" opacity="0.7"/><circle cx="26" cy="13" r="3" fill="#FBBF24" opacity="0.7"/><circle cx="36" cy="13" r="3" fill="#10B981" opacity="0.7"/><rect x="15" y="30" width="${30 + i * 5}" height="4" rx="2" fill="${c[0]}" opacity="0.3"/><rect x="15" y="40" width="${50 + i * 3}" height="4" rx="2" fill="${c[1]}" opacity="0.2"/><rect x="15" y="50" width="${20 + i * 8}" height="4" rx="2" fill="${c[0]}" opacity="0.25"/></svg>`));
  }

  return s;
}

// ─── HEALTHCARE (50) ──────────────────────────────────────
function genHealthcare(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'healthcare';

  // Medical crosses (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i); const g = uid();
    const w = 26 + i * 2; const r = 2 + i;
    s.push(shape(`hc-cross-${i}`, `Medical Cross ${i + 1}`, 'icons', ind, ['cross', 'medical', 'health', 'hospital'],
      gradSvg(g, c, `<rect x="${50 - w / 2}" y="12" width="${w}" height="76" rx="${r}" fill="url(#${g})"/><rect x="12" y="${50 - w / 2}" width="76" height="${w}" rx="${r}" fill="url(#${g})"/>`)));
  }

  // Hearts (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i); const g = uid();
    const scale = 0.8 + i * 0.03;
    s.push(shape(`hc-heart-${i}`, `Heart ${i + 1}`, 'organic', ind, ['heart', 'cardiology', 'care', 'love'],
      gradSvg(g, c, `<path d="M50 85 C25 62, 8 48, 8 30 C8 16, 18 8, 30 8 C38 8, 45 12, 50 20 C55 12, 62 8, 70 8 C82 8, 92 16, 92 30 C92 48, 75 62, 50 85 Z" fill="url(#${g})" transform="scale(${scale})" transform-origin="50 50"/>`)));
  }

  // DNA strands (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    const rungs = Array.from({ length: 5 }, (_, j) => `<line x1="${25 + j * 2}" y1="${15 + j * 18}" x2="${75 - j * 2}" y2="${15 + j * 18}" stroke="${c[1]}" stroke-width="1.5" opacity="0.4"/>`).join('');
    s.push(shape(`hc-dna-${i}`, `DNA Strand ${i + 1}`, 'abstract', ind, ['dna', 'genetics', 'biotech', 'helix'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M25 5 C50 20, 60 40, 25 55 C50 70, 60 90, 25 100" fill="none" stroke="${c[0]}" stroke-width="2.5"/><path d="M75 5 C50 20, 40 40, 75 55 C50 70, 40 90, 75 100" fill="none" stroke="${c[1]}" stroke-width="2.5"/>${rungs}</svg>`));
  }

  // Pills/capsules (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i); const rot = i * 30;
    s.push(shape(`hc-pill-${i}`, `Pill ${i + 1}`, 'icons', ind, ['pill', 'medicine', 'pharmacy', 'capsule'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g transform="rotate(${rot} 50 50)"><rect x="30" y="18" width="40" height="64" rx="20" fill="${c[0]}" opacity="0.8"/><rect x="30" y="50" width="40" height="32" rx="0" fill="${c[1]}" opacity="0.6"/><line x1="30" y1="50" x2="70" y2="50" stroke="white" stroke-width="1" opacity="0.5"/></g></svg>`));
  }

  // Stethoscopes (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i);
    s.push(shape(`hc-steth-${i}`, `Stethoscope ${i + 1}`, 'icons', ind, ['stethoscope', 'doctor', 'diagnosis', 'clinical'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M30 15 L30 40 C30 60, 50 70, 70 55" fill="none" stroke="${c[0]}" stroke-width="3" stroke-linecap="round"/><path d="M45 15 L45 40 C45 55, 55 62, 70 55" fill="none" stroke="${c[0]}" stroke-width="3" stroke-linecap="round"/><circle cx="70" cy="55" r="12" fill="none" stroke="${c[0]}" stroke-width="3"/><circle cx="70" cy="55" r="5" fill="${c[1]}"/></svg>`));
  }

  // Shields/protection (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i); const g = uid();
    s.push(shape(`hc-shield-${i}`, `Health Shield ${i + 1}`, 'badges', ind, ['shield', 'protection', 'insurance', 'safety'],
      gradSvg(g, c, `<path d="M50 8 L88 24 L88 55 C88 78, 68 95, 50 100 C32 95, 12 78, 12 55 L12 24 Z" fill="url(#${g})" opacity="0.8"/><rect x="42" y="38" width="16" height="32" rx="2" fill="white" opacity="0.8"/><rect x="36" y="48" width="28" height="12" rx="2" fill="white" opacity="0.8"/>`)));
  }

  // Pulse/heartbeat lines (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    const amp = 15 + i * 3;
    s.push(shape(`hc-pulse-${i}`, `Heartbeat ${i + 1}`, 'abstract', ind, ['pulse', 'heartbeat', 'ecg', 'vital'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 60" width="160" height="60"><polyline points="0,30 30,30 40,${30 - amp} 50,${30 + amp} 60,30 70,${30 - amp / 2} 80,30 160,30" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`));
  }

  // Molecules (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i);
    const atoms = Array.from({ length: 4 + i }, (_, j) => {
      const a = (j * 2 * Math.PI) / (4 + i);
      const cx = 50 + 25 * Math.cos(a); const cy = 50 + 25 * Math.sin(a);
      return `<line x1="50" y1="50" x2="${cx}" y2="${cy}" stroke="${c[0]}" stroke-width="2" opacity="0.5"/><circle cx="${cx}" cy="${cy}" r="${5 + j % 3}" fill="${c[j % 2]}" opacity="0.8"/>`;
    }).join('');
    s.push(shape(`hc-molecule-${i}`, `Molecule ${i + 1}`, 'abstract', ind, ['molecule', 'atom', 'chemistry', 'compound'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="8" fill="${c[0]}"/>${atoms}</svg>`));
  }

  // Leaves/wellness (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 3); const g = uid(); const rot = i * 45;
    s.push(shape(`hc-leaf-${i}`, `Wellness Leaf ${i + 1}`, 'organic', ind, ['leaf', 'wellness', 'natural', 'green'],
      gradSvg(g, c, `<path d="M15 85 C15 85, 15 25, 75 10 C75 10, 90 65, 30 85 Z" fill="url(#${g})" transform="rotate(${rot} 50 50)"/><path d="M15 85 Q45 55, 75 10" fill="none" stroke="white" stroke-width="1.5" opacity="0.3" transform="rotate(${rot} 50 50)"/>`)));
  }

  return s;
}

// ─── FINANCE (50) ──────────────────────────────────────
function genFinance(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'finance';

  // Chart lines (10)
  for (let i = 0; i < 10; i++) {
    const c = p(i); const g = uid();
    const pts = Array.from({ length: 6 }, (_, j) => `${10 + j * 24},${70 - (Math.sin(j * 1.2 + i * 0.5) * 30 + 15)}`).join(' ');
    s.push(shape(`fin-chart-${i}`, `Chart Line ${i + 1}`, 'icons', ind, ['chart', 'graph', 'stocks', 'trading'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 80" width="140" height="80"><defs><linearGradient id="${g}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c[0]}" stop-opacity="0.1"/><stop offset="100%" stop-color="${c[0]}" stop-opacity="0.4"/></linearGradient></defs><polyline points="${pts}" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><polygon points="${pts} 130,75 10,75" fill="url(#${g})"/></svg>`));
  }

  // Coins (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 4); const g = uid();
    s.push(shape(`fin-coin-${i}`, `Coin ${i + 1}`, 'icons', ind, ['coin', 'money', 'currency', 'gold'],
      gradSvg(g, c, `<circle cx="50" cy="50" r="38" fill="url(#${g})"/><circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/><text x="50" y="58" text-anchor="middle" font-size="24" fill="white" opacity="0.8" font-family="serif">${['$', '€', '£', '¥', '₿', '₹', '₩', '₣'][i]}</text>`)));
  }

  // Bar charts (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i);
    const bars = Array.from({ length: 5 }, (_, j) => {
      const h = 20 + ((j * 13 + i * 7) % 45);
      return `<rect x="${10 + j * 20}" y="${75 - h}" width="14" height="${h}" rx="2" fill="${c[j % 2]}" opacity="${0.5 + j * 0.1}"/>`;
    }).join('');
    s.push(shape(`fin-bar-${i}`, `Bar Chart ${i + 1}`, 'icons', ind, ['bar', 'chart', 'analytics', 'report'], `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">${bars}<line x1="5" y1="75" x2="115" y2="75" stroke="${c[0]}" stroke-width="1" opacity="0.3"/></svg>`));
  }

  // Pie charts (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i); const c2 = p(i + 4);
    const angle = 90 + i * 30;
    const rad = angle * Math.PI / 180;
    s.push(shape(`fin-pie-${i}`, `Pie Chart ${i + 1}`, 'icons', ind, ['pie', 'chart', 'distribution', 'share'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="38" fill="${c2[0]}" opacity="0.3"/><path d="M50 50 L50 12 A38 38 0 ${angle > 180 ? 1 : 0} 1 ${50 + 38 * Math.sin(rad)} ${50 - 38 * Math.cos(rad)} Z" fill="${c[0]}" opacity="0.8"/></svg>`));
  }

  // Safes/vaults (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i);
    s.push(shape(`fin-vault-${i}`, `Vault ${i + 1}`, 'icons', ind, ['vault', 'safe', 'security', 'bank'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="12" y="12" width="76" height="76" rx="6" fill="${c[0]}" opacity="0.15" stroke="${c[0]}" stroke-width="2"/><circle cx="50" cy="50" r="22" fill="none" stroke="${c[0]}" stroke-width="2.5"/><circle cx="50" cy="50" r="15" fill="none" stroke="${c[1]}" stroke-width="1" stroke-dasharray="3 2"/><circle cx="50" cy="50" r="4" fill="${c[0]}"/></svg>`));
  }

  // Arrows up/down (6)
  for (let i = 0; i < 6; i++) {
    const c = i % 2 === 0 ? p(3) : p(5);
    const dir = i % 2 === 0 ? 'up' : 'down';
    const rot = dir === 'down' ? 180 : 0;
    s.push(shape(`fin-arrow-${i}`, `Market ${dir === 'up' ? 'Up' : 'Down'} ${Math.floor(i / 2) + 1}`, 'minimal', ind, ['arrow', dir, 'market', 'trend'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80" width="60" height="80"><g transform="rotate(${rot} 30 40)"><polygon points="30,8 50,35 40,35 40,72 20,72 20,35 10,35" fill="${c[0]}" opacity="0.8"/></g></svg>`));
  }

  // Dollar signs (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 3); const g = uid();
    s.push(shape(`fin-dollar-${i}`, `Dollar Sign ${i + 1}`, 'decorative', ind, ['dollar', 'money', 'currency', 'finance'],
      gradSvg(g, c, `<circle cx="50" cy="50" r="40" fill="url(#${g})" opacity="0.15"/><text x="50" y="65" text-anchor="middle" font-size="45" fill="${c[0]}" font-weight="bold" font-family="sans-serif">$</text>`)));
  }

  // Wallet (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i);
    s.push(shape(`fin-wallet-${i}`, `Wallet ${i + 1}`, 'icons', ind, ['wallet', 'payment', 'money', 'billfold'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><rect x="10" y="15" width="100" height="55" rx="8" fill="${c[0]}" opacity="0.2" stroke="${c[0]}" stroke-width="2"/><rect x="70" y="30" width="40" height="25" rx="5" fill="${c[0]}" opacity="0.3"/><circle cx="85" cy="42" r="5" fill="${c[1]}"/></svg>`));
  }

  return s;
}

// ─── HOSPITALITY (50) ──────────────────────────────────────
function genHospitality(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'hospitality';

  // Suns (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 4);
    const rays = Array.from({ length: 8 + i }, (_, j) => {
      const a = (j * 360) / (8 + i) * Math.PI / 180;
      return `<line x1="${50 + 22 * Math.cos(a)}" y1="${50 + 22 * Math.sin(a)}" x2="${50 + 38 * Math.cos(a)}" y2="${50 + 38 * Math.sin(a)}" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/>`;
    }).join('');
    s.push(shape(`hosp-sun-${i}`, `Sun ${i + 1}`, 'organic', ind, ['sun', 'sunshine', 'warm', 'tropical'], `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${rays}<circle cx="50" cy="50" r="18" fill="${c[1]}"/></svg>`));
  }

  // Mountains (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i); const g = uid();
    const peak = 10 + i * 3;
    s.push(shape(`hosp-mount-${i}`, `Mountain ${i + 1}`, 'decorative', ind, ['mountain', 'peak', 'outdoor', 'adventure'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 80" width="150" height="80"><defs><linearGradient id="${g}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><polygon points="75,${peak} 135,75 15,75" fill="url(#${g})"/><polygon points="68,${peak + 5} 75,${peak} 82,${peak + 5}" fill="white" opacity="0.5"/></svg>`));
  }

  // Waves (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 2); const g = uid();
    const amp = 8 + i * 2;
    s.push(shape(`hosp-wave-${i}`, `Ocean Wave ${i + 1}`, 'organic', ind, ['wave', 'ocean', 'beach', 'water'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 60" width="160" height="60"><defs><linearGradient id="${g}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><path d="M0 30 Q20 ${30 - amp}, 40 30 T80 30 T120 30 T160 30 L160 60 L0 60 Z" fill="url(#${g})" opacity="0.7"/></svg>`));
  }

  // Palm trees (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 3);
    s.push(shape(`hosp-palm-${i}`, `Palm Tree ${i + 1}`, 'decorative', ind, ['palm', 'tropical', 'beach', 'resort'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><path d="M40 95 L40 40" stroke="#8B6914" stroke-width="4" stroke-linecap="round"/><path d="M40 40 Q20 25, 5 30" fill="none" stroke="${c[0]}" stroke-width="3" stroke-linecap="round"/><path d="M40 40 Q60 25, 75 30" fill="none" stroke="${c[0]}" stroke-width="3" stroke-linecap="round"/><path d="M40 40 Q30 15, 15 10" fill="none" stroke="${c[1]}" stroke-width="3" stroke-linecap="round"/><path d="M40 40 Q50 15, 65 10" fill="none" stroke="${c[1]}" stroke-width="3" stroke-linecap="round"/><path d="M40 40 Q40 10, 40 5" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/></svg>`));
  }

  // Compasses (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    s.push(shape(`hosp-compass-${i}`, `Compass ${i + 1}`, 'decorative', ind, ['compass', 'navigation', 'explore', 'direction'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="none" stroke="${c[0]}" stroke-width="2"/><polygon points="50,15 55,45 50,50 45,45" fill="${c[0]}"/><polygon points="50,85 45,55 50,50 55,55" fill="${c[1]}" opacity="0.5"/><circle cx="50" cy="50" r="3" fill="${c[0]}"/></svg>`));
  }

  // Stars (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 4);
    const pts = 5 + i;
    const starPts = Array.from({ length: pts * 2 }, (_, j) => {
      const a = (j * Math.PI) / pts - Math.PI / 2;
      const r = j % 2 === 0 ? 40 : 18;
      return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
    }).join(' ');
    s.push(shape(`hosp-star-${i}`, `Rating Star ${i + 1}`, 'geometric', ind, ['star', 'rating', 'review', 'award'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="${starPts}" fill="${c[0]}"/></svg>`));
  }

  // Planes (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i); const rot = i * 45;
    s.push(shape(`hosp-plane-${i}`, `Airplane ${i + 1}`, 'icons', ind, ['plane', 'flight', 'travel', 'aviation'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g transform="rotate(${rot} 50 50)"><polygon points="50,10 60,45 90,50 60,55 50,90 40,55 10,50 40,45" fill="${c[0]}" opacity="0.8"/></g></svg>`));
  }

  // Luggage (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 1);
    s.push(shape(`hosp-luggage-${i}`, `Luggage ${i + 1}`, 'icons', ind, ['luggage', 'suitcase', 'travel', 'bag'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><rect x="15" y="30" width="50" height="55" rx="5" fill="${c[0]}" opacity="0.7"/><rect x="28" y="20" width="24" height="15" rx="3" fill="none" stroke="${c[0]}" stroke-width="2.5"/><line x1="15" y1="50" x2="65" y2="50" stroke="${c[1]}" stroke-width="1.5" opacity="0.4"/></svg>`));
  }

  return s;
}

// ─── EDUCATION (50) ──────────────────────────────────────
function genEducation(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'education';

  // Books (10)
  for (let i = 0; i < 10; i++) {
    const c = p(i); const g = uid();
    s.push(shape(`edu-book-${i}`, `Book ${i + 1}`, 'icons', ind, ['book', 'reading', 'library', 'knowledge'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80"><defs><linearGradient id="${g}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><path d="M50 15 C35 10, 10 8, 8 12 L8 68 C10 65, 35 63, 50 68" fill="url(#${g})" opacity="0.3"/><path d="M50 15 C65 10, 90 8, 92 12 L92 68 C90 65, 65 63, 50 68" fill="url(#${g})" opacity="0.4"/><line x1="50" y1="15" x2="50" y2="68" stroke="${c[0]}" stroke-width="1.5"/></svg>`));
  }

  // Graduation caps (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    s.push(shape(`edu-cap-${i}`, `Grad Cap ${i + 1}`, 'icons', ind, ['graduation', 'cap', 'degree', 'academic'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><polygon points="60,12 110,32 60,52 10,32" fill="${c[0]}"/><path d="M28 36 L28 55 C28 55, 44 65, 60 65 C76 65, 92 55, 92 55 L92 36" fill="none" stroke="${c[0]}" stroke-width="2"/><line x1="110" y1="32" x2="110" y2="58" stroke="${c[1]}" stroke-width="2.5"/><circle cx="110" cy="60" r="3" fill="${c[1]}"/></svg>`));
  }

  // Lightbulbs (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 4); const g = uid();
    s.push(shape(`edu-bulb-${i}`, `Idea Bulb ${i + 1}`, 'icons', ind, ['lightbulb', 'idea', 'innovation', 'creativity'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><defs><radialGradient id="${g}" cx="50%" cy="35%"><stop offset="0%" stop-color="${c[1]}"/><stop offset="100%" stop-color="${c[0]}"/></radialGradient></defs><circle cx="40" cy="36" r="24" fill="url(#${g})"/><path d="M30 54 L30 70 L50 70 L50 54" fill="${c[0]}" opacity="0.5"/><rect x="32" y="72" width="16" height="4" rx="2" fill="${c[0]}" opacity="0.4"/><rect x="34" y="78" width="12" height="3" rx="1.5" fill="${c[0]}" opacity="0.3"/></svg>`));
  }

  // Pencils (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i); const rot = -45 + i * 15;
    s.push(shape(`edu-pencil-${i}`, `Pencil ${i + 1}`, 'icons', ind, ['pencil', 'writing', 'draw', 'edit'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g transform="rotate(${rot} 50 50)"><rect x="42" y="10" width="16" height="60" rx="2" fill="${c[0]}"/><polygon points="42,70 58,70 50,85" fill="${c[1]}"/><rect x="42" y="10" width="16" height="8" fill="${c[0]}" opacity="0.3"/></g></svg>`));
  }

  // Atoms (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 2);
    const orbits = Array.from({ length: 3 }, (_, j) => `<ellipse cx="50" cy="50" rx="35" ry="12" fill="none" stroke="${c[0]}" stroke-width="1.5" opacity="0.5" transform="rotate(${j * 60} 50 50)"/>`).join('');
    s.push(shape(`edu-atom-${i}`, `Atom ${i + 1}`, 'abstract', ind, ['atom', 'science', 'physics', 'electron'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${orbits}<circle cx="50" cy="50" r="6" fill="${c[0]}"/></svg>`));
  }

  // Globes (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    s.push(shape(`edu-globe-${i}`, `Globe ${i + 1}`, 'icons', ind, ['globe', 'world', 'geography', 'earth'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="38" fill="${c[0]}" opacity="0.15" stroke="${c[0]}" stroke-width="2"/><ellipse cx="50" cy="50" rx="20" ry="38" fill="none" stroke="${c[0]}" stroke-width="1.5" opacity="0.5"/><line x1="12" y1="50" x2="88" y2="50" stroke="${c[0]}" stroke-width="1" opacity="0.4"/><ellipse cx="50" cy="35" rx="30" ry="8" fill="none" stroke="${c[0]}" stroke-width="1" opacity="0.3"/></svg>`));
  }

  // Rulers (5)
  for (let i = 0; i < 5; i++) {
    const c = p(i + 1);
    const ticks = Array.from({ length: 10 }, (_, j) => `<line x1="${10 + j * 16}" y1="10" x2="${10 + j * 16}" y2="${j % 5 === 0 ? 30 : 20}" stroke="${c[0]}" stroke-width="1.5"/>`).join('');
    s.push(shape(`edu-ruler-${i}`, `Ruler ${i + 1}`, 'icons', ind, ['ruler', 'measure', 'tool', 'math'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 50" width="170" height="50"><rect x="3" y="5" width="164" height="40" rx="3" fill="${c[0]}" opacity="0.1" stroke="${c[0]}" stroke-width="1.5"/>${ticks}</svg>`));
  }

  // Microscopes (5)
  for (let i = 0; i < 5; i++) {
    const c = p(i + 2);
    s.push(shape(`edu-scope-${i}`, `Microscope ${i + 1}`, 'icons', ind, ['microscope', 'science', 'lab', 'research'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><rect x="35" y="20" width="12" height="50" rx="3" fill="${c[0]}" opacity="0.7"/><circle cx="41" cy="18" r="10" fill="none" stroke="${c[0]}" stroke-width="2.5"/><rect x="20" y="75" width="42" height="6" rx="3" fill="${c[0]}"/><rect x="15" y="82" width="52" height="4" rx="2" fill="${c[1]}" opacity="0.5"/></svg>`));
  }

  return s;
}

// ─── RETAIL (50) ──────────────────────────────────────
function genRetail(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'retail';

  // Shopping bags (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i); const g = uid();
    s.push(shape(`ret-bag-${i}`, `Shopping Bag ${i + 1}`, 'icons', ind, ['bag', 'shopping', 'retail', 'store'],
      gradSvg(g, c, `<rect x="15" y="35" width="70" height="55" rx="4" fill="url(#${g})" opacity="0.7"/><path d="M30 35 C30 18, 35 12, 50 12 C65 12, 70 18, 70 35" fill="none" stroke="${c[0]}" stroke-width="3" stroke-linecap="round"/>`)));
  }

  // Price tags (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 4); const g = uid(); const rot = i * 10;
    s.push(shape(`ret-tag-${i}`, `Price Tag ${i + 1}`, 'icons', ind, ['tag', 'price', 'sale', 'discount'],
      gradSvg(g, c, `<path d="M12 50 L12 18 C12 12, 16 8, 22 8 L55 8 L92 45 L55 92 L12 50 Z" fill="url(#${g})" opacity="0.7" transform="rotate(${rot} 50 50)"/><circle cx="30" cy="28" r="5" fill="white" opacity="0.7"/>`)));
  }

  // Carts (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    s.push(shape(`ret-cart-${i}`, `Cart ${i + 1}`, 'icons', ind, ['cart', 'shopping', 'checkout', 'buy'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80"><path d="M10 15 L20 15 L35 55 L75 55 L85 25 L28 25" fill="none" stroke="${c[0]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="65" r="5" fill="${c[0]}"/><circle cx="70" cy="65" r="5" fill="${c[0]}"/></svg>`));
  }

  // Boxes/packages (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 2); const g = uid();
    s.push(shape(`ret-box-${i}`, `Package ${i + 1}`, 'icons', ind, ['box', 'package', 'delivery', 'shipping'],
      gradSvg(g, c, `<rect x="15" y="25" width="70" height="60" rx="3" fill="url(#${g})" opacity="0.6"/><polygon points="15,25 50,10 85,25 50,40" fill="url(#${g})" opacity="0.8"/><line x1="50" y1="40" x2="50" y2="85" stroke="${c[1]}" stroke-width="1" opacity="0.4"/>`)));
  }

  // Percent symbols (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 5);
    s.push(shape(`ret-pct-${i}`, `Discount ${i + 1}`, 'decorative', ind, ['percent', 'discount', 'sale', 'offer'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="42" fill="${c[0]}" opacity="0.12"/><circle cx="35" cy="35" r="10" fill="none" stroke="${c[0]}" stroke-width="3"/><circle cx="65" cy="65" r="10" fill="none" stroke="${c[0]}" stroke-width="3"/><line x1="70" y1="25" x2="30" y2="75" stroke="${c[0]}" stroke-width="3" stroke-linecap="round"/></svg>`));
  }

  // Stars/ratings (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 4);
    const filled = 1 + i % 5;
    const stars = Array.from({ length: 5 }, (_, j) => `<polygon points="${10 + j * 18},20 ${13 + j * 18},14 ${16 + j * 18},8 ${19 + j * 18},14 ${22 + j * 18},20 ${18 + j * 18},24 ${20 + j * 18},32 ${16 + j * 18},27 ${12 + j * 18},32 ${14 + j * 18},24" fill="${j < filled ? c[0] : c[0]}" opacity="${j < filled ? 0.9 : 0.2}"/>`).join('');
    s.push(shape(`ret-rating-${i}`, `Rating ${filled} Stars`, 'decorative', ind, ['rating', 'stars', 'review', 'score'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">${stars}</svg>`));
  }

  // Gift boxes (5)
  for (let i = 0; i < 5; i++) {
    const c = p(i + 6);
    s.push(shape(`ret-gift-${i}`, `Gift Box ${i + 1}`, 'icons', ind, ['gift', 'present', 'reward', 'special'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90" width="80" height="90"><rect x="10" y="30" width="60" height="50" rx="3" fill="${c[0]}" opacity="0.6"/><rect x="5" y="22" width="70" height="14" rx="4" fill="${c[0]}" opacity="0.8"/><line x1="40" y1="22" x2="40" y2="80" stroke="${c[1]}" stroke-width="4"/><line x1="5" y1="29" x2="75" y2="29" stroke="${c[1]}" stroke-width="4"/><path d="M40 22 C35 10, 20 8, 22 18" fill="none" stroke="${c[1]}" stroke-width="2.5" stroke-linecap="round"/><path d="M40 22 C45 10, 60 8, 58 18" fill="none" stroke="${c[1]}" stroke-width="2.5" stroke-linecap="round"/></svg>`));
  }

  // Hangers (5)
  for (let i = 0; i < 5; i++) {
    const c = p(i);
    s.push(shape(`ret-hanger-${i}`, `Hanger ${i + 1}`, 'icons', ind, ['hanger', 'clothing', 'fashion', 'wardrobe'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80"><path d="M50 20 C50 12, 55 8, 55 8" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/><circle cx="55" cy="6" r="3" fill="none" stroke="${c[0]}" stroke-width="2"/><path d="M50 20 L10 55 L90 55 Z" fill="none" stroke="${c[0]}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>`));
  }

  return s;
}

// ─── REAL ESTATE (50) ──────────────────────────────────────
function genRealEstate(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'realestate';

  // Houses (10)
  for (let i = 0; i < 10; i++) {
    const c = p(i); const g = uid();
    const roofPeak = 10 + i * 2;
    s.push(shape(`re-house-${i}`, `House ${i + 1}`, 'icons', ind, ['house', 'home', 'property', 'residential'],
      gradSvg(g, c, `<polygon points="50,${roofPeak} 90,45 90,90 10,90 10,45" fill="url(#${g})"/><rect x="38" y="58" width="24" height="32" rx="2" fill="white" opacity="0.3"/><rect x="18" y="52" width="14" height="14" rx="1" fill="white" opacity="0.2"/><rect x="68" y="52" width="14" height="14" rx="1" fill="white" opacity="0.2"/>`)));
  }

  // Keys (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 4); const rot = i * 30;
    s.push(shape(`re-key-${i}`, `Key ${i + 1}`, 'icons', ind, ['key', 'unlock', 'ownership', 'access'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g transform="rotate(${rot} 50 50)"><circle cx="35" cy="35" r="16" fill="none" stroke="${c[0]}" stroke-width="4"/><circle cx="35" cy="35" r="6" fill="${c[0]}" opacity="0.3"/><line x1="51" y1="35" x2="85" y2="69" stroke="${c[0]}" stroke-width="4" stroke-linecap="round"/><line x1="75" y1="59" x2="82" y2="52" stroke="${c[0]}" stroke-width="4" stroke-linecap="round"/></g></svg>`));
  }

  // Buildings/skylines (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i); const g = uid();
    const buildings = Array.from({ length: 3 + i % 3 }, (_, j) => {
      const x = 8 + j * 22; const h = 30 + ((j * 17 + i * 11) % 40);
      return `<rect x="${x}" y="${85 - h}" width="18" height="${h}" rx="2" fill="url(#${g})" opacity="${0.5 + j * 0.15}"/>`;
    }).join('');
    s.push(shape(`re-skyline-${i}`, `Skyline ${i + 1}`, 'decorative', ind, ['skyline', 'city', 'urban', 'buildings'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="120" height="90"><defs><linearGradient id="${g}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs>${buildings}</svg>`));
  }

  // Rooftops (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 2);
    s.push(shape(`re-roof-${i}`, `Rooftop ${i + 1}`, 'geometric', ind, ['roof', 'house', 'shelter', 'cover'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" width="120" height="60"><polygon points="60,8 110,50 10,50" fill="${c[0]}" opacity="0.7"/><rect x="20" y="50" width="80" height="6" fill="${c[1]}" opacity="0.4"/></svg>`));
  }

  // Floor plans (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    s.push(shape(`re-floor-${i}`, `Floor Plan ${i + 1}`, 'abstract', ind, ['floorplan', 'layout', 'blueprint', 'architecture'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="10" y="10" width="80" height="80" fill="none" stroke="${c[0]}" stroke-width="2"/><line x1="50" y1="10" x2="50" y2="60" stroke="${c[0]}" stroke-width="1.5"/><line x1="10" y1="60" x2="90" y2="60" stroke="${c[0]}" stroke-width="1.5"/><rect x="55" y="65" width="12" height="20" fill="none" stroke="${c[1]}" stroke-width="1" opacity="0.5"/></svg>`));
  }

  // Trees (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 3);
    s.push(shape(`re-tree-${i}`, `Landscape Tree ${i + 1}`, 'organic', ind, ['tree', 'landscape', 'garden', 'nature'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><rect x="35" y="65" width="10" height="25" fill="#8B6914" opacity="0.7"/><circle cx="40" cy="45" r="${18 + i * 2}" fill="${c[0]}" opacity="0.7"/><circle cx="30" cy="50" r="${12 + i}" fill="${c[1]}" opacity="0.5"/></svg>`));
  }

  // Pin/location markers (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 5); const g = uid();
    s.push(shape(`re-pin-${i}`, `Location Pin ${i + 1}`, 'icons', ind, ['pin', 'location', 'map', 'marker'],
      gradSvg(g, c, `<path d="M50 90 C50 90, 15 55, 15 35 C15 16, 30 5, 50 5 C70 5, 85 16, 85 35 C85 55, 50 90, 50 90 Z" fill="url(#${g})" opacity="0.8"/><circle cx="50" cy="35" r="12" fill="white" opacity="0.7"/>`)));
  }

  return s;
}

// ─── FOOD & BEVERAGE (50) ──────────────────────────────────
function genFood(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'food';

  // Plates (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i);
    s.push(shape(`food-plate-${i}`, `Plate ${i + 1}`, 'icons', ind, ['plate', 'dish', 'dining', 'restaurant'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="42" fill="${c[0]}" opacity="0.1" stroke="${c[0]}" stroke-width="2"/><circle cx="50" cy="50" r="32" fill="none" stroke="${c[0]}" stroke-width="1" opacity="0.4"/><circle cx="50" cy="50" r="5" fill="${c[1]}" opacity="0.3"/></svg>`));
  }

  // Cups (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 8);
    s.push(shape(`food-cup-${i}`, `Cup ${i + 1}`, 'icons', ind, ['cup', 'coffee', 'tea', 'beverage'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90" width="80" height="90"><path d="M15 20 L22 80 L58 80 L65 20 Z" fill="${c[0]}" opacity="0.6"/><path d="M65 30 C80 30, 82 50, 65 55" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/><path d="M30 10 Q32 5, 35 10" fill="none" stroke="${c[1]}" stroke-width="1.5" opacity="0.5"/><path d="M40 8 Q42 2, 45 8" fill="none" stroke="${c[1]}" stroke-width="1.5" opacity="0.5"/></svg>`));
  }

  // Forks/spoons (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 9); const rot = -20 + i * 8;
    s.push(shape(`food-utensil-${i}`, `Utensil ${i + 1}`, 'icons', ind, ['fork', 'spoon', 'cutlery', 'dining'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100" width="60" height="100"><g transform="rotate(${rot} 30 50)"><line x1="22" y1="12" x2="22" y2="28" stroke="${c[0]}" stroke-width="2" stroke-linecap="round"/><line x1="30" y1="12" x2="30" y2="28" stroke="${c[0]}" stroke-width="2" stroke-linecap="round"/><line x1="38" y1="12" x2="38" y2="28" stroke="${c[0]}" stroke-width="2" stroke-linecap="round"/><rect x="27" y="28" width="6" height="55" rx="3" fill="${c[0]}" opacity="0.7"/></g></svg>`));
  }

  // Fruits (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 3);
    const shapes_fruits = ['circle', 'oval', 'pear'];
    const type = shapes_fruits[i % 3];
    let inner: string;
    if (type === 'circle') inner = `<circle cx="50" cy="55" r="${25 + i}" fill="${c[0]}" opacity="0.7"/><path d="M50 30 Q55 20, 52 15" fill="none" stroke="#4a7" stroke-width="2"/>`;
    else if (type === 'oval') inner = `<ellipse cx="50" cy="55" rx="${20 + i}" ry="${28 + i}" fill="${c[0]}" opacity="0.7"/>`;
    else inner = `<path d="M50 20 C35 35, 28 55, 32 70 C36 85, 50 90, 50 90 C50 90, 64 85, 68 70 C72 55, 65 35, 50 20 Z" fill="${c[0]}" opacity="0.7"/>`;
    s.push(shape(`food-fruit-${i}`, `Fruit ${i + 1}`, 'organic', ind, ['fruit', 'natural', 'fresh', 'organic'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${inner}</svg>`));
  }

  // Chef hats (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i);
    s.push(shape(`food-hat-${i}`, `Chef Hat ${i + 1}`, 'icons', ind, ['chef', 'hat', 'cook', 'kitchen'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90" width="80" height="90"><circle cx="25" cy="30" r="15" fill="${c[0]}" opacity="0.3"/><circle cx="40" cy="22" r="18" fill="${c[0]}" opacity="0.4"/><circle cx="55" cy="30" r="15" fill="${c[0]}" opacity="0.3"/><rect x="18" y="40" width="44" height="35" fill="${c[0]}" opacity="0.25"/><rect x="18" y="72" width="44" height="6" rx="2" fill="${c[0]}" opacity="0.5"/></svg>`));
  }

  // Wine glasses (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 5);
    s.push(shape(`food-wine-${i}`, `Wine Glass ${i + 1}`, 'icons', ind, ['wine', 'glass', 'drink', 'bar'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100" width="60" height="100"><path d="M15 10 L15 35 C15 50, 30 55, 30 55 L30 80" fill="none" stroke="${c[0]}" stroke-width="2"/><path d="M45 10 L45 35 C45 50, 30 55, 30 55" fill="none" stroke="${c[0]}" stroke-width="2"/><line x1="18" y1="80" x2="42" y2="80" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/><path d="M15 35 L45 35" stroke="${c[1]}" stroke-width="1" opacity="0.3"/></svg>`));
  }

  // Leaves/organic labels (5)
  for (let i = 0; i < 5; i++) {
    const c = p(i + 3); const g = uid();
    s.push(shape(`food-leaf-${i}`, `Organic Leaf ${i + 1}`, 'organic', ind, ['leaf', 'organic', 'natural', 'eco'],
      gradSvg(g, c, `<path d="M50 90 C40 70, 10 50, 15 25 C20 10, 40 5, 50 10 C60 5, 80 10, 85 25 C90 50, 60 70, 50 90 Z" fill="url(#${g})" opacity="0.6"/><path d="M50 90 Q45 55, 50 10" fill="none" stroke="white" stroke-width="1.5" opacity="0.3"/>`)));
  }

  // Pizza slices (5)
  for (let i = 0; i < 5; i++) {
    const c = p(i + 4); const rot = i * 20;
    s.push(shape(`food-pizza-${i}`, `Pizza Slice ${i + 1}`, 'icons', ind, ['pizza', 'food', 'slice', 'italian'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g transform="rotate(${rot} 50 50)"><path d="M50 15 L80 85 L20 85 Z" fill="${c[0]}" opacity="0.7"/><path d="M50 15 L80 85 A35 35 0 0 1 20 85 Z" fill="${c[1]}" opacity="0.3"/><circle cx="45" cy="50" r="4" fill="${c[0]}" opacity="0.5"/><circle cx="55" cy="65" r="3" fill="${c[0]}" opacity="0.5"/></g></svg>`));
  }

  return s;
}

// ─── SPORTS (50) ──────────────────────────────────────
function genSports(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'sports';

  // Balls (10)
  for (let i = 0; i < 10; i++) {
    const c = p(i); const g = uid();
    s.push(shape(`sport-ball-${i}`, `Sports Ball ${i + 1}`, 'icons', ind, ['ball', 'sport', 'game', 'play'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="${g}" cx="35%" cy="35%"><stop offset="0%" stop-color="${c[1]}"/><stop offset="100%" stop-color="${c[0]}"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="url(#${g})"/><path d="M20 30 Q50 45, 80 30" fill="none" stroke="white" stroke-width="1.5" opacity="0.3"/></svg>`));
  }

  // Trophies (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 4); const g = uid();
    s.push(shape(`sport-trophy-${i}`, `Trophy ${i + 1}`, 'icons', ind, ['trophy', 'award', 'winner', 'champion'],
      gradSvg(g, c, `<path d="M30 15 L30 45 C30 60, 50 65, 50 65 C50 65, 70 60, 70 45 L70 15 Z" fill="url(#${g})" opacity="0.7"/><path d="M30 25 C15 25, 12 40, 25 45" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/><path d="M70 25 C85 25, 88 40, 75 45" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/><rect x="43" y="65" width="14" height="10" fill="${c[0]}" opacity="0.5"/><rect x="35" y="75" width="30" height="8" rx="2" fill="${c[0]}" opacity="0.6"/>`)));
  }

  // Medals (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 4);
    s.push(shape(`sport-medal-${i}`, `Medal ${i + 1}`, 'badges', ind, ['medal', 'award', 'gold', 'achievement'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><polygon points="25,5 40,35 55,5" fill="${c[0]}" opacity="0.5"/><circle cx="40" cy="55" r="25" fill="${c[0]}" opacity="0.7"/><circle cx="40" cy="55" r="18" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/></svg>`));
  }

  // Targets/bullseyes (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    const rings = Array.from({ length: 3 + i % 2 }, (_, j) => `<circle cx="50" cy="50" r="${40 - j * 10}" fill="${j % 2 === 0 ? c[0] : c[1]}" opacity="${0.3 + j * 0.2}"/>`).join('');
    s.push(shape(`sport-target-${i}`, `Target ${i + 1}`, 'geometric', ind, ['target', 'bullseye', 'aim', 'goal'], `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${rings}</svg>`));
  }

  // Stopwatches (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 2);
    s.push(shape(`sport-timer-${i}`, `Stopwatch ${i + 1}`, 'icons', ind, ['timer', 'stopwatch', 'time', 'race'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><circle cx="40" cy="55" r="32" fill="${c[0]}" opacity="0.15" stroke="${c[0]}" stroke-width="2.5"/><rect x="35" y="15" width="10" height="10" rx="2" fill="${c[0]}" opacity="0.6"/><line x1="40" y1="55" x2="40" y2="35" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/><line x1="40" y1="55" x2="55" y2="60" stroke="${c[1]}" stroke-width="1.5" stroke-linecap="round"/><circle cx="40" cy="55" r="3" fill="${c[0]}"/></svg>`));
  }

  // Lightning bolts (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 4);
    s.push(shape(`sport-bolt-${i}`, `Lightning ${i + 1}`, 'decorative', ind, ['lightning', 'energy', 'power', 'speed'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><polygon points="45,5 15,55 35,55 25,95 65,40 42,40 55,5" fill="${c[0]}" opacity="0.8"/></svg>`));
  }

  // Dumbbells (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i);
    s.push(shape(`sport-dumbbell-${i}`, `Dumbbell ${i + 1}`, 'icons', ind, ['dumbbell', 'fitness', 'gym', 'weight'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 60" width="140" height="60"><rect x="50" y="25" width="40" height="10" rx="3" fill="${c[0]}" opacity="0.6"/><rect x="15" y="12" width="20" height="36" rx="4" fill="${c[0]}" opacity="0.7"/><rect x="105" y="12" width="20" height="36" rx="4" fill="${c[0]}" opacity="0.7"/><rect x="35" y="18" width="15" height="24" rx="3" fill="${c[1]}" opacity="0.5"/><rect x="90" y="18" width="15" height="24" rx="3" fill="${c[1]}" opacity="0.5"/></svg>`));
  }

  // Shields (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 6); const g = uid();
    s.push(shape(`sport-shield-${i}`, `Team Shield ${i + 1}`, 'badges', ind, ['shield', 'team', 'crest', 'emblem'],
      gradSvg(g, c, `<path d="M50 8 L85 22 L85 55 C85 75, 65 90, 50 95 C35 90, 15 75, 15 55 L15 22 Z" fill="url(#${g})" opacity="0.7"/><line x1="50" y1="22" x2="50" y2="88" stroke="white" stroke-width="1" opacity="0.2"/><line x1="15" y1="50" x2="85" y2="50" stroke="white" stroke-width="1" opacity="0.2"/>`)));
  }

  return s;
}

// ─── ENTERTAINMENT (50) ──────────────────────────────────
function genEntertainment(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'entertainment';

  // Play buttons (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i); const g = uid();
    s.push(shape(`ent-play-${i}`, `Play Button ${i + 1}`, 'icons', ind, ['play', 'video', 'media', 'stream'],
      gradSvg(g, c, `<circle cx="50" cy="50" r="40" fill="url(#${g})" opacity="0.2"/><polygon points="38,25 38,75 75,50" fill="url(#${g})" opacity="0.8"/>`)));
  }

  // Film strips (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 2);
    const frames = Array.from({ length: 4 }, (_, j) => `<rect x="${5 + j * 38}" y="18" width="32" height="24" rx="2" fill="${c[0]}" opacity="${0.2 + j * 0.1}"/>`).join('');
    const holes = Array.from({ length: 10 }, (_, j) => `<circle cx="${10 + j * 16}" cy="8" r="3" fill="${c[0]}" opacity="0.3"/><circle cx="${10 + j * 16}" cy="52" r="3" fill="${c[0]}" opacity="0.3"/>`).join('');
    s.push(shape(`ent-film-${i}`, `Film Strip ${i + 1}`, 'decorative', ind, ['film', 'movie', 'cinema', 'strip'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 60" width="160" height="60"><rect x="2" y="2" width="156" height="56" rx="4" fill="none" stroke="${c[0]}" stroke-width="1.5"/>${holes}${frames}</svg>`));
  }

  // Music notes (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 6);
    s.push(shape(`ent-note-${i}`, `Music Note ${i + 1}`, 'icons', ind, ['music', 'note', 'sound', 'audio'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 90" width="60" height="90"><ellipse cx="22" cy="70" rx="12" ry="9" fill="${c[0]}" opacity="0.7" transform="rotate(-15 22 70)"/><line x1="34" y1="68" x2="34" y2="15" stroke="${c[0]}" stroke-width="3"/><path d="M34 15 Q50 10, 48 25" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/></svg>`));
  }

  // Stars/sparkles (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 4);
    s.push(shape(`ent-sparkle-${i}`, `Sparkle ${i + 1}`, 'decorative', ind, ['sparkle', 'star', 'glitter', 'shine'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="50,5 55,40 90,50 55,60 50,95 45,60 10,50 45,40" fill="${c[0]}" opacity="0.7"/><polygon points="25,15 27,23 35,25 27,27 25,35 23,27 15,25 23,23" fill="${c[1]}" opacity="0.5"/><polygon points="80,70 82,76 88,78 82,80 80,86 78,80 72,78 78,76" fill="${c[1]}" opacity="0.5"/></svg>`));
  }

  // Cameras (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    s.push(shape(`ent-camera-${i}`, `Camera ${i + 1}`, 'icons', ind, ['camera', 'photo', 'picture', 'image'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80"><rect x="10" y="22" width="80" height="50" rx="6" fill="${c[0]}" opacity="0.2" stroke="${c[0]}" stroke-width="2"/><path d="M35 22 L40 10 L60 10 L65 22" fill="${c[0]}" opacity="0.3"/><circle cx="50" cy="47" r="15" fill="none" stroke="${c[0]}" stroke-width="2.5"/><circle cx="50" cy="47" r="8" fill="${c[0]}" opacity="0.3"/></svg>`));
  }

  // Microphones (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 7);
    s.push(shape(`ent-mic-${i}`, `Microphone ${i + 1}`, 'icons', ind, ['microphone', 'audio', 'podcast', 'voice'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100" width="60" height="100"><rect x="18" y="10" width="24" height="45" rx="12" fill="${c[0]}" opacity="0.6"/><path d="M12 40 C12 65, 30 72, 30 72" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/><path d="M48 40 C48 65, 30 72, 30 72" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/><line x1="30" y1="72" x2="30" y2="88" stroke="${c[0]}" stroke-width="2.5"/><line x1="20" y1="88" x2="40" y2="88" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/></svg>`));
  }

  // Headphones (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 3);
    s.push(shape(`ent-headphone-${i}`, `Headphones ${i + 1}`, 'icons', ind, ['headphones', 'audio', 'music', 'listen'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90" width="100" height="90"><path d="M20 55 C20 25, 80 25, 80 55" fill="none" stroke="${c[0]}" stroke-width="4" stroke-linecap="round"/><rect x="10" y="50" width="15" height="28" rx="5" fill="${c[0]}" opacity="0.7"/><rect x="75" y="50" width="15" height="28" rx="5" fill="${c[0]}" opacity="0.7"/></svg>`));
  }

  // Tickets (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 8); const g = uid();
    s.push(shape(`ent-ticket-${i}`, `Ticket ${i + 1}`, 'icons', ind, ['ticket', 'event', 'show', 'admission'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 60" width="150" height="60"><defs><linearGradient id="${g}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><rect x="5" y="5" width="140" height="50" rx="6" fill="url(#${g})" opacity="0.2"/><line x1="105" y1="5" x2="105" y2="55" stroke="${c[0]}" stroke-width="1" stroke-dasharray="4 3"/></svg>`));
  }

  return s;
}

// ─── AUTOMOTIVE (50) ──────────────────────────────────────
function genAutomotive(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'automotive';

  // Wheels/tires (10)
  for (let i = 0; i < 10; i++) {
    const c = p(i);
    const spokes = Array.from({ length: 5 + i % 4 }, (_, j) => {
      const a = (j * 360) / (5 + i % 4) * Math.PI / 180;
      return `<line x1="50" y1="50" x2="${50 + 28 * Math.cos(a)}" y2="${50 + 28 * Math.sin(a)}" stroke="${c[0]}" stroke-width="2" opacity="0.5"/>`;
    }).join('');
    s.push(shape(`auto-wheel-${i}`, `Wheel ${i + 1}`, 'geometric', ind, ['wheel', 'tire', 'rim', 'auto'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="none" stroke="${c[0]}" stroke-width="4"/><circle cx="50" cy="50" r="30" fill="none" stroke="${c[0]}" stroke-width="2" opacity="0.5"/>${spokes}<circle cx="50" cy="50" r="8" fill="${c[0]}" opacity="0.6"/></svg>`));
  }

  // Speedometers (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 2);
    const angle = -135 + i * 30;
    s.push(shape(`auto-speed-${i}`, `Speedometer ${i + 1}`, 'icons', ind, ['speed', 'gauge', 'dashboard', 'meter'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M15 75 A40 40 0 1 1 85 75" fill="none" stroke="${c[0]}" stroke-width="4" stroke-linecap="round"/><line x1="50" y1="50" x2="${50 + 30 * Math.cos(angle * Math.PI / 180)}" y2="${50 + 30 * Math.sin(angle * Math.PI / 180)}" stroke="${c[0]}" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="5" fill="${c[0]}"/></svg>`));
  }

  // Gears (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 4);
    const teeth = 6 + i % 4;
    const gearPts = Array.from({ length: teeth * 2 }, (_, j) => {
      const a = (j * Math.PI) / teeth;
      const r = j % 2 === 0 ? 38 : 30;
      return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
    }).join(' ');
    s.push(shape(`auto-gear-${i}`, `Gear ${i + 1}`, 'geometric', ind, ['gear', 'cog', 'engine', 'mechanical'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="${gearPts}" fill="${c[0]}" opacity="0.6"/><circle cx="50" cy="50" r="12" fill="white" opacity="0.5"/></svg>`));
  }

  // Road/highway (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    s.push(shape(`auto-road-${i}`, `Road ${i + 1}`, 'decorative', ind, ['road', 'highway', 'path', 'journey'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="30,100 70,100 55,0 45,0" fill="${c[0]}" opacity="0.3"/><line x1="50" y1="0" x2="50" y2="100" stroke="${c[1]}" stroke-width="2" stroke-dasharray="8 6" opacity="0.6"/></svg>`));
  }

  // Fuel/gas (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 8);
    s.push(shape(`auto-fuel-${i}`, `Fuel Pump ${i + 1}`, 'icons', ind, ['fuel', 'gas', 'pump', 'energy'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><rect x="12" y="20" width="40" height="65" rx="4" fill="${c[0]}" opacity="0.6"/><rect x="20" y="30" width="24" height="18" rx="2" fill="${c[1]}" opacity="0.3"/><path d="M52 30 L62 30 L62 55 L55 55" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/><rect x="12" y="85" width="40" height="5" rx="2" fill="${c[0]}" opacity="0.4"/></svg>`));
  }

  // Shields/emblems (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 1); const g = uid();
    s.push(shape(`auto-emblem-${i}`, `Auto Emblem ${i + 1}`, 'badges', ind, ['emblem', 'badge', 'brand', 'crest'],
      gradSvg(g, c, `<path d="M50 5 L90 20 L90 55 C90 80, 65 95, 50 100 C35 95, 10 80, 10 55 L10 20 Z" fill="url(#${g})" opacity="0.5"/><circle cx="50" cy="50" r="18" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/>`)));
  }

  // Steering wheels (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 3);
    s.push(shape(`auto-steering-${i}`, `Steering Wheel ${i + 1}`, 'icons', ind, ['steering', 'wheel', 'drive', 'control'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="38" fill="none" stroke="${c[0]}" stroke-width="5"/><circle cx="50" cy="50" r="10" fill="${c[0]}" opacity="0.4"/><line x1="50" y1="12" x2="50" y2="40" stroke="${c[0]}" stroke-width="3"/><line x1="15" y1="65" x2="40" y2="55" stroke="${c[0]}" stroke-width="3"/><line x1="85" y1="65" x2="60" y2="55" stroke="${c[0]}" stroke-width="3"/></svg>`));
  }

  // Pistons (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 6);
    s.push(shape(`auto-piston-${i}`, `Piston ${i + 1}`, 'icons', ind, ['piston', 'engine', 'power', 'mechanical'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100" width="60" height="100"><rect x="10" y="50" width="40" height="35" rx="3" fill="${c[0]}" opacity="0.6"/><rect x="15" y="40" width="30" height="15" rx="2" fill="${c[0]}" opacity="0.4"/><line x1="30" y1="40" x2="30" y2="15" stroke="${c[0]}" stroke-width="4" stroke-linecap="round"/><circle cx="30" cy="12" r="6" fill="none" stroke="${c[0]}" stroke-width="2.5"/></svg>`));
  }

  return s;
}

// ─── ENERGY (50) ──────────────────────────────────────
function genEnergy(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'energy';

  // Solar panels (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 2);
    const cells = Array.from({ length: 9 }, (_, j) => {
      const x = 12 + (j % 3) * 26; const y = 12 + Math.floor(j / 3) * 22;
      return `<rect x="${x}" y="${y}" width="22" height="18" rx="1" fill="${c[0]}" opacity="${0.3 + (j % 3) * 0.15}" stroke="${c[1]}" stroke-width="0.5"/>`;
    }).join('');
    s.push(shape(`nrg-solar-${i}`, `Solar Panel ${i + 1}`, 'icons', ind, ['solar', 'panel', 'renewable', 'sun'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80"><rect x="8" y="8" width="84" height="64" rx="3" fill="${c[0]}" opacity="0.1" stroke="${c[0]}" stroke-width="1.5"/>${cells}</svg>`));
  }

  // Wind turbines (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 3);
    s.push(shape(`nrg-wind-${i}`, `Wind Turbine ${i + 1}`, 'icons', ind, ['wind', 'turbine', 'renewable', 'green'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><line x1="40" y1="35" x2="40" y2="95" stroke="${c[0]}" stroke-width="3"/><path d="M40 35 L38 5 L42 5 Z" fill="${c[0]}" opacity="0.7"/><path d="M40 35 L60 55 L58 58 Z" fill="${c[0]}" opacity="0.6" transform="rotate(0 40 35)"/><path d="M40 35 L20 55 L22 58 Z" fill="${c[0]}" opacity="0.5" transform="rotate(0 40 35)"/><circle cx="40" cy="35" r="4" fill="${c[1]}"/></svg>`));
  }

  // Lightning bolts (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 4);
    s.push(shape(`nrg-bolt-${i}`, `Energy Bolt ${i + 1}`, 'decorative', ind, ['lightning', 'bolt', 'power', 'electricity'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><polygon points="${42 + i},5 ${12 + i},52 ${32 + i},52 ${22 + i},95 ${68 - i},42 ${45 - i},42 ${58 - i},5" fill="${c[0]}" opacity="0.8"/></svg>`));
  }

  // Leaves/green (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 3); const g = uid();
    s.push(shape(`nrg-leaf-${i}`, `Eco Leaf ${i + 1}`, 'organic', ind, ['leaf', 'eco', 'green', 'sustainable'],
      gradSvg(g, c, `<path d="M50 85 C35 65, 10 45, 18 22 C25 8, 45 5, 50 12 C55 5, 75 8, 82 22 C90 45, 65 65, 50 85 Z" fill="url(#${g})" opacity="0.6"/>`)));
  }

  // Recycle symbols (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 3);
    s.push(shape(`nrg-recycle-${i}`, `Recycle ${i + 1}`, 'icons', ind, ['recycle', 'reuse', 'circular', 'green'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 15 L65 40 L50 35 L35 40 Z" fill="${c[0]}" opacity="0.7"/><path d="M25 70 L35 40 L50 55 L40 55 Z" fill="${c[0]}" opacity="0.6" transform="rotate(120 50 50)"/><path d="M75 70 L65 40 L50 55 L60 55 Z" fill="${c[0]}" opacity="0.5" transform="rotate(240 50 50)"/></svg>`));
  }

  // Batteries (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i); const pct = 20 + i * 15;
    s.push(shape(`nrg-battery-${i}`, `Battery ${pct}%`, 'icons', ind, ['battery', 'charge', 'power', 'energy'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100" width="60" height="100"><rect x="10" y="15" width="40" height="75" rx="4" fill="none" stroke="${c[0]}" stroke-width="2.5"/><rect x="22" y="8" width="16" height="8" rx="2" fill="${c[0]}" opacity="0.5"/><rect x="15" y="${90 - pct * 0.7}" width="30" height="${pct * 0.7}" rx="2" fill="${c[0]}" opacity="0.6"/></svg>`));
  }

  // Suns (5)
  for (let i = 0; i < 5; i++) {
    const c = p(i + 4);
    const rays = Array.from({ length: 8 }, (_, j) => {
      const a = j * 45 * Math.PI / 180;
      return `<line x1="${50 + 22 * Math.cos(a)}" y1="${50 + 22 * Math.sin(a)}" x2="${50 + 35 * Math.cos(a)}" y2="${50 + 35 * Math.sin(a)}" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/>`;
    }).join('');
    s.push(shape(`nrg-sun-${i}`, `Solar Sun ${i + 1}`, 'organic', ind, ['sun', 'solar', 'light', 'radiant'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${rays}<circle cx="50" cy="50" r="18" fill="${c[1]}" opacity="0.7"/></svg>`));
  }

  // Water drops (5)
  for (let i = 0; i < 5; i++) {
    const c = p(i + 2); const g = uid();
    s.push(shape(`nrg-drop-${i}`, `Water Drop ${i + 1}`, 'organic', ind, ['water', 'hydro', 'drop', 'clean'],
      gradSvg(g, c, `<path d="M50 10 C50 10, 82 48, 82 62 C82 80, 68 92, 50 92 C32 92, 18 80, 18 62 C18 48, 50 10, 50 10 Z" fill="url(#${g})" opacity="0.6"/>`)));
  }

  return s;
}

// ─── LEGAL (50) ──────────────────────────────────────
function genLegal(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'legal';

  // Gavels (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i); const rot = -30 + i * 8;
    s.push(shape(`legal-gavel-${i}`, `Gavel ${i + 1}`, 'icons', ind, ['gavel', 'judge', 'court', 'law'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g transform="rotate(${rot} 50 50)"><rect x="38" y="20" width="24" height="14" rx="4" fill="${c[0]}" opacity="0.7"/><rect x="47" y="34" width="6" height="40" rx="2" fill="${c[0]}" opacity="0.5"/><ellipse cx="50" cy="82" rx="22" ry="6" fill="${c[0]}" opacity="0.3"/></g></svg>`));
  }

  // Scales of justice (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 2);
    const tilt = (i - 4) * 3;
    s.push(shape(`legal-scale-${i}`, `Scale ${i + 1}`, 'icons', ind, ['scale', 'justice', 'balance', 'law'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="120" height="90"><line x1="60" y1="10" x2="60" y2="75" stroke="${c[0]}" stroke-width="2.5"/><line x1="20" y1="${30 + tilt}" x2="100" y2="${30 - tilt}" stroke="${c[0]}" stroke-width="2.5"/><path d="M10 ${30 + tilt} L20 ${30 + tilt} L30 ${55 + tilt}" fill="none" stroke="${c[0]}" stroke-width="2"/><path d="M90 ${30 - tilt} L100 ${30 - tilt} L110 ${55 - tilt}" fill="none" stroke="${c[0]}" stroke-width="2"/><path d="M10 ${55 + tilt} A20 8 0 0 0 30 ${55 + tilt}" fill="${c[0]}" opacity="0.2"/><path d="M90 ${55 - tilt} A20 8 0 0 0 110 ${55 - tilt}" fill="${c[0]}" opacity="0.2"/><rect x="48" y="75" width="24" height="6" rx="3" fill="${c[0]}" opacity="0.5"/></svg>`));
  }

  // Documents/scrolls (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 4);
    const lines = Array.from({ length: 4 }, (_, j) => `<rect x="25" y="${28 + j * 12}" width="${40 + (j % 2) * 10}" height="4" rx="2" fill="${c[0]}" opacity="${0.2 + j * 0.1}"/>`).join('');
    s.push(shape(`legal-doc-${i}`, `Document ${i + 1}`, 'icons', ind, ['document', 'contract', 'legal', 'paper'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><rect x="12" y="8" width="56" height="84" rx="4" fill="${c[0]}" opacity="0.1" stroke="${c[0]}" stroke-width="1.5"/><polygon points="50,8 68,8 68,25 50,8" fill="${c[0]}" opacity="0.15"/>${lines}</svg>`));
  }

  // Columns/pillars (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    s.push(shape(`legal-column-${i}`, `Column ${i + 1}`, 'decorative', ind, ['column', 'pillar', 'classic', 'institution'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100" width="60" height="100"><rect x="8" y="8" width="44" height="8" rx="2" fill="${c[0]}" opacity="0.6"/><rect x="8" y="84" width="44" height="8" rx="2" fill="${c[0]}" opacity="0.6"/><rect x="14" y="16" width="8" height="68" fill="${c[0]}" opacity="0.4"/><rect x="26" y="16" width="8" height="68" fill="${c[0]}" opacity="0.4"/><rect x="38" y="16" width="8" height="68" fill="${c[0]}" opacity="0.4"/></svg>`));
  }

  // Shields (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 1); const g = uid();
    s.push(shape(`legal-shield-${i}`, `Legal Shield ${i + 1}`, 'badges', ind, ['shield', 'protection', 'defense', 'security'],
      gradSvg(g, c, `<path d="M50 5 L88 20 L88 55 C88 78, 65 95, 50 100 C35 95, 12 78, 12 55 L12 20 Z" fill="url(#${g})" opacity="0.5"/>`)));
  }

  // Books (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 6);
    s.push(shape(`legal-book-${i}`, `Law Book ${i + 1}`, 'icons', ind, ['book', 'law', 'statute', 'reference'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><rect x="12" y="10" width="50" height="70" rx="3" fill="${c[0]}" opacity="0.6"/><rect x="12" y="10" width="8" height="70" fill="${c[0]}" opacity="0.8"/><rect x="25" y="25" width="28" height="4" rx="1" fill="white" opacity="0.4"/><rect x="25" y="35" width="20" height="3" rx="1" fill="white" opacity="0.3"/></svg>`));
  }

  // Handshakes (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 3);
    s.push(shape(`legal-handshake-${i}`, `Handshake ${i + 1}`, 'icons', ind, ['handshake', 'agreement', 'contract', 'deal'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" width="120" height="70"><path d="M10 45 L30 45 L50 30 L70 45 L60 55" fill="none" stroke="${c[0]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M110 45 L90 45 L70 30 L50 45 L60 55" fill="none" stroke="${c[1]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`));
  }

  // Seals/stamps (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 5);
    const pts = 12 + i * 2;
    const sealPts = Array.from({ length: pts * 2 }, (_, j) => {
      const a = (j * Math.PI) / pts; const r = j % 2 === 0 ? 40 : 34;
      return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
    }).join(' ');
    s.push(shape(`legal-seal-${i}`, `Official Seal ${i + 1}`, 'badges', ind, ['seal', 'stamp', 'official', 'notary'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="${sealPts}" fill="${c[0]}" opacity="0.5"/><circle cx="50" cy="50" r="22" fill="none" stroke="${c[1]}" stroke-width="1.5" opacity="0.5"/></svg>`));
  }

  return s;
}

// ─── FASHION (50) ──────────────────────────────────────
function genFashion(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'fashion';

  // Dress forms (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 6);
    s.push(shape(`fash-form-${i}`, `Dress Form ${i + 1}`, 'icons', ind, ['dress', 'form', 'mannequin', 'fashion'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100" width="60" height="100"><ellipse cx="30" cy="15" rx="8" ry="10" fill="${c[0]}" opacity="0.5"/><path d="M18 25 C15 35, 12 50, 15 65 C18 80, 30 82, 30 82 C30 82, 42 80, 45 65 C48 50, 45 35, 42 25" fill="${c[0]}" opacity="0.4"/><line x1="30" y1="82" x2="30" y2="95" stroke="${c[0]}" stroke-width="2"/><rect x="20" y="92" width="20" height="4" rx="2" fill="${c[0]}" opacity="0.3"/></svg>`));
  }

  // Hangers (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i);
    s.push(shape(`fash-hanger-${i}`, `Hanger ${i + 1}`, 'icons', ind, ['hanger', 'clothing', 'wardrobe', 'closet'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70" width="100" height="70"><path d="M50 15 C50 8, 55 5, 55 5" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linecap="round"/><circle cx="55" cy="4" r="3" fill="none" stroke="${c[0]}" stroke-width="2"/><path d="M50 15 L8 50 L92 50 Z" fill="none" stroke="${c[0]}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`));
  }

  // Scissors (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 2); const rot = i * 15;
    s.push(shape(`fash-scissors-${i}`, `Scissors ${i + 1}`, 'icons', ind, ['scissors', 'cut', 'tailor', 'sewing'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><g transform="rotate(${rot} 40 50)"><circle cx="25" cy="75" r="10" fill="none" stroke="${c[0]}" stroke-width="2.5"/><circle cx="55" cy="75" r="10" fill="none" stroke="${c[0]}" stroke-width="2.5"/><line x1="30" y1="67" x2="50" y2="15" stroke="${c[0]}" stroke-width="2.5"/><line x1="50" y1="67" x2="30" y2="15" stroke="${c[0]}" stroke-width="2.5"/></g></svg>`));
  }

  // Diamonds/gems (8)
  for (let i = 0; i < 8; i++) {
    const c = p(i + 6); const g = uid();
    s.push(shape(`fash-gem-${i}`, `Gem ${i + 1}`, 'geometric', ind, ['gem', 'diamond', 'jewel', 'luxury'],
      gradSvg(g, c, `<polygon points="50,8 85,35 70,88 30,88 15,35" fill="url(#${g})" opacity="0.6"/><polygon points="50,8 35,35 65,35" fill="white" opacity="0.15"/><line x1="35" y1="35" x2="30" y2="88" stroke="white" stroke-width="0.8" opacity="0.2"/><line x1="65" y1="35" x2="70" y2="88" stroke="white" stroke-width="0.8" opacity="0.2"/>`)));
  }

  // Lips (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 5);
    s.push(shape(`fash-lips-${i}`, `Lips ${i + 1}`, 'organic', ind, ['lips', 'beauty', 'cosmetics', 'makeup'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="100" height="60"><path d="M10 30 C10 15, 30 8, 50 20 C70 8, 90 15, 90 30 C90 45, 70 52, 50 42 C30 52, 10 45, 10 30 Z" fill="${c[0]}" opacity="0.6"/></svg>`));
  }

  // Hearts (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 6);
    s.push(shape(`fash-heart-${i}`, `Love Heart ${i + 1}`, 'organic', ind, ['heart', 'love', 'romance', 'valentine'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 85 C25 62, 8 48, 8 30 C8 16, 18 8, 30 8 C38 8, 45 12, 50 20 C55 12, 62 8, 70 8 C82 8, 92 16, 92 30 C92 48, 75 62, 50 85 Z" fill="${c[0]}" opacity="0.6"/></svg>`));
  }

  // Perfume bottles (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 7); const g = uid();
    s.push(shape(`fash-perfume-${i}`, `Perfume ${i + 1}`, 'icons', ind, ['perfume', 'fragrance', 'bottle', 'beauty'],
      gradSvg(g, c, `<rect x="28" y="35" width="44" height="55" rx="6" fill="url(#${g})" opacity="0.5"/><rect x="38" y="25" width="24" height="12" rx="3" fill="${c[0]}" opacity="0.3"/><rect x="44" y="15" width="12" height="12" rx="2" fill="${c[0]}" opacity="0.4"/>`)));
  }

  // Ribbons/bows (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 6);
    s.push(shape(`fash-bow-${i}`, `Bow ${i + 1}`, 'decorative', ind, ['bow', 'ribbon', 'gift', 'decorative'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="100" height="60"><path d="M50 30 C40 15, 10 10, 10 25 C10 40, 40 40, 50 30" fill="${c[0]}" opacity="0.6"/><path d="M50 30 C60 15, 90 10, 90 25 C90 40, 60 40, 50 30" fill="${c[0]}" opacity="0.6"/><circle cx="50" cy="30" r="6" fill="${c[1]}" opacity="0.7"/><path d="M44 36 L40 55" stroke="${c[0]}" stroke-width="2" stroke-linecap="round"/><path d="M56 36 L60 55" stroke="${c[0]}" stroke-width="2" stroke-linecap="round"/></svg>`));
  }

  // Crowns (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 4); const g = uid();
    s.push(shape(`fash-crown-${i}`, `Crown ${i + 1}`, 'decorative', ind, ['crown', 'royal', 'luxury', 'premium'],
      gradSvg(g, c, `<polygon points="10,70 10,35 25,50 40,25 50,45 60,25 75,50 90,35 90,70" fill="url(#${g})" opacity="0.7"/><rect x="10" y="68" width="80" height="8" rx="2" fill="url(#${g})" opacity="0.5"/><circle cx="40" cy="30" r="3" fill="${c[1]}" opacity="0.6"/><circle cx="60" cy="30" r="3" fill="${c[1]}" opacity="0.6"/><circle cx="50" cy="48" r="3" fill="${c[1]}" opacity="0.6"/>`, '0 0 100 80', 100, 80)));
  }

  return s;
}

// ─── GAMING & INTERACTIVE (50) ──────────────────────────────────────
function genGaming(): LibraryShape[] {
  const s: LibraryShape[] = [];
  const ind = 'gaming';

  // Game controllers (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i); const g = uid();
    const bw = 60 + (i % 3) * 10;
    s.push(shape(`game-ctrl-${i}`, `Controller ${i + 1}`, 'icons', ind, ['controller', 'gamepad', 'gaming', 'play'],
      gradSvg(g, c, `<rect x="${50 - bw/2}" y="30" width="${bw}" height="40" rx="18" fill="url(#${g})" opacity="0.8"/><circle cx="35" cy="48" r="6" fill="${c[1]}" opacity="0.5"/><circle cx="65" cy="48" r="6" fill="${c[1]}" opacity="0.5"/><rect x="42" y="42" width="16" height="4" rx="2" fill="${c[1]}" opacity="0.3"/><circle cx="35" cy="48" r="2" fill="${c[1]}"/><circle cx="65" cy="48" r="2" fill="${c[1]}"/>`)));
  }

  // D-pad crosses (5)
  for (let i = 0; i < 5; i++) {
    const c = p(i + 2); const g = uid();
    const sz = 10 + i * 2;
    s.push(shape(`game-dpad-${i}`, `D-Pad ${i + 1}`, 'geometric', ind, ['dpad', 'directional', 'controls', 'gaming'],
      gradSvg(g, c, `<rect x="${50 - sz/2}" y="${50 - sz*1.5}" width="${sz}" height="${sz*3}" rx="3" fill="url(#${g})"/><rect x="${50 - sz*1.5}" y="${50 - sz/2}" width="${sz*3}" height="${sz}" rx="3" fill="url(#${g})"/>`)));
  }

  // Pixel hearts (6)
  for (let i = 0; i < 6; i++) {
    const c = p(i + 4); const g = uid();
    const px = 6 + i;
    const heartPixels = [
      [1,0],[2,0],[4,0],[5,0],
      [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
      [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
      [1,3],[2,3],[3,3],[4,3],[5,3],
      [2,4],[3,4],[4,4],
      [3,5]
    ];
    const pixels = heartPixels.map(([x, y]) => 
      `<rect x="${15 + x * px}" y="${20 + y * px}" width="${px - 1}" height="${px - 1}" fill="url(#${g})"/>`
    ).join('');
    s.push(shape(`game-pheart-${i}`, `Pixel Heart ${i + 1}`, 'icons', ind, ['heart', 'pixel', 'retro', 'life', 'health'],
      gradSvg(g, c, pixels)));
  }

  // Power-up stars (5)
  for (let i = 0; i < 5; i++) {
    const c = p(i); const g = uid();
    const pts = 5 + i;
    const outerR = 38, innerR = 16;
    const starPts = Array.from({ length: pts * 2 }, (_, j) => {
      const a = (j * Math.PI) / pts - Math.PI / 2;
      const r = j % 2 === 0 ? outerR : innerR;
      return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
    }).join(' ');
    s.push(shape(`game-star-${i}`, `Power Star ${pts}pt`, 'decorative', ind, ['star', 'powerup', 'collectible', 'reward'],
      gradSvg(g, c, `<polygon points="${starPts}" fill="url(#${g})"/><circle cx="50" cy="50" r="8" fill="${c[1]}" opacity="0.4"/>`)));
  }

  // Shield / armor badges (5)
  for (let i = 0; i < 5; i++) {
    const c = p(i + 6); const g = uid();
    s.push(shape(`game-shield-${i}`, `Game Shield ${i + 1}`, 'badges', ind, ['shield', 'armor', 'defense', 'protection'],
      gradSvg(g, c, `<path d="M50 8 L85 25 L85 55 C85 75 68 90 50 95 C32 90 15 75 15 55 L15 25 Z" fill="url(#${g})" opacity="0.8"/><path d="M50 18 L75 30 L75 55 C75 70 63 82 50 86 C37 82 25 70 25 55 L25 30 Z" fill="none" stroke="${c[1]}" stroke-width="1.5" opacity="0.5"/>`)));
  }

  // Dice faces (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 8); const g = uid();
    const face = i + 1;
    const dots = face === 1 ? `<circle cx="50" cy="50" r="6" fill="${c[1]}"/>` :
      face === 2 ? `<circle cx="35" cy="35" r="5" fill="${c[1]}"/><circle cx="65" cy="65" r="5" fill="${c[1]}"/>` :
      face === 3 ? `<circle cx="35" cy="35" r="5" fill="${c[1]}"/><circle cx="50" cy="50" r="5" fill="${c[1]}"/><circle cx="65" cy="65" r="5" fill="${c[1]}"/>` :
      `<circle cx="35" cy="35" r="5" fill="${c[1]}"/><circle cx="65" cy="35" r="5" fill="${c[1]}"/><circle cx="35" cy="65" r="5" fill="${c[1]}"/><circle cx="65" cy="65" r="5" fill="${c[1]}"/>`;
    s.push(shape(`game-dice-${i}`, `Dice Face ${face}`, 'icons', ind, ['dice', 'random', 'chance', 'tabletop'],
      gradSvg(g, c, `<rect x="15" y="15" width="70" height="70" rx="12" fill="url(#${g})" opacity="0.8"/>${dots}`)));
  }

  // Crosshair / target (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 1);
    const r = 30 + i * 5;
    const sw = 1.5 + i * 0.5;
    s.push(shape(`game-xhair-${i}`, `Crosshair ${i + 1}`, 'icons', ind, ['crosshair', 'target', 'aim', 'fps'],
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="${r}" fill="none" stroke="${c[0]}" stroke-width="${sw}"/><circle cx="50" cy="50" r="${r * 0.5}" fill="none" stroke="${c[0]}" stroke-width="${sw}" opacity="0.5"/><line x1="50" y1="${50 - r - 5}" x2="50" y2="${50 + r + 5}" stroke="${c[0]}" stroke-width="${sw}"/><line x1="${50 - r - 5}" y1="50" x2="${50 + r + 5}" y2="50" stroke="${c[0]}" stroke-width="${sw}"/><circle cx="50" cy="50" r="2" fill="${c[1]}"/></svg>`));
  }

  // Trophy / cup (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 5); const g = uid();
    s.push(shape(`game-trophy-${i}`, `Trophy ${i + 1}`, 'decorative', ind, ['trophy', 'cup', 'winner', 'achievement'],
      gradSvg(g, c, `<path d="M30 15 L70 15 L65 50 C63 60 55 65 50 65 C45 65 37 60 35 50 Z" fill="url(#${g})" opacity="0.8"/><rect x="45" y="65" width="10" height="12" fill="${c[0]}" opacity="0.6"/><rect x="35" y="77" width="30" height="6" rx="3" fill="url(#${g})" opacity="0.7"/><path d="M30 15 C15 20 10 35 20 45 L35 38" fill="none" stroke="${c[1]}" stroke-width="2" opacity="0.4"/><path d="M70 15 C85 20 90 35 80 45 L65 38" fill="none" stroke="${c[1]}" stroke-width="2" opacity="0.4"/>`)));
  }

  // Lightning bolt / power (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 3); const g = uid();
    const scale = 0.85 + i * 0.05;
    s.push(shape(`game-bolt-${i}`, `Lightning Bolt ${i + 1}`, 'icons', ind, ['lightning', 'power', 'energy', 'speed'],
      gradSvg(g, c, `<polygon points="55,5 25,50 45,50 40,95 75,45 52,45" fill="url(#${g})" opacity="0.85" transform="scale(${scale})" transform-origin="50 50"/>`)));
  }

  // Gem / crystal (4)
  for (let i = 0; i < 4; i++) {
    const c = p(i + 7); const g = uid();
    s.push(shape(`game-gem-${i}`, `Crystal Gem ${i + 1}`, 'decorative', ind, ['gem', 'crystal', 'diamond', 'loot', 'treasure'],
      gradSvg(g, c, `<polygon points="50,10 80,35 70,85 30,85 20,35" fill="url(#${g})" opacity="0.75"/><polygon points="50,10 65,35 50,85 35,35" fill="${c[1]}" opacity="0.25"/><line x1="20" y1="35" x2="80" y2="35" stroke="${c[1]}" stroke-width="1" opacity="0.4"/>`)));
  }

  // Pixel sword (3)
  for (let i = 0; i < 3; i++) {
    const c = p(i + 9); const g = uid();
    s.push(shape(`game-sword-${i}`, `Pixel Sword ${i + 1}`, 'icons', ind, ['sword', 'weapon', 'rpg', 'adventure'],
      gradSvg(g, c, `<rect x="47" y="10" width="6" height="50" fill="url(#${g})" transform="rotate(${-15 + i * 15} 50 50)"/><rect x="35" y="58" width="30" height="6" rx="2" fill="${c[1]}" opacity="0.7" transform="rotate(${-15 + i * 15} 50 50)"/><rect x="46" y="64" width="8" height="16" rx="2" fill="${c[0]}" opacity="0.5" transform="rotate(${-15 + i * 15} 50 50)"/>`)));
  }

  return s;
}

// ─── MASTER EXPORT ──────────────────────────────────────
let _industryShapes: LibraryShape[] | null = null;

export function getIndustryShapes(): LibraryShape[] {
  if (_industryShapes) return _industryShapes;

  _uid = 10000;
  _industryShapes = [
    ...genTechnology(),
    ...genHealthcare(),
    ...genFinance(),
    ...genHospitality(),
    ...genEducation(),
    ...genRetail(),
    ...genRealEstate(),
    ...genFood(),
    ...genSports(),
    ...genEntertainment(),
    ...genAutomotive(),
    ...genEnergy(),
    ...genLegal(),
    ...genFashion(),
    ...genGaming(),
  ];

  return _industryShapes;
}

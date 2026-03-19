/**
 * Comprehensive SVG Shape Library
 * Organized by industry and category with metadata for search/filtering.
 * All shapes use viewBox for scalability with unique gradient IDs.
 */

export interface LibraryShape {
  id: string;
  name: string;
  category: string;
  industry: string;
  tags: string[];
  svg: string;
}

export const SHAPE_INDUSTRIES = [
  { value: 'all', label: 'All Industries' },
  { value: 'general', label: 'General / Universal' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare & Life Sciences' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'hospitality', label: 'Hospitality & Travel' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail & E-Commerce' },
  { value: 'realestate', label: 'Real Estate' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'entertainment', label: 'Entertainment & Media' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'energy', label: 'Energy & Sustainability' },
  { value: 'legal', label: 'Legal & Professional' },
  { value: 'fashion', label: 'Fashion & Beauty' },
  { value: 'gaming', label: 'Gaming & Interactive' },
] as const;

export const SHAPE_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'organic', label: 'Organic' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'layered', label: 'Layered' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'badges', label: 'Badges & Shields' },
  { value: 'frames', label: 'Frames & Borders' },
  { value: 'decorative', label: 'Decorative' },
  { value: 'icons', label: 'Symbolic Icons' },
] as const;

// Helper to generate unique IDs for gradient defs
const uid = (base: string) => `${base}-${Math.random().toString(36).slice(2, 8)}`;

export const SHAPE_LIBRARY: LibraryShape[] = [
  // ─────────────────────────────────────────────
  // GENERAL / UNIVERSAL
  // ─────────────────────────────────────────────
  {
    id: 'gen-circle',
    name: 'Solid Circle',
    category: 'geometric',
    industry: 'general',
    tags: ['circle', 'dot', 'round', 'basic'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="42" fill="#6366F1"/></svg>`,
  },
  {
    id: 'gen-gradient-circle',
    name: 'Gradient Circle',
    category: 'geometric',
    industry: 'general',
    tags: ['circle', 'gradient', 'round'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="gc1" cx="35%" cy="35%"><stop offset="0%" stop-color="#818CF8"/><stop offset="100%" stop-color="#4F46E5"/></radialGradient></defs><circle cx="50" cy="50" r="42" fill="url(#gc1)"/></svg>`,
  },
  {
    id: 'gen-rounded-rect',
    name: 'Rounded Rectangle',
    category: 'geometric',
    industry: 'general',
    tags: ['rectangle', 'rounded', 'card', 'box'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><defs><linearGradient id="rr2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6B8DD6"/><stop offset="100%" stop-color="#8E7DBE"/></linearGradient></defs><rect x="5" y="5" width="110" height="70" rx="14" fill="url(#rr2)"/></svg>`,
  },
  {
    id: 'gen-hexagon',
    name: 'Hexagon',
    category: 'geometric',
    industry: 'general',
    tags: ['hexagon', 'polygon', 'six-sided', 'honeycomb'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="hx1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs><polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="url(#hx1)"/></svg>`,
  },
  {
    id: 'gen-diamond',
    name: 'Diamond',
    category: 'geometric',
    industry: 'general',
    tags: ['diamond', 'rhombus', 'rotated-square'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="di1" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><polygon points="50,5 95,50 50,95 5,50" fill="url(#di1)"/></svg>`,
  },
  {
    id: 'gen-star',
    name: 'Five-Point Star',
    category: 'geometric',
    industry: 'general',
    tags: ['star', 'rating', 'award', 'five-point'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40" fill="#F59E0B"/></svg>`,
  },
  {
    id: 'gen-triangle',
    name: 'Triangle',
    category: 'geometric',
    industry: 'general',
    tags: ['triangle', 'arrow', 'pyramid', 'delta'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="tr1" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#F472B6"/><stop offset="100%" stop-color="#EC4899"/></linearGradient></defs><polygon points="50,8 95,90 5,90" fill="url(#tr1)"/></svg>`,
  },
  {
    id: 'gen-octagon',
    name: 'Octagon',
    category: 'geometric',
    industry: 'general',
    tags: ['octagon', 'stop', 'eight-sided'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" fill="#EF4444"/></svg>`,
  },
  {
    id: 'gen-pill',
    name: 'Pill / Capsule',
    category: 'minimal',
    industry: 'general',
    tags: ['pill', 'capsule', 'oblong', 'button'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 60" width="150" height="60"><defs><linearGradient id="pl1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#F472B6"/><stop offset="100%" stop-color="#EC4899"/></linearGradient></defs><rect x="5" y="5" width="140" height="50" rx="25" fill="url(#pl1)"/></svg>`,
  },
  {
    id: 'gen-blob',
    name: 'Organic Blob',
    category: 'organic',
    industry: 'general',
    tags: ['blob', 'organic', 'amorphous', 'soft'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="bl1" cx="40%" cy="40%"><stop offset="0%" stop-color="#34D399"/><stop offset="100%" stop-color="#10B981"/></radialGradient></defs><path d="M50 10 C80 15, 95 35, 90 55 C85 75, 70 90, 45 88 C20 86, 8 70, 12 50 C16 30, 25 8, 50 10 Z" fill="url(#bl1)"/></svg>`,
  },
  {
    id: 'gen-wave',
    name: 'Abstract Wave',
    category: 'abstract',
    industry: 'general',
    tags: ['wave', 'flow', 'water', 'motion'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><defs><linearGradient id="wv1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#8B5CF6"/><stop offset="50%" stop-color="#A78BFA"/><stop offset="100%" stop-color="#C4B5FD"/></linearGradient></defs><path d="M0 40 Q25 20, 50 40 T100 40 T150 40 T200 40 L200 80 L0 80 Z" fill="url(#wv1)" opacity="0.8"/><path d="M0 50 Q25 30, 50 50 T100 50 T150 50 T200 50 L200 80 L0 80 Z" fill="url(#wv1)" opacity="0.5"/></svg>`,
  },
  {
    id: 'gen-ring',
    name: 'Ring / Donut',
    category: 'minimal',
    industry: 'general',
    tags: ['ring', 'donut', 'circle', 'outline'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="none" stroke="#6366F1" stroke-width="8"/></svg>`,
  },
  {
    id: 'gen-concentric',
    name: 'Concentric Circles',
    category: 'layered',
    industry: 'general',
    tags: ['concentric', 'circles', 'target', 'ripple'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="#6366F1" opacity="0.2"/><circle cx="50" cy="50" r="32" fill="#6366F1" opacity="0.4"/><circle cx="50" cy="50" r="20" fill="#6366F1" opacity="0.8"/></svg>`,
  },
  {
    id: 'gen-stacked-rect',
    name: 'Stacked Layers',
    category: 'layered',
    industry: 'general',
    tags: ['layers', 'stacked', 'cards', 'depth'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="120" height="90"><defs><linearGradient id="sl1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4F46E5"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs><rect x="10" y="20" width="90" height="60" rx="12" fill="url(#sl1)" opacity="0.3"/><rect x="15" y="14" width="90" height="60" rx="12" fill="url(#sl1)" opacity="0.6"/><rect x="20" y="8" width="90" height="60" rx="12" fill="url(#sl1)"/></svg>`,
  },
  {
    id: 'gen-cross',
    name: 'Plus / Cross',
    category: 'minimal',
    industry: 'general',
    tags: ['plus', 'cross', 'add', 'medical'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="35" y="10" width="30" height="80" rx="6" fill="#6366F1"/><rect x="10" y="35" width="80" height="30" rx="6" fill="#6366F1"/></svg>`,
  },
  {
    id: 'gen-arrow-right',
    name: 'Arrow Right',
    category: 'minimal',
    industry: 'general',
    tags: ['arrow', 'direction', 'forward', 'next'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><defs><linearGradient id="ar1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#2563EB"/></linearGradient></defs><polygon points="10,25 75,25 75,10 110,40 75,70 75,55 10,55" fill="url(#ar1)"/></svg>`,
  },
  {
    id: 'gen-squircle',
    name: 'Squircle',
    category: 'geometric',
    industry: 'general',
    tags: ['squircle', 'superellipse', 'ios', 'app-icon'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="sq1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#06B6D4"/><stop offset="100%" stop-color="#0891B2"/></linearGradient></defs><path d="M50 5 C75 5 95 5 95 30 L95 70 C95 95 75 95 50 95 L50 95 C25 95 5 95 5 70 L5 30 C5 5 25 5 50 5 Z" fill="url(#sq1)"/></svg>`,
  },
  {
    id: 'gen-pentagon',
    name: 'Pentagon',
    category: 'geometric',
    industry: 'general',
    tags: ['pentagon', 'polygon', 'five-sided'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="pn1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs><polygon points="50,5 97,37 78,92 22,92 3,37" fill="url(#pn1)"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // TECHNOLOGY
  // ─────────────────────────────────────────────
  {
    id: 'tech-circuit-node',
    name: 'Circuit Node',
    category: 'geometric',
    industry: 'technology',
    tags: ['circuit', 'node', 'tech', 'network', 'connection'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="cn1" cx="50%" cy="50%"><stop offset="0%" stop-color="#22D3EE"/><stop offset="100%" stop-color="#0891B2"/></radialGradient></defs><circle cx="50" cy="50" r="20" fill="url(#cn1)"/><line x1="50" y1="5" x2="50" y2="30" stroke="#22D3EE" stroke-width="3"/><line x1="50" y1="70" x2="50" y2="95" stroke="#22D3EE" stroke-width="3"/><line x1="5" y1="50" x2="30" y2="50" stroke="#22D3EE" stroke-width="3"/><line x1="70" y1="50" x2="95" y2="50" stroke="#22D3EE" stroke-width="3"/><circle cx="50" cy="5" r="4" fill="#22D3EE"/><circle cx="50" cy="95" r="4" fill="#22D3EE"/><circle cx="5" cy="50" r="4" fill="#22D3EE"/><circle cx="95" cy="50" r="4" fill="#22D3EE"/></svg>`,
  },
  {
    id: 'tech-hex-grid',
    name: 'Hex Grid Cell',
    category: 'geometric',
    industry: 'technology',
    tags: ['hex', 'grid', 'modular', 'data', 'blockchain'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="hg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#06B6D4"/><stop offset="100%" stop-color="#0E7490"/></linearGradient></defs><polygon points="50,8 88,28 88,68 50,88 12,68 12,28" fill="none" stroke="url(#hg1)" stroke-width="3"/><polygon points="50,22 72,34 72,58 50,70 28,58 28,34" fill="url(#hg1)" opacity="0.6"/></svg>`,
  },
  {
    id: 'tech-data-stream',
    name: 'Data Stream',
    category: 'abstract',
    industry: 'technology',
    tags: ['data', 'stream', 'flow', 'digital', 'transfer'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 80" width="150" height="80"><defs><linearGradient id="ds1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3B82F6" stop-opacity="0"/><stop offset="50%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/></linearGradient></defs><path d="M0 40 Q20 20, 40 40 T80 40 T120 40 T150 40" fill="none" stroke="url(#ds1)" stroke-width="3"/><path d="M0 30 Q20 10, 40 30 T80 30 T120 30 T150 30" fill="none" stroke="url(#ds1)" stroke-width="2" opacity="0.5"/><path d="M0 50 Q20 30, 40 50 T80 50 T120 50 T150 50" fill="none" stroke="url(#ds1)" stroke-width="2" opacity="0.5"/></svg>`,
  },
  {
    id: 'tech-chip',
    name: 'Microchip',
    category: 'icons',
    industry: 'technology',
    tags: ['chip', 'processor', 'cpu', 'silicon', 'hardware'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="25" y="25" width="50" height="50" rx="4" fill="#1E293B" stroke="#3B82F6" stroke-width="2"/><rect x="35" y="35" width="30" height="30" rx="2" fill="#3B82F6" opacity="0.3"/><line x1="35" y1="20" x2="35" y2="25" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="50" y1="20" x2="50" y2="25" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="65" y1="20" x2="65" y2="25" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="35" y1="75" x2="35" y2="80" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="50" y1="75" x2="50" y2="80" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="65" y1="75" x2="65" y2="80" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="35" x2="25" y2="35" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="50" x2="25" y2="50" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="65" x2="25" y2="65" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="75" y1="35" x2="80" y2="35" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="75" y1="50" x2="80" y2="50" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/><line x1="75" y1="65" x2="80" y2="65" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'tech-cloud',
    name: 'Cloud Shape',
    category: 'organic',
    industry: 'technology',
    tags: ['cloud', 'saas', 'storage', 'hosting', 'server'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 80" width="140" height="80"><defs><linearGradient id="cl1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#3B82F6"/></linearGradient></defs><path d="M35 65 C15 65, 10 50, 20 40 C15 25, 30 15, 45 20 C50 10, 70 5, 85 15 C100 10, 120 15, 120 35 C130 35, 135 50, 120 60 C125 70, 110 75, 100 65 Z" fill="url(#cl1)"/></svg>`,
  },
  {
    id: 'tech-bracket',
    name: 'Code Bracket',
    category: 'minimal',
    industry: 'technology',
    tags: ['code', 'bracket', 'developer', 'programming'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M35 15 L15 50 L35 85" fill="none" stroke="#10B981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M65 15 L85 50 L65 85" fill="none" stroke="#10B981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'tech-neural',
    name: 'Neural Network',
    category: 'abstract',
    industry: 'technology',
    tags: ['ai', 'neural', 'network', 'machine-learning', 'brain'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><line x1="20" y1="25" x2="50" y2="35" stroke="#8B5CF6" stroke-width="1.5" opacity="0.6"/><line x1="20" y1="50" x2="50" y2="35" stroke="#8B5CF6" stroke-width="1.5" opacity="0.6"/><line x1="20" y1="75" x2="50" y2="65" stroke="#8B5CF6" stroke-width="1.5" opacity="0.6"/><line x1="20" y1="50" x2="50" y2="65" stroke="#8B5CF6" stroke-width="1.5" opacity="0.6"/><line x1="50" y1="35" x2="80" y2="50" stroke="#8B5CF6" stroke-width="1.5" opacity="0.6"/><line x1="50" y1="65" x2="80" y2="50" stroke="#8B5CF6" stroke-width="1.5" opacity="0.6"/><circle cx="20" cy="25" r="6" fill="#A78BFA"/><circle cx="20" cy="50" r="6" fill="#A78BFA"/><circle cx="20" cy="75" r="6" fill="#A78BFA"/><circle cx="50" cy="35" r="7" fill="#8B5CF6"/><circle cx="50" cy="65" r="7" fill="#8B5CF6"/><circle cx="80" cy="50" r="8" fill="#7C3AED"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // HEALTHCARE & LIFE SCIENCES
  // ─────────────────────────────────────────────
  {
    id: 'health-cross',
    name: 'Medical Cross',
    category: 'icons',
    industry: 'healthcare',
    tags: ['medical', 'cross', 'health', 'hospital', 'pharmacy'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="mc1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#EF4444"/><stop offset="100%" stop-color="#DC2626"/></linearGradient></defs><rect x="35" y="15" width="30" height="70" rx="4" fill="url(#mc1)"/><rect x="15" y="35" width="70" height="30" rx="4" fill="url(#mc1)"/></svg>`,
  },
  {
    id: 'health-heart',
    name: 'Heart Shape',
    category: 'organic',
    industry: 'healthcare',
    tags: ['heart', 'love', 'care', 'health', 'cardiology'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="ht1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F87171"/><stop offset="100%" stop-color="#EF4444"/></linearGradient></defs><path d="M50 88 C25 65, 5 50, 5 30 C5 15, 18 5, 30 5 C38 5, 45 10, 50 18 C55 10, 62 5, 70 5 C82 5, 95 15, 95 30 C95 50, 75 65, 50 88 Z" fill="url(#ht1)"/></svg>`,
  },
  {
    id: 'health-pill',
    name: 'Pill Capsule',
    category: 'icons',
    industry: 'healthcare',
    tags: ['pill', 'medicine', 'pharmacy', 'drug', 'capsule'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g transform="rotate(-45 50 50)"><rect x="25" y="15" width="50" height="70" rx="25" fill="none" stroke="#10B981" stroke-width="3"/><rect x="25" y="50" width="50" height="35" rx="0 0 25 25" fill="#10B981" opacity="0.5"/><line x1="25" y1="50" x2="75" y2="50" stroke="#10B981" stroke-width="2"/></g></svg>`,
  },
  {
    id: 'health-dna',
    name: 'DNA Helix',
    category: 'abstract',
    industry: 'healthcare',
    tags: ['dna', 'helix', 'genetics', 'biotech', 'science'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120" width="80" height="120"><path d="M20 10 C45 25, 55 45, 20 60 C45 75, 55 95, 20 110" fill="none" stroke="#06B6D4" stroke-width="3"/><path d="M60 10 C35 25, 25 45, 60 60 C35 75, 25 95, 60 110" fill="none" stroke="#8B5CF6" stroke-width="3"/><line x1="28" y1="20" x2="52" y2="20" stroke="#94A3B8" stroke-width="2" opacity="0.5"/><line x1="22" y1="40" x2="58" y2="40" stroke="#94A3B8" stroke-width="2" opacity="0.5"/><line x1="22" y1="60" x2="58" y2="60" stroke="#94A3B8" stroke-width="2" opacity="0.5"/><line x1="22" y1="80" x2="58" y2="80" stroke="#94A3B8" stroke-width="2" opacity="0.5"/><line x1="28" y1="100" x2="52" y2="100" stroke="#94A3B8" stroke-width="2" opacity="0.5"/></svg>`,
  },
  {
    id: 'health-leaf',
    name: 'Wellness Leaf',
    category: 'organic',
    industry: 'healthcare',
    tags: ['leaf', 'natural', 'wellness', 'organic', 'green'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="wl1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34D399"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs><path d="M15 85 C15 85, 15 25, 75 10 C75 10, 90 65, 30 85 Z" fill="url(#wl1)"/><path d="M15 85 Q45 55, 75 10" fill="none" stroke="#fff" stroke-width="2" opacity="0.4"/></svg>`,
  },
  {
    id: 'health-shield',
    name: 'Health Shield',
    category: 'badges',
    industry: 'healthcare',
    tags: ['shield', 'protection', 'insurance', 'safety'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120"><defs><linearGradient id="hs1" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#1D4ED8"/></linearGradient></defs><path d="M50 8 L90 25 L90 55 C90 80, 70 100, 50 112 C30 100, 10 80, 10 55 L10 25 Z" fill="url(#hs1)"/><rect x="40" y="40" width="20" height="35" rx="3" fill="white" opacity="0.9"/><rect x="33" y="50" width="34" height="15" rx="3" fill="white" opacity="0.9"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // FINANCE & BANKING
  // ─────────────────────────────────────────────
  {
    id: 'fin-chart-up',
    name: 'Growth Chart',
    category: 'icons',
    industry: 'finance',
    tags: ['chart', 'growth', 'stocks', 'trading', 'upward'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><defs><linearGradient id="gu1" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#10B981" stop-opacity="0.1"/><stop offset="100%" stop-color="#10B981" stop-opacity="0.4"/></linearGradient></defs><path d="M10 70 L35 45 L55 55 L80 25 L110 15 L110 70 Z" fill="url(#gu1)"/><polyline points="10,70 35,45 55,55 80,25 110,15" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="110" cy="15" r="4" fill="#10B981"/></svg>`,
  },
  {
    id: 'fin-coin-stack',
    name: 'Coin Stack',
    category: 'icons',
    industry: 'finance',
    tags: ['coin', 'money', 'wealth', 'savings', 'investment'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><defs><linearGradient id="cs1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><ellipse cx="40" cy="80" rx="30" ry="10" fill="url(#cs1)"/><rect x="10" y="70" width="60" height="10" fill="url(#cs1)"/><ellipse cx="40" cy="70" rx="30" ry="10" fill="#FDE68A"/><rect x="10" y="55" width="60" height="15" fill="url(#cs1)"/><ellipse cx="40" cy="55" rx="30" ry="10" fill="#FDE68A"/><rect x="10" y="40" width="60" height="15" fill="url(#cs1)"/><ellipse cx="40" cy="40" rx="30" ry="10" fill="#FDE68A"/></svg>`,
  },
  {
    id: 'fin-vault',
    name: 'Vault Door',
    category: 'icons',
    industry: 'finance',
    tags: ['vault', 'safe', 'security', 'bank', 'protection'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="10" y="10" width="80" height="80" rx="8" fill="#1E293B" stroke="#64748B" stroke-width="3"/><circle cx="50" cy="50" r="25" fill="none" stroke="#94A3B8" stroke-width="3"/><circle cx="50" cy="50" r="18" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="4 3"/><circle cx="50" cy="50" r="5" fill="#FBBF24"/><line x1="50" y1="25" x2="50" y2="35" stroke="#94A3B8" stroke-width="2"/><line x1="50" y1="65" x2="50" y2="75" stroke="#94A3B8" stroke-width="2"/><line x1="25" y1="50" x2="35" y2="50" stroke="#94A3B8" stroke-width="2"/><line x1="65" y1="50" x2="75" y2="50" stroke="#94A3B8" stroke-width="2"/></svg>`,
  },
  {
    id: 'fin-bar-chart',
    name: 'Bar Chart',
    category: 'icons',
    industry: 'finance',
    tags: ['bar', 'chart', 'analytics', 'report', 'data'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80"><defs><linearGradient id="bc1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#4F46E5"/></linearGradient></defs><rect x="10" y="40" width="15" height="35" rx="3" fill="url(#bc1)" opacity="0.6"/><rect x="30" y="25" width="15" height="50" rx="3" fill="url(#bc1)" opacity="0.8"/><rect x="50" y="15" width="15" height="60" rx="3" fill="url(#bc1)"/><rect x="70" y="30" width="15" height="45" rx="3" fill="url(#bc1)" opacity="0.7"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // HOSPITALITY & TRAVEL
  // ─────────────────────────────────────────────
  {
    id: 'hosp-sun',
    name: 'Sun / Sunrise',
    category: 'organic',
    industry: 'hospitality',
    tags: ['sun', 'sunrise', 'vacation', 'tropical', 'warm'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="sn1" cx="50%" cy="50%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#F59E0B"/></radialGradient></defs><circle cx="50" cy="50" r="20" fill="url(#sn1)"/><g stroke="#FBBF24" stroke-width="3" stroke-linecap="round"><line x1="50" y1="10" x2="50" y2="22"/><line x1="50" y1="78" x2="50" y2="90"/><line x1="10" y1="50" x2="22" y2="50"/><line x1="78" y1="50" x2="90" y2="50"/><line x1="21" y1="21" x2="30" y2="30"/><line x1="70" y1="70" x2="79" y2="79"/><line x1="79" y1="21" x2="70" y2="30"/><line x1="30" y1="70" x2="21" y2="79"/></g></svg>`,
  },
  {
    id: 'hosp-compass',
    name: 'Compass Rose',
    category: 'decorative',
    industry: 'hospitality',
    tags: ['compass', 'travel', 'navigation', 'explore', 'adventure'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="42" fill="none" stroke="#D4A574" stroke-width="2"/><circle cx="50" cy="50" r="38" fill="none" stroke="#D4A574" stroke-width="1" opacity="0.5"/><polygon points="50,12 55,45 50,50 45,45" fill="#EF4444"/><polygon points="50,88 45,55 50,50 55,55" fill="#94A3B8"/><polygon points="12,50 45,45 50,50 45,55" fill="#94A3B8"/><polygon points="88,50 55,55 50,50 55,45" fill="#94A3B8"/><circle cx="50" cy="50" r="4" fill="#D4A574"/></svg>`,
  },
  {
    id: 'hosp-mountain',
    name: 'Mountain Range',
    category: 'decorative',
    industry: 'hospitality',
    tags: ['mountain', 'landscape', 'outdoor', 'nature', 'peak'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 80" width="150" height="80"><defs><linearGradient id="mt1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#4F46E5"/></linearGradient><linearGradient id="mt2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#818CF8"/><stop offset="100%" stop-color="#6366F1"/></linearGradient></defs><polygon points="25,75 55,20 85,75" fill="url(#mt2)" opacity="0.7"/><polygon points="55,75 95,15 135,75" fill="url(#mt1)"/><polygon points="90,28 95,15 100,28" fill="#E0E7FF"/></svg>`,
  },
  {
    id: 'hosp-wave-water',
    name: 'Ocean Wave',
    category: 'organic',
    industry: 'hospitality',
    tags: ['wave', 'ocean', 'sea', 'beach', 'water'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 60" width="150" height="60"><defs><linearGradient id="ow1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></linearGradient></defs><path d="M0 30 Q15 15, 30 30 T60 30 T90 30 T120 30 T150 30 L150 60 L0 60 Z" fill="url(#ow1)" opacity="0.8"/><path d="M0 38 Q18 23, 36 38 T72 38 T108 38 T150 38 L150 60 L0 60 Z" fill="url(#ow1)" opacity="0.5"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // EDUCATION
  // ─────────────────────────────────────────────
  {
    id: 'edu-book',
    name: 'Open Book',
    category: 'icons',
    industry: 'education',
    tags: ['book', 'reading', 'learning', 'library', 'knowledge'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><path d="M60 20 C45 15, 15 12, 10 15 L10 70 C15 67, 45 65, 60 70" fill="#4F46E5" opacity="0.2"/><path d="M60 20 C75 15, 105 12, 110 15 L110 70 C105 67, 75 65, 60 70" fill="#4F46E5" opacity="0.3"/><path d="M60 20 L60 70" stroke="#4F46E5" stroke-width="2"/><path d="M10 15 L10 70" stroke="#4F46E5" stroke-width="2" stroke-linecap="round"/><path d="M110 15 L110 70" stroke="#4F46E5" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'edu-cap',
    name: 'Graduation Cap',
    category: 'icons',
    industry: 'education',
    tags: ['graduation', 'cap', 'academic', 'degree', 'university'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><defs><linearGradient id="gc2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs><polygon points="60,15 110,35 60,55 10,35" fill="url(#gc2)"/><path d="M30 38 L30 58 C30 58, 45 68, 60 68 C75 68, 90 58, 90 58 L90 38" fill="none" stroke="#1E293B" stroke-width="2.5"/><line x1="110" y1="35" x2="110" y2="60" stroke="#FBBF24" stroke-width="2.5"/><circle cx="110" cy="62" r="3" fill="#FBBF24"/></svg>`,
  },
  {
    id: 'edu-lightbulb',
    name: 'Light Bulb',
    category: 'icons',
    industry: 'education',
    tags: ['idea', 'innovation', 'creativity', 'thinking', 'lightbulb'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><defs><radialGradient id="lb1" cx="50%" cy="40%"><stop offset="0%" stop-color="#FDE68A"/><stop offset="100%" stop-color="#FBBF24"/></radialGradient></defs><circle cx="40" cy="38" r="25" fill="url(#lb1)"/><path d="M30 55 C30 50, 28 45, 28 40 C28 28, 33 18, 40 13 C47 18, 52 28, 52 40 C52 45, 50 50, 50 55" fill="url(#lb1)"/><rect x="32" y="65" width="16" height="6" rx="2" fill="#94A3B8"/><rect x="34" y="73" width="12" height="4" rx="2" fill="#94A3B8"/><rect x="36" y="79" width="8" height="4" rx="2" fill="#94A3B8"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // RETAIL & E-COMMERCE
  // ─────────────────────────────────────────────
  {
    id: 'ret-bag',
    name: 'Shopping Bag',
    category: 'icons',
    industry: 'retail',
    tags: ['shopping', 'bag', 'retail', 'ecommerce', 'store'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><defs><linearGradient id="sb1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F472B6"/><stop offset="100%" stop-color="#EC4899"/></linearGradient></defs><rect x="10" y="35" width="60" height="55" rx="4" fill="url(#sb1)"/><path d="M25 35 C25 20, 30 12, 40 12 C50 12, 55 20, 55 35" fill="none" stroke="#EC4899" stroke-width="4" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'ret-tag',
    name: 'Price Tag',
    category: 'icons',
    industry: 'retail',
    tags: ['tag', 'price', 'sale', 'discount', 'label'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="pt1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#D97706"/></linearGradient></defs><path d="M10 50 L10 15 C10 10, 15 5, 20 5 L55 5 L95 45 L55 95 L10 50 Z" fill="url(#pt1)"/><circle cx="30" cy="28" r="7" fill="white" opacity="0.9"/></svg>`,
  },
  {
    id: 'ret-cart',
    name: 'Cart Badge',
    category: 'badges',
    industry: 'retail',
    tags: ['cart', 'shopping', 'checkout', 'buy'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="#10B981" opacity="0.15"/><circle cx="50" cy="50" r="35" fill="#10B981" opacity="0.3"/><path d="M25 35 L32 35 L42 60 L68 60 L75 40 L38 40" fill="none" stroke="#10B981" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="45" cy="70" r="4" fill="#10B981"/><circle cx="65" cy="70" r="4" fill="#10B981"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // REAL ESTATE
  // ─────────────────────────────────────────────
  {
    id: 're-house',
    name: 'House Silhouette',
    category: 'icons',
    industry: 'realestate',
    tags: ['house', 'home', 'property', 'real-estate', 'building'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="rh1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#4338CA"/></linearGradient></defs><polygon points="50,12 90,45 90,90 10,90 10,45" fill="url(#rh1)"/><rect x="38" y="60" width="24" height="30" rx="2" fill="#1E1B4B"/><rect x="20" y="55" width="14" height="14" rx="1" fill="#818CF8" opacity="0.5"/><rect x="66" y="55" width="14" height="14" rx="1" fill="#818CF8" opacity="0.5"/></svg>`,
  },
  {
    id: 're-skyline',
    name: 'City Skyline',
    category: 'decorative',
    industry: 'realestate',
    tags: ['city', 'skyline', 'buildings', 'urban', 'downtown'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 70" width="160" height="70"><defs><linearGradient id="sk1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#312E81"/></linearGradient></defs><rect x="10" y="30" width="18" height="40" fill="url(#sk1)"/><rect x="32" y="15" width="14" height="55" fill="url(#sk1)" opacity="0.9"/><rect x="50" y="25" width="20" height="45" fill="url(#sk1)" opacity="0.8"/><rect x="74" y="10" width="16" height="60" fill="url(#sk1)"/><rect x="94" y="20" width="22" height="50" fill="url(#sk1)" opacity="0.85"/><rect x="120" y="35" width="16" height="35" fill="url(#sk1)" opacity="0.7"/><rect x="140" y="28" width="12" height="42" fill="url(#sk1)" opacity="0.6"/></svg>`,
  },
  {
    id: 're-key',
    name: 'Property Key',
    category: 'icons',
    industry: 'realestate',
    tags: ['key', 'unlock', 'access', 'ownership', 'property'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="pk1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#D97706"/></linearGradient></defs><circle cx="35" cy="40" r="18" fill="none" stroke="url(#pk1)" stroke-width="5"/><circle cx="35" cy="40" r="8" fill="url(#pk1)" opacity="0.3"/><line x1="53" y1="40" x2="85" y2="72" stroke="url(#pk1)" stroke-width="5" stroke-linecap="round"/><line x1="75" y1="62" x2="85" y2="52" stroke="url(#pk1)" stroke-width="5" stroke-linecap="round"/><line x1="65" y1="52" x2="75" y2="42" stroke="url(#pk1)" stroke-width="5" stroke-linecap="round"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // FOOD & BEVERAGE
  // ─────────────────────────────────────────────
  {
    id: 'food-fork-knife',
    name: 'Fork & Knife',
    category: 'icons',
    industry: 'food',
    tags: ['fork', 'knife', 'dining', 'restaurant', 'food'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><g fill="none" stroke="#D4A574" stroke-width="3" stroke-linecap="round"><path d="M25 12 L25 35 C25 42, 30 45, 30 55 L30 88"/><line x1="25" y1="12" x2="25" y2="30"/><line x1="18" y1="12" x2="18" y2="28"/><line x1="32" y1="12" x2="32" y2="28"/><path d="M55 12 L55 88"/><path d="M55 12 C65 12, 68 25, 68 35 C68 42, 62 45, 55 45"/></g></svg>`,
  },
  {
    id: 'food-coffee',
    name: 'Coffee Cup',
    category: 'icons',
    industry: 'food',
    tags: ['coffee', 'cup', 'cafe', 'beverage', 'tea'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="cf1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#92400E"/><stop offset="100%" stop-color="#78350F"/></linearGradient></defs><path d="M20 35 L25 85 C25 90, 65 90, 65 85 L70 35" fill="url(#cf1)"/><path d="M70 42 C80 42, 85 50, 82 58 C80 65, 72 65, 70 60" fill="none" stroke="#92400E" stroke-width="3"/><path d="M28 25 Q32 15, 36 25" fill="none" stroke="#D4A574" stroke-width="2" opacity="0.6"/><path d="M42 20 Q46 10, 50 20" fill="none" stroke="#D4A574" stroke-width="2" opacity="0.6"/><path d="M56 25 Q60 15, 64 25" fill="none" stroke="#D4A574" stroke-width="2" opacity="0.6"/></svg>`,
  },
  {
    id: 'food-grape',
    name: 'Wine Grape',
    category: 'organic',
    industry: 'food',
    tags: ['grape', 'wine', 'vineyard', 'winery', 'fruit'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><defs><radialGradient id="gr1"><stop offset="0%" stop-color="#A855F7"/><stop offset="100%" stop-color="#7E22CE"/></radialGradient></defs><circle cx="30" cy="40" r="10" fill="url(#gr1)"/><circle cx="50" cy="40" r="10" fill="url(#gr1)"/><circle cx="20" cy="55" r="10" fill="url(#gr1)"/><circle cx="40" cy="55" r="10" fill="url(#gr1)"/><circle cx="60" cy="55" r="10" fill="url(#gr1)"/><circle cx="30" cy="70" r="10" fill="url(#gr1)"/><circle cx="50" cy="70" r="10" fill="url(#gr1)"/><circle cx="40" cy="82" r="10" fill="url(#gr1)"/><path d="M40 35 L40 15 Q40 10, 45 10 L55 10" fill="none" stroke="#059669" stroke-width="2.5"/><path d="M42 22 C50 18, 55 22, 52 28" fill="#059669" opacity="0.7"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // SPORTS & FITNESS
  // ─────────────────────────────────────────────
  {
    id: 'sport-medal',
    name: 'Medal',
    category: 'badges',
    industry: 'sports',
    tags: ['medal', 'award', 'winner', 'achievement', 'champion'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 110" width="80" height="110"><defs><linearGradient id="md1" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#D97706"/></linearGradient></defs><polygon points="20,5 35,45 25,45" fill="#EF4444"/><polygon points="60,5 45,45 55,45" fill="#3B82F6"/><circle cx="40" cy="70" r="30" fill="url(#md1)"/><circle cx="40" cy="70" r="23" fill="none" stroke="#FDE68A" stroke-width="2"/><polygon points="40,52 44,63 56,63 46,70 50,82 40,74 30,82 34,70 24,63 36,63" fill="#FDE68A"/></svg>`,
  },
  {
    id: 'sport-shield-badge',
    name: 'Sports Shield',
    category: 'badges',
    industry: 'sports',
    tags: ['shield', 'team', 'crest', 'sports', 'club'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120"><defs><linearGradient id="ss1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs><path d="M50 5 L92 20 C92 20, 92 65, 75 85 C65 97, 50 110, 50 110 C50 110, 35 97, 25 85 C8 65, 8 20, 8 20 Z" fill="url(#ss1)" stroke="#FBBF24" stroke-width="3"/><line x1="50" y1="20" x2="50" y2="100" stroke="#FBBF24" stroke-width="1.5" opacity="0.3"/><line x1="15" y1="50" x2="85" y2="50" stroke="#FBBF24" stroke-width="1.5" opacity="0.3"/></svg>`,
  },
  {
    id: 'sport-trophy',
    name: 'Trophy Cup',
    category: 'icons',
    industry: 'sports',
    tags: ['trophy', 'cup', 'winner', 'championship', 'prize'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" width="100" height="110"><defs><linearGradient id="tp1" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#D97706"/></linearGradient></defs><path d="M30 15 L30 50 C30 65, 40 75, 50 78 C60 75, 70 65, 70 50 L70 15 Z" fill="url(#tp1)"/><path d="M30 25 C20 25, 12 35, 15 48 C17 55, 25 55, 30 50" fill="none" stroke="#D97706" stroke-width="3"/><path d="M70 25 C80 25, 88 35, 85 48 C83 55, 75 55, 70 50" fill="none" stroke="#D97706" stroke-width="3"/><rect x="44" y="78" width="12" height="12" fill="#D97706"/><rect x="35" y="90" width="30" height="8" rx="3" fill="#D97706"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // ENTERTAINMENT & MEDIA
  // ─────────────────────────────────────────────
  {
    id: 'ent-play',
    name: 'Play Button',
    category: 'icons',
    industry: 'entertainment',
    tags: ['play', 'video', 'media', 'streaming', 'content'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="42" fill="#EF4444" opacity="0.9"/><polygon points="38,25 38,75 78,50" fill="white"/></svg>`,
  },
  {
    id: 'ent-film',
    name: 'Film Reel',
    category: 'icons',
    industry: 'entertainment',
    tags: ['film', 'movie', 'cinema', 'reel', 'production'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#1E293B" stroke="#64748B" stroke-width="3"/><circle cx="50" cy="50" r="10" fill="#64748B"/><circle cx="50" cy="20" r="6" fill="#334155" stroke="#64748B" stroke-width="2"/><circle cx="50" cy="80" r="6" fill="#334155" stroke="#64748B" stroke-width="2"/><circle cx="20" cy="50" r="6" fill="#334155" stroke="#64748B" stroke-width="2"/><circle cx="80" cy="50" r="6" fill="#334155" stroke="#64748B" stroke-width="2"/><circle cx="28" cy="28" r="5" fill="#334155" stroke="#64748B" stroke-width="2"/><circle cx="72" cy="28" r="5" fill="#334155" stroke="#64748B" stroke-width="2"/><circle cx="28" cy="72" r="5" fill="#334155" stroke="#64748B" stroke-width="2"/><circle cx="72" cy="72" r="5" fill="#334155" stroke="#64748B" stroke-width="2"/></svg>`,
  },
  {
    id: 'ent-music',
    name: 'Music Note',
    category: 'icons',
    industry: 'entertainment',
    tags: ['music', 'note', 'audio', 'sound', 'song'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><defs><linearGradient id="mn1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#A855F7"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs><ellipse cx="25" cy="78" rx="15" ry="12" fill="url(#mn1)"/><line x1="40" y1="78" x2="40" y2="15" stroke="url(#mn1)" stroke-width="4"/><path d="M40 15 C40 15, 65 10, 65 25 C65 35, 50 35, 40 30" fill="url(#mn1)"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // AUTOMOTIVE
  // ─────────────────────────────────────────────
  {
    id: 'auto-speedometer',
    name: 'Speedometer',
    category: 'icons',
    industry: 'automotive',
    tags: ['speed', 'gauge', 'dashboard', 'performance', 'racing'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70" width="100" height="70"><path d="M10 65 A42 42 0 0 1 90 65" fill="none" stroke="#1E293B" stroke-width="8"/><path d="M10 65 A42 42 0 0 1 50 12" fill="none" stroke="#10B981" stroke-width="8"/><path d="M50 12 A42 42 0 0 1 75 25" fill="none" stroke="#FBBF24" stroke-width="8"/><path d="M75 25 A42 42 0 0 1 90 65" fill="none" stroke="#EF4444" stroke-width="8"/><line x1="50" y1="60" x2="72" y2="30" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="60" r="5" fill="#EF4444"/></svg>`,
  },
  {
    id: 'auto-gear',
    name: 'Gear / Cog',
    category: 'icons',
    industry: 'automotive',
    tags: ['gear', 'cog', 'mechanical', 'engine', 'settings'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 8 L55 8 L58 18 L68 14 L72 18 L66 28 L76 33 L76 38 L65 40 L68 50 L76 52 L76 58 L66 62 L72 72 L68 76 L58 72 L55 82 L50 82 L47 72 L37 76 L33 72 L39 62 L29 58 L29 52 L40 50 L37 40 L29 38 L29 33 L39 28 L33 18 L37 14 L47 18 Z" fill="#64748B"/><circle cx="52.5" cy="45" r="14" fill="#1E293B"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // ENERGY & SUSTAINABILITY
  // ─────────────────────────────────────────────
  {
    id: 'energy-bolt',
    name: 'Lightning Bolt',
    category: 'icons',
    industry: 'energy',
    tags: ['lightning', 'bolt', 'power', 'energy', 'electric'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="80" height="100"><defs><linearGradient id="eb1" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><polygon points="50,5 15,55 38,55 28,95 65,42 42,42" fill="url(#eb1)"/></svg>`,
  },
  {
    id: 'energy-solar',
    name: 'Solar Panel',
    category: 'icons',
    industry: 'energy',
    tags: ['solar', 'panel', 'renewable', 'green', 'sustainable'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="sp1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E40AF"/><stop offset="100%" stop-color="#3B82F6"/></linearGradient></defs><rect x="15" y="25" width="70" height="50" rx="3" fill="url(#sp1)" stroke="#60A5FA" stroke-width="1.5"/><line x1="15" y1="42" x2="85" y2="42" stroke="#60A5FA" stroke-width="1" opacity="0.6"/><line x1="15" y1="58" x2="85" y2="58" stroke="#60A5FA" stroke-width="1" opacity="0.6"/><line x1="38" y1="25" x2="38" y2="75" stroke="#60A5FA" stroke-width="1" opacity="0.6"/><line x1="62" y1="25" x2="62" y2="75" stroke="#60A5FA" stroke-width="1" opacity="0.6"/><rect x="45" y="75" width="10" height="15" fill="#64748B"/></svg>`,
  },
  {
    id: 'energy-recycle',
    name: 'Recycle Symbol',
    category: 'icons',
    industry: 'energy',
    tags: ['recycle', 'sustainability', 'eco', 'environment', 'green'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g fill="none" stroke="#10B981" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M50 15 L30 48"/><polygon points="30,48 22,38 38,38" fill="#10B981" stroke="none"/><path d="M30 48 L65 48"/><polygon points="65,48 58,40 58,56" fill="#10B981" stroke="none"/><path d="M65 48 L50 80"/><polygon points="50,80 56,70 44,70" fill="#10B981" stroke="none"/><path d="M50 80 L15 48"/><path d="M65 48 L85 48"/><path d="M50 15 L68 48"/></g></svg>`,
  },
  {
    id: 'energy-wind',
    name: 'Wind Turbine',
    category: 'icons',
    industry: 'energy',
    tags: ['wind', 'turbine', 'renewable', 'windmill', 'clean'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 110" width="80" height="110"><line x1="40" y1="40" x2="38" y2="105" stroke="#94A3B8" stroke-width="4"/><path d="M40 40 L38 8 C38 5, 42 5, 42 8 L44 38" fill="#64748B"/><path d="M40 40 L68 58 C70 60, 68 63, 66 62 L42 42" fill="#64748B"/><path d="M40 40 L14 56 C12 58, 10 55, 12 54 L38 42" fill="#64748B"/><circle cx="40" cy="40" r="4" fill="#334155"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // LEGAL & PROFESSIONAL
  // ─────────────────────────────────────────────
  {
    id: 'legal-scale',
    name: 'Justice Scale',
    category: 'icons',
    industry: 'legal',
    tags: ['scale', 'justice', 'law', 'balance', 'court'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><line x1="50" y1="10" x2="50" y2="80" stroke="#D4A574" stroke-width="3"/><line x1="15" y1="30" x2="85" y2="30" stroke="#D4A574" stroke-width="3"/><path d="M10 55 L15 30 L20 55 A5 3 0 0 1 10 55" fill="#D4A574" opacity="0.4" stroke="#D4A574" stroke-width="1.5"/><path d="M80 45 L85 30 L90 45 A5 3 0 0 1 80 45" fill="#D4A574" opacity="0.4" stroke="#D4A574" stroke-width="1.5"/><circle cx="50" cy="10" r="4" fill="#D4A574"/><rect x="38" y="80" width="24" height="8" rx="2" fill="#D4A574"/></svg>`,
  },
  {
    id: 'legal-gavel',
    name: 'Gavel',
    category: 'icons',
    industry: 'legal',
    tags: ['gavel', 'judge', 'law', 'court', 'verdict'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g transform="rotate(-30 50 50)"><rect x="40" y="15" width="20" height="35" rx="4" fill="#92400E"/><rect x="47" y="50" width="6" height="35" fill="#D4A574"/></g><rect x="25" y="82" width="55" height="10" rx="3" fill="#92400E"/><ellipse cx="52" cy="82" rx="30" ry="4" fill="#D4A574" opacity="0.3"/></svg>`,
  },
  {
    id: 'legal-columns',
    name: 'Classical Columns',
    category: 'decorative',
    industry: 'legal',
    tags: ['columns', 'pillar', 'courthouse', 'classical', 'institution'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80"><rect x="10" y="8" width="100" height="8" rx="2" fill="#D4A574"/><polygon points="60,2 110,8 10,8" fill="#D4A574" opacity="0.8"/><rect x="18" y="16" width="10" height="50" rx="1" fill="#D4A574" opacity="0.7"/><rect x="38" y="16" width="10" height="50" rx="1" fill="#D4A574" opacity="0.8"/><rect x="58" y="16" width="10" height="50" rx="1" fill="#D4A574" opacity="0.9"/><rect x="78" y="16" width="10" height="50" rx="1" fill="#D4A574" opacity="0.8"/><rect x="98" y="16" width="10" height="50" rx="1" fill="#D4A574" opacity="0.7"/><rect x="10" y="66" width="100" height="8" rx="2" fill="#D4A574"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // FASHION & BEAUTY
  // ─────────────────────────────────────────────
  {
    id: 'fash-hanger',
    name: 'Hanger',
    category: 'icons',
    industry: 'fashion',
    tags: ['hanger', 'clothing', 'fashion', 'wardrobe', 'boutique'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80"><path d="M50 10 C50 5, 55 5, 55 10 C55 15, 50 18, 50 20" fill="none" stroke="#D4A574" stroke-width="3" stroke-linecap="round"/><path d="M50 20 L90 55 C95 58, 92 65, 87 65 L13 65 C8 65, 5 58, 10 55 Z" fill="none" stroke="#D4A574" stroke-width="3.5" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'fash-gem',
    name: 'Gemstone',
    category: 'geometric',
    industry: 'fashion',
    tags: ['gem', 'diamond', 'jewelry', 'luxury', 'precious'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="gm1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#E0E7FF"/><stop offset="50%" stop-color="#818CF8"/><stop offset="100%" stop-color="#4F46E5"/></linearGradient></defs><polygon points="50,8 75,30 88,30 50,92 12,30 25,30" fill="url(#gm1)"/><line x1="25" y1="30" x2="75" y2="30" stroke="white" stroke-width="1.5" opacity="0.4"/><line x1="50" y1="8" x2="50" y2="30" stroke="white" stroke-width="1" opacity="0.3"/><line x1="50" y1="30" x2="50" y2="92" stroke="white" stroke-width="1" opacity="0.2"/></svg>`,
  },
  {
    id: 'fash-lipstick',
    name: 'Lipstick',
    category: 'icons',
    industry: 'fashion',
    tags: ['lipstick', 'beauty', 'cosmetics', 'makeup', 'glamour'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 110" width="50" height="110"><defs><linearGradient id="ls1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#F43F5E"/><stop offset="100%" stop-color="#E11D48"/></linearGradient></defs><rect x="12" y="45" width="26" height="55" rx="3" fill="#1E293B"/><rect x="10" y="42" width="30" height="8" rx="2" fill="#334155"/><path d="M12 42 L12 28 C12 20, 25 10, 25 10 C25 10, 38 20, 38 28 L38 42" fill="url(#ls1)"/></svg>`,
  },

  // ─────────────────────────────────────────────
  // ADDITIONAL DECORATIVE & FRAME SHAPES
  // ─────────────────────────────────────────────
  {
    id: 'dec-ribbon-banner',
    name: 'Ribbon Banner',
    category: 'frames',
    industry: 'general',
    tags: ['ribbon', 'banner', 'label', 'header', 'decorative'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 60" width="180" height="60"><defs><linearGradient id="rb1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><polygon points="0,15 20,15 20,5 160,5 160,15 180,15 165,30 180,45 160,45 160,55 20,55 20,45 0,45 15,30" fill="url(#rb1)"/></svg>`,
  },
  {
    id: 'dec-circle-frame',
    name: 'Circle Frame',
    category: 'frames',
    industry: 'general',
    tags: ['frame', 'circle', 'border', 'ornament', 'emblem'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="42" fill="none" stroke="#D4A574" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="none" stroke="#D4A574" stroke-width="1" opacity="0.4"/><circle cx="50" cy="50" r="46" fill="none" stroke="#D4A574" stroke-width="1" opacity="0.4"/></svg>`,
  },
  {
    id: 'dec-badge-seal',
    name: 'Seal Badge',
    category: 'badges',
    industry: 'general',
    tags: ['seal', 'badge', 'certified', 'stamp', 'quality'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="bs1" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#D97706"/></linearGradient></defs><polygon points="50,5 58,20 74,12 72,30 90,32 82,48 98,55 85,66 92,82 76,78 68,95 54,84 42,95 36,78 18,82 25,66 8,55 22,48 14,32 32,30 30,12 46,20" fill="url(#bs1)"/><circle cx="50" cy="50" r="22" fill="none" stroke="#FDE68A" stroke-width="2"/></svg>`,
  },
  {
    id: 'dec-corner-ornament',
    name: 'Corner Ornament',
    category: 'decorative',
    industry: 'general',
    tags: ['corner', 'ornament', 'flourish', 'decorative', 'elegant'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80"><path d="M5 75 C5 75, 5 40, 20 25 C35 10, 75 5, 75 5" fill="none" stroke="#D4A574" stroke-width="2.5"/><path d="M5 75 C5 75, 5 55, 15 40 C25 25, 55 15, 75 5" fill="none" stroke="#D4A574" stroke-width="1.5" opacity="0.5"/><circle cx="5" cy="75" r="3" fill="#D4A574"/><circle cx="75" cy="5" r="3" fill="#D4A574"/><path d="M15 65 Q15 45, 30 35" fill="none" stroke="#D4A574" stroke-width="1" opacity="0.3"/></svg>`,
  },
  {
    id: 'dec-infinity',
    name: 'Infinity Loop',
    category: 'abstract',
    industry: 'general',
    tags: ['infinity', 'loop', 'endless', 'forever', 'continuous'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 60" width="140" height="60"><defs><linearGradient id="inf1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#6366F1"/><stop offset="50%" stop-color="#A855F7"/><stop offset="100%" stop-color="#6366F1"/></linearGradient></defs><path d="M70 30 C70 10, 40 5, 25 15 C10 25, 10 40, 25 48 C40 56, 70 50, 70 30 C70 10, 100 5, 115 15 C130 25, 130 40, 115 48 C100 56, 70 50, 70 30" fill="none" stroke="url(#inf1)" stroke-width="4"/></svg>`,
  },
  {
    id: 'dec-spiral',
    name: 'Golden Spiral',
    category: 'abstract',
    industry: 'general',
    tags: ['spiral', 'fibonacci', 'golden-ratio', 'mathematical'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 50 C50 25, 80 10, 90 35 C100 60, 80 85, 55 85 C30 85, 15 65, 15 45 C15 25, 30 10, 50 10 C70 10, 85 25, 85 45 C85 60, 75 72, 60 72 C48 72, 38 62, 38 50 C38 40, 44 32, 52 32 C58 32, 62 38, 62 44" fill="none" stroke="#8B5CF6" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'dec-semicircle',
    name: 'Semicircle',
    category: 'geometric',
    industry: 'general',
    tags: ['semicircle', 'half-circle', 'arch', 'dome'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="100" height="60"><defs><linearGradient id="sc2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F472B6"/><stop offset="100%" stop-color="#DB2777"/></linearGradient></defs><path d="M5 55 A45 45 0 0 1 95 55 Z" fill="url(#sc2)"/></svg>`,
  },
  {
    id: 'dec-parallelogram',
    name: 'Parallelogram',
    category: 'geometric',
    industry: 'general',
    tags: ['parallelogram', 'slanted', 'dynamic', 'angled'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 70" width="130" height="70"><defs><linearGradient id="pg1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#0EA5E9"/><stop offset="100%" stop-color="#0284C7"/></linearGradient></defs><polygon points="25,10 120,10 105,60 10,60" fill="url(#pg1)"/></svg>`,
  },
  {
    id: 'dec-crescent',
    name: 'Crescent Moon',
    category: 'organic',
    industry: 'general',
    tags: ['crescent', 'moon', 'night', 'lunar'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="cm1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FDE68A"/><stop offset="100%" stop-color="#FBBF24"/></linearGradient></defs><path d="M60 10 A40 40 0 1 0 60 90 A30 30 0 1 1 60 10 Z" fill="url(#cm1)"/></svg>`,
  },
  {
    id: 'dec-3d-sphere',
    name: '3D Sphere',
    category: 'layered',
    industry: 'general',
    tags: ['sphere', '3d', 'globe', 'ball', 'orb'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><radialGradient id="sp2" cx="35%" cy="35%"><stop offset="0%" stop-color="#60A5FA"/><stop offset="40%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#1E40AF"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="url(#sp2)"/><ellipse cx="38" cy="38" rx="12" ry="8" fill="white" opacity="0.15" transform="rotate(-30 38 38)"/></svg>`,
  },
];

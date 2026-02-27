/**
 * BiasAccessibilitySection — Comprehensive interactive-card-based reference for
 * Bias Awareness, Accessibility Standards, and Regulatory Compliance.
 * Rendered as a dedicated tab in the Knowledge Base page.
 */

import { useState } from 'react';
import {
  Scale, Accessibility, Eye, Blend, Globe2, AudioLines, Brain,
  ListChecks, Fingerprint, HeartHandshake, Type, ScanSearch,
  ChevronRight, Shield, Users, Palette, CheckCircle2, AlertTriangle,
  Info, Monitor, Smartphone, Building2, FileText, BookOpen,
  Layers, Target, Zap, ArrowRight, ExternalLink, ChevronDown,
  Landmark, GraduationCap, Languages, MapPin, Volume2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ─── Category Definitions ───────────────────────────────────────────────────

interface CategoryCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  sections: CategorySection[];
}

interface CategorySection {
  heading: string;
  content: string;
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
  platformTools?: string[];
}

const categories: CategoryCard[] = [
  {
    id: 'wcag',
    title: 'WCAG 2.2 Compliance',
    subtitle: 'Web Content Accessibility Guidelines — Levels A, AA & AAA',
    icon: Monitor,
    color: 'text-blue-500',
    badge: 'Global Standard',
    sections: [
      {
        heading: 'What is WCAG?',
        content: 'The Web Content Accessibility Guidelines (WCAG) are the global standard for digital accessibility, published by the W3C. Version 2.2 (2023) introduces 9 new success criteria focused on cognitive accessibility, mobile interaction, and authentication simplicity.',
      },
      {
        heading: 'Level A — Minimum Accessibility',
        content: 'The baseline requirements every digital product must meet. Without Level A compliance, content is fundamentally inaccessible to many users.',
        bullets: [
          'All non-text content has text alternatives (alt text on images)',
          'Content is adaptable — can be presented in different ways without losing meaning',
          'No content relies solely on color to convey information',
          'Keyboard accessibility — all functionality available via keyboard',
          'No content flashes more than 3 times per second (seizure safety)',
          'Pages have descriptive titles and logical heading structure',
          'Link purpose is determinable from link text alone',
        ],
      },
      {
        heading: 'Level AA — Standard Compliance (Recommended)',
        content: 'The target level for most organizations and the legal standard in many jurisdictions. Level AA is what BrandHub evaluates by default.',
        bullets: [
          'Color contrast: minimum 4.5:1 for normal text, 3:1 for large text (18px+)',
          'Text can be resized up to 200% without loss of content or functionality',
          'Images of text are avoided (use real text instead)',
          'Multiple navigation methods available (search, sitemap, breadcrumbs)',
          'Consistent navigation and identification patterns across pages',
          'Error suggestions and prevention on forms',
          'NEW in 2.2: Focus appearance — visible focus indicators with minimum area',
          'NEW in 2.2: Dragging movements — single-pointer alternative required',
          'NEW in 2.2: Target size minimum — 24×24px for interactive elements',
        ],
        platformTools: ['Color Accessibility Panel', 'OKLCH Contrast Checker', 'Typography WCAG Panel'],
      },
      {
        heading: 'Level AAA — Enhanced Accessibility',
        content: 'The highest level of conformance. Not required for legal compliance but demonstrates leadership in inclusive design.',
        bullets: [
          'Color contrast: minimum 7:1 for normal text, 4.5:1 for large text',
          'Audio content has sign language interpretation',
          'Reading level: content understandable at lower secondary education level',
          'Pronunciation guidance for ambiguous words',
          'Extended audio descriptions for video content',
          'No timing constraints on user interactions',
          'No interruptions — user controls all automatic updates',
        ],
        platformTools: ['Bias Scanner (Language Dimension)', 'Readability Grade Calculator'],
      },
      {
        heading: 'WCAG 2.2 — New Success Criteria',
        content: 'Nine new criteria added in 2.2, with emphasis on cognitive and mobile accessibility.',
        table: {
          headers: ['Criterion', 'Level', 'What It Requires'],
          rows: [
            ['2.4.11 Focus Not Obscured (Min)', 'AA', 'Focused element is at least partially visible'],
            ['2.4.12 Focus Not Obscured (Enh)', 'AAA', 'Focused element is fully visible'],
            ['2.4.13 Focus Appearance', 'AAA', 'Focus indicator meets contrast and area thresholds'],
            ['2.5.7 Dragging Movements', 'AA', 'All drag interactions have single-pointer alternative'],
            ['2.5.8 Target Size (Minimum)', 'AA', 'Interactive targets are at least 24×24px'],
            ['3.2.6 Consistent Help', 'A', 'Help mechanisms appear in same relative location'],
            ['3.3.7 Redundant Entry', 'A', 'Previously entered info is auto-populated or selectable'],
            ['3.3.8 Accessible Auth (Min)', 'AA', 'Authentication doesn\'t require cognitive function tests'],
            ['3.3.9 Accessible Auth (Enh)', 'AAA', 'No object or user-content recognition for auth'],
          ],
        },
      },
    ],
  },
  {
    id: 'regulatory',
    title: 'Regulatory Compliance',
    subtitle: 'ADA Title III, EAA 2025, Section 508 & Beyond',
    icon: Landmark,
    color: 'text-amber-500',
    badge: 'Legal Requirements',
    sections: [
      {
        heading: 'ADA Title III (United States)',
        content: 'The Americans with Disabilities Act Title III prohibits discrimination in public accommodations, increasingly interpreted to include websites and digital services.',
        bullets: [
          'Applies to businesses open to the public (including websites)',
          'Courts have ruled websites are "places of public accommodation"',
          'DOJ references WCAG 2.1 AA as the technical standard',
          'Non-compliance can result in lawsuits and settlements ($10,000–$75,000+)',
          'Physical venue standards: 32" min door width, 36" corridors, 5% ramp slope max',
          'Event venues must provide accessible seating, assistive listening, and wayfinding',
        ],
        platformTools: ['Bias Scanner (Accessibility Dimension)', 'Event Venue Accessibility Checker'],
      },
      {
        heading: 'European Accessibility Act (EAA 2025)',
        content: 'Effective June 28, 2025 — the EAA requires products and services sold in the EU to meet accessibility standards. This affects any organization doing business in Europe.',
        bullets: [
          'Covers: e-commerce, banking, transport, e-books, and digital services',
          'Mandates conformity with EN 301 549 (aligned with WCAG 2.1 AA)',
          'Penalties vary by member state — up to 5% of annual revenue in some jurisdictions',
          'Requires accessibility statements and feedback mechanisms',
          'Applies to both B2C and B2B digital products',
          'Microenterprises (<10 employees) may be exempt for services only',
        ],
      },
      {
        heading: 'Section 508 (US Federal)',
        content: 'Section 508 of the Rehabilitation Act requires federal agencies and their contractors to make ICT accessible. Updated in 2018 to align with WCAG 2.0 AA.',
        bullets: [
          'Mandatory for all US federal agencies and contractors',
          'Applies to websites, documents, software, and multimedia',
          'Aligned with WCAG 2.0 Level AA (with additional functional requirements)',
          'Procurement must include accessibility evaluation criteria',
          'Voluntary Product Accessibility Template (VPAT) often required for vendors',
        ],
      },
      {
        heading: 'Other Regional Standards',
        content: 'Accessibility legislation is expanding globally, with similar requirements in Canada (AODA), UK (Equality Act), Australia (DDA), and more.',
        table: {
          headers: ['Region', 'Legislation', 'Standard', 'Status'],
          rows: [
            ['Canada (Ontario)', 'AODA', 'WCAG 2.0 AA', 'Active'],
            ['United Kingdom', 'Equality Act 2010', 'WCAG 2.1 AA', 'Active'],
            ['Australia', 'DDA 1992', 'WCAG 2.1 AA', 'Active'],
            ['Japan', 'JIS X 8341-3', 'WCAG 2.0 AA', 'Active'],
            ['Israel', 'Standard 5568', 'WCAG 2.0 AA', 'Active'],
            ['EU (Public Sector)', 'EN 301 549', 'WCAG 2.1 AA', 'Active'],
          ],
        },
      },
    ],
  },
  {
    id: 'platform-tools',
    title: 'BrandHub Platform Tools',
    subtitle: 'How BrandHub enforces accessibility at every level',
    icon: Zap,
    color: 'text-emerald-500',
    badge: 'Built-In',
    sections: [
      {
        heading: 'Color Accessibility Panel',
        content: 'Real-time contrast checking using the OKLCH perceptual color model for every color in your palette. Auto-Fix suggests the closest accessible alternative that preserves your brand hue.',
        bullets: [
          'OKLCH perceptual model for accurate contrast (not sRGB approximation)',
          'Helmholtz-Kohlrausch (H-K) correction for perceived brightness of saturated colors',
          'Auto-Fix binary search: finds closest lightness meeting 4.5:1 while preserving hue + chroma',
          'Colorblind simulations: Protanopia, Deuteranopia, Tritanopia, Achromatopsia',
          'Global Cultural Symbolism Map: color meaning across 7+ markets',
          'Tonal Harmony Engine: palette relationship classification',
        ],
      },
      {
        heading: 'Bias Awareness Scanner (4 Dimensions)',
        content: 'AI-powered governance that evaluates brand content across Language, Visual Representation, Accessibility, and AI Governance dimensions.',
        bullets: [
          'Dimension 1 — Language: inclusive terminology, gendered/ableist phrase detection, Flesch-Kincaid Grade 8 target',
          'Dimension 2 — Visual: PI&E "Who Else?" framework, WFA litmus test, power hierarchy analysis, trope detection',
          'Dimension 3 — Accessibility: WCAG 2.2 checks, touch targets, motion sensitivity, alt-text quality',
          'Dimension 4 — AI Governance: disclosure, human oversight, data privacy, hallucination risk',
        ],
        platformTools: ['Brand Editor → Insights', 'Admin Dashboard → Bias Awareness'],
      },
      {
        heading: 'Typography WCAG Panel',
        content: 'Dedicated typography accessibility enforcement with real-time contrast ratios and readability metrics.',
        bullets: [
          'Level AA: 4.5:1 normal text, 3:1 large/UI components',
          'Level AAA: 7:1 normal text, 4.5:1 large text',
          'Minimum 16px font size recommendation',
          '1.5x line height, 2x paragraph spacing',
          '80-character maximum line length for readability',
          'Font pairing accessibility warnings',
        ],
      },
      {
        heading: 'DataForce Compliance AI',
        content: 'Automated compliance scanning that triggers on every brand guide save (5-second debounce). Scores appear as color-coded badges across the platform.',
        bullets: [
          'Auto-scan on save with useAutoCompliance hook',
          '6 compliance dimensions including accessibility alignment',
          'Color-coded scoring: Green (80+), Yellow (60–79), Red (<60)',
          'Scores visible on Portal cards, Editor hero, Admin analytics',
          'Oracle Brain alignment for organization-wide standards',
        ],
      },
      {
        heading: 'Persona Spectrum Coverage',
        content: 'Based on Microsoft\'s Inclusive Design methodology, evaluating content against the full range of human diversity.',
        table: {
          headers: ['Dimension', 'Permanent', 'Temporary', 'Situational', 'Coverage Criteria'],
          rows: [
            ['Vision', 'Blind', 'Cataract recovery', 'Distracted driver', 'Alt-text, 7:1 contrast, scalable text, no color-only info'],
            ['Mobility', 'Limb difference', 'Broken arm', 'Holding a child', 'Responsive layouts, 44px targets, keyboard nav, one-hand use'],
            ['Hearing', 'Deaf', 'Ear infection', 'Noisy environment', 'Captions on video, visual audio cues, text alternatives'],
            ['Speech', 'Non-verbal', 'Laryngitis', 'Heavy accent', 'Chat/text alternatives, no voice-only interfaces'],
            ['Cognitive', 'Learning disability', 'Concussion', 'Information overload', 'Plain language (Grade 8), clear nav, consistent layout'],
          ],
        },
      },
    ],
  },
  {
    id: 'physical',
    title: 'Physical & Event Accessibility',
    subtitle: 'ADA/IBC venue standards for events and physical spaces',
    icon: Building2,
    color: 'text-purple-500',
    badge: 'Events',
    sections: [
      {
        heading: 'Venue Requirements (ADA/IBC)',
        content: 'Physical accessibility standards for event venues, booth design, and signage — applicable to trade shows, conferences, and corporate events.',
        bullets: [
          'Doorway width: minimum 32" clear opening (36" recommended)',
          'Corridor width: minimum 36" (44" for high-traffic areas)',
          'Ramp slope: maximum 1:12 (8.33%) with handrails on both sides',
          'Accessible seating: dispersed locations with companion seating',
          'Assistive listening devices: required in venues with fixed seating',
          'Tactile wayfinding: Braille signage at decision points',
          'Accessible restrooms: within reasonable distance of all event areas',
        ],
      },
      {
        heading: 'Event Signage Standards',
        content: 'Signage must be perceivable by people with varying abilities — covering text size, contrast, mounting height, and tactile elements.',
        bullets: [
          'Sign text: minimum 1" height for every 25 feet of viewing distance',
          'High contrast: light text on dark background (or vice versa)',
          'Non-glare finish on all signage materials',
          'Braille and raised characters on room identification signs',
          'Mounting height: 48"–60" from floor (centered at 60" AFF)',
          'Digital signage: auto-captioning for video content',
        ],
      },
      {
        heading: 'Booth Design Accessibility',
        content: 'Trade show and exhibition booth design guidelines to ensure all attendees can engage with your brand experience.',
        bullets: [
          'Counter height: 28"–34" to accommodate wheelchair users',
          'Clear floor space: 30" × 48" approach at interactive stations',
          'No raised platforms without ramp access',
          'QR codes and digital alternatives to printed handouts',
          'Staff trained in accessibility etiquette',
          'Sensory-friendly zones for neurodivergent attendees',
        ],
      },
    ],
  },
  {
    id: 'inclusive-content',
    title: 'Inclusive Content & Language',
    subtitle: 'Person-first language, readability standards, and representation',
    icon: Languages,
    color: 'text-rose-500',
    badge: 'Content',
    sections: [
      {
        heading: 'Person-First Language',
        content: 'Language that puts the person before the disability or characteristic, respecting individual identity.',
        table: {
          headers: ['Avoid', 'Preferred'],
          rows: [
            ['Handicapped parking', 'Accessible parking'],
            ['Wheelchair-bound', 'Wheelchair user / uses a wheelchair'],
            ['Suffers from autism', 'Is autistic / has autism (ask preference)'],
            ['The blind', 'People who are blind / blind people'],
            ['Normal / able-bodied', 'Non-disabled'],
            ['Manpower', 'Workforce / team'],
            ['Blind spot', 'Oversight / gap / missed area'],
            ['Falling on deaf ears', 'Being ignored / going unheard'],
          ],
        },
      },
      {
        heading: 'Readability Standards',
        content: 'Content readability directly impacts cognitive accessibility. BrandHub enforces Grade 8 readability for public-facing brand content.',
        bullets: [
          'Target: Flesch-Kincaid Grade Level ≤ 8 for public content',
          'Short sentences: 15–20 words maximum',
          'Active voice preferred over passive voice',
          'One idea per paragraph',
          'Use bullet points for complex information',
          'Define technical terms on first use',
          'Avoid jargon, idioms, and acronyms without explanation',
        ],
        platformTools: ['Bias Scanner (Language Dimension)', 'Brand Intelligence readability metrics'],
      },
      {
        heading: 'Visual Representation',
        content: 'Ensure brand imagery authentically represents diverse communities without relying on stereotypes or tokenism.',
        bullets: [
          'PI&E "Who Else?" framework: audit who is present and who is missing',
          'WFA Creative Litmus Test: 12-step stereotype evaluation',
          'Avoid power hierarchy tropes in group compositions',
          'Representation across: age, gender, ethnicity, ability, body type',
          'Photojournalistic style over staged corporate imagery',
          'No tokenism — meaningful inclusion, not checkbox diversity',
        ],
      },
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring & Monitoring',
    subtitle: 'How BrandHub measures and tracks accessibility progress',
    icon: Target,
    color: 'text-cyan-500',
    badge: 'Analytics',
    sections: [
      {
        heading: 'Scoring Thresholds',
        content: 'All accessibility and bias scores use a consistent 0–100 scale with three thresholds.',
        table: {
          headers: ['Range', 'Rating', 'Action Required'],
          rows: [
            ['80–100', 'Excellent (Green)', 'Strong inclusive practices. Minor refinements recommended.'],
            ['60–79', 'Needs Attention (Yellow)', 'Gaps in accessibility or representation. Review findings.'],
            ['Below 60', 'Critical (Red)', 'Significant issues detected. Immediate action recommended.'],
          ],
        },
      },
      {
        heading: 'Where Scores Appear',
        content: 'Accessibility and compliance scores are surfaced throughout the platform for continuous awareness.',
        bullets: [
          'Portal Brand Cards — compliance badge (shield icon) permanently visible',
          'Brand Editor Hero — score badge next to entity name',
          'Admin Analytics Table — color-coded scores per entity',
          'Admin Dashboard → Bias Awareness — org-wide KPIs and dimension averages',
          'Admin Dashboard → Accessibility Standards — WCAG/ADA/EAA readiness',
          'Health Snapshots — longitudinal score tracking over 12+ months',
        ],
      },
      {
        heading: 'Automated Monitoring',
        content: 'BrandHub provides continuous accessibility monitoring without manual intervention.',
        bullets: [
          'Auto-Compliance: scans trigger on every brand guide save (5s debounce)',
          'Health Snapshots: periodic scores captured for trend analysis',
          'Intelligence Alerts: notifications when scores drop below thresholds',
          'Executive Digests: automated summary reports with accessibility trends',
          'Scheduled Intelligence: configurable cadence (daily/weekly/monthly)',
        ],
      },
      {
        heading: 'Standards & Framework References',
        content: 'The frameworks and standards underlying BrandHub\'s accessibility evaluation.',
        table: {
          headers: ['Framework', 'Organization', 'Purpose'],
          rows: [
            ['WCAG 2.2', 'W3C', 'Global digital accessibility standard (A/AA/AAA)'],
            ['Microsoft Inclusive Design', 'Microsoft', 'Persona Spectrum for permanent/temporary/situational needs'],
            ['PI&E "Who Else?"', 'PI&E', 'Representation audit for imagery and content'],
            ['WFA Creative Litmus Test', 'World Federation of Advertisers', '12-step stereotype and authenticity checklist'],
            ['ADA/IBC', 'US Dept. of Justice', 'Physical and digital public accommodation standards'],
            ['Nayatani H-K Model', 'CIE', 'Perceived brightness correction for saturated colors'],
            ['EN 301 549', 'ETSI', 'European ICT accessibility requirements'],
          ],
        },
      },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

interface BiasAccessibilitySectionProps {
  searchQuery?: string;
}

export function BiasAccessibilitySection({ searchQuery = '' }: BiasAccessibilitySectionProps) {
  const q = searchQuery.toLowerCase();
  const [activeCard, setActiveCard] = useState<CategoryCard | null>(null);

  const matchesSearch = (text: string) => !q || text.toLowerCase().includes(q);

  const filteredCategories = categories.filter(cat =>
    matchesSearch(cat.title) ||
    matchesSearch(cat.subtitle) ||
    cat.sections.some(s =>
      matchesSearch(s.heading) ||
      matchesSearch(s.content) ||
      (s.bullets || []).some(b => matchesSearch(b))
    )
  );

  if (filteredCategories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No results found for "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Introduction */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-bold text-foreground">Accessibility & Inclusive Design</h2>
          <Badge variant="secondary" className="ml-2">2026 Standards</Badge>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-3xl">
          BrandHub provides end-to-end accessibility governance — from WCAG 2.2 digital compliance to ADA physical venue standards, 
          inclusive language enforcement, and AI-powered bias detection. Explore each area below to understand what's covered, 
          what's required, and which platform tools enforce each standard.
        </p>
      </div>

      {/* Interactive Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.id}
              className="border-border/50 bg-card/50 hover:bg-card/80 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setActiveCard(cat)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl bg-muted/50 ${cat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {cat.badge && (
                    <Badge variant="outline" className="text-xs">{cat.badge}</Badge>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cat.subtitle}</p>
                </div>
                <div className="flex items-center text-xs text-muted-foreground group-hover:text-accent transition-colors">
                  <span>{cat.sections.length} sections</span>
                  <ArrowRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Reference: Compliance Levels */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          Quick Reference: Compliance Levels
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 space-y-2">
              <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Level A</Badge>
              <p className="font-medium text-sm text-foreground">Minimum</p>
              <p className="text-xs text-muted-foreground">
                Baseline requirements. Text alternatives, keyboard access, no seizure-inducing content, page titles.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-accent/5 ring-1 ring-accent/20">
            <CardContent className="p-4 space-y-2">
              <Badge className="bg-accent/10 text-accent hover:bg-accent/20">Level AA ★</Badge>
              <p className="font-medium text-sm text-foreground">Recommended Standard</p>
              <p className="text-xs text-muted-foreground">
                4.5:1 contrast, text resizing, consistent navigation, error prevention. The legal standard in most jurisdictions.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 space-y-2">
              <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">Level AAA</Badge>
              <p className="font-medium text-sm text-foreground">Enhanced</p>
              <p className="text-xs text-muted-foreground">
                7:1 contrast, sign language, Grade 8 readability, no timing. Leadership in inclusive design.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Reference: Regulatory Readiness */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          Regulatory Readiness
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'WCAG 2.2', region: 'Global', icon: Globe2 },
            { label: 'ADA Title III', region: 'United States', icon: Landmark },
            { label: 'EAA 2025', region: 'European Union', icon: MapPin },
            { label: 'Section 508', region: 'US Federal', icon: FileText },
          ].map(reg => (
            <Card key={reg.label} className="border-border/50 bg-card/50">
              <CardContent className="p-3 text-center space-y-1">
                <reg.icon className="h-5 w-5 mx-auto text-accent" />
                <p className="font-medium text-xs text-foreground">{reg.label}</p>
                <p className="text-[10px] text-muted-foreground">{reg.region}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Scoring Thresholds */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" />
          Scoring Thresholds
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-emerald-500/5">
            <CardContent className="p-4 text-center space-y-1">
              <div className="text-2xl font-bold text-emerald-500">80–100</div>
              <div className="text-sm font-medium text-foreground">Excellent</div>
              <p className="text-xs text-muted-foreground">Strong inclusive practices. Minor refinements recommended.</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-amber-500/5">
            <CardContent className="p-4 text-center space-y-1">
              <div className="text-2xl font-bold text-amber-500">60–79</div>
              <div className="text-sm font-medium text-foreground">Needs Attention</div>
              <p className="text-xs text-muted-foreground">Gaps in accessibility or representation. Review findings.</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-red-500/5">
            <CardContent className="p-4 text-center space-y-1">
              <div className="text-2xl font-bold text-red-500">Below 60</div>
              <div className="text-sm font-medium text-foreground">Critical</div>
              <p className="text-xs text-muted-foreground">Significant issues detected. Immediate action recommended.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!activeCard} onOpenChange={() => setActiveCard(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          {activeCard && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted/50 ${activeCard.color}`}>
                    <activeCard.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">{activeCard.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{activeCard.subtitle}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <Accordion type="multiple" defaultValue={activeCard.sections.map((_, i) => `section-${i}`)} className="space-y-2">
                  {activeCard.sections.map((section, idx) => (
                    <AccordionItem
                      key={idx}
                      value={`section-${idx}`}
                      className="border border-border/50 rounded-lg px-4 bg-card/30"
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-medium text-foreground text-sm">{section.heading}</span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>

                        {section.bullets && (
                          <ul className="space-y-1.5">
                            {section.bullets.map((bullet, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {section.table && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border border-border/50 rounded-lg overflow-hidden">
                              <thead>
                                <tr className="bg-muted/50">
                                  {section.table.headers.map((h, i) => (
                                    <th key={i} className="text-left p-2 font-semibold text-foreground">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {section.table.rows.map((row, i) => (
                                  <tr key={i} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                                    {row.map((cell, j) => (
                                      <td key={j} className={`p-2 ${j === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {section.platformTools && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-xs text-muted-foreground font-medium">BrandHub tools:</span>
                            {section.platformTools.map((tool, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{tool}</Badge>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

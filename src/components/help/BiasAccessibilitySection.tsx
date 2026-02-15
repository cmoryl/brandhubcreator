/**
 * BiasAccessibilitySection — In-depth reference guide for Bias Awareness & Accessibility standards.
 * Rendered as a dedicated tab in the Knowledge Base page.
 */

import { 
  Scale, Accessibility, Eye, Blend, Globe2, AudioLines, Brain, 
  ListChecks, Fingerprint, HeartHandshake, Type, ScanSearch,
  ChevronRight, Shield, Users, Palette, CheckCircle2, AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface StandardItem {
  title: string;
  description: string;
  details: string[];
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

const biasStandards: StandardItem[] = [
  {
    title: 'Language Bias Analysis',
    description: 'AI evaluates all textual content for inclusive terminology, gendered language, ableist phrases, and culturally insensitive expressions.',
    badge: 'Dimension 1',
    details: [
      'Scans brand descriptions, taglines, messaging, and voice guidelines',
      'Flags gendered terms (e.g., "manpower") and suggests neutral alternatives (e.g., "workforce")',
      'Detects ableist language (e.g., "blind spot", "fall on deaf ears") with context-aware severity',
      'Identifies cultural assumptions embedded in idioms and metaphors',
      'Evaluates reading level using Flesch-Kincaid — targets Grade 8 or below for public-facing content',
      'Checks for age-related bias and socioeconomic assumptions',
    ],
  },
  {
    title: 'Visual Representation Analysis',
    description: 'Evaluates brand imagery for diversity, stereotypes, power dynamics, and authentic representation.',
    badge: 'Dimension 2',
    details: [
      'Audits imagery using the PI&E "Who Else?" framework — asking who is represented and who is missing',
      'Applies the WFA (World Federation of Advertisers) litmus test for stereotype detection',
      'Evaluates power hierarchies — who is positioned as authority vs. subordinate in group imagery',
      'Detects common tropes: tokenism, "inspiration porn", savior narratives, and exoticization',
      'Assesses representation across age, gender, ethnicity, ability, and body type',
      'Recommends photojournalistic style over staged corporate imagery for authenticity',
    ],
  },
  {
    title: 'Accessibility Compliance (WCAG 2.2)',
    description: 'Automated checks against Web Content Accessibility Guidelines ensuring digital brand materials are usable by everyone.',
    badge: 'Dimension 3',
    details: [
      'Color contrast verification: minimum 4.5:1 (AA) and 7:1 (AAA) ratios using OKLCH perceptual model',
      'Focus state visibility and keyboard navigation support',
      'Touch target sizing: minimum 44×44px for interactive elements',
      'Text readability: font size, line height, letter spacing, and paragraph width recommendations',
      'Alt-text presence and quality assessment for all imagery',
      'Motion sensitivity: checks for `prefers-reduced-motion` support and animation controls',
      'Form accessibility: label associations, error messaging, and input descriptions',
    ],
  },
  {
    title: 'AI Governance & Responsible Usage',
    description: 'Evaluates how AI-generated content is disclosed, monitored, and governed within brand materials.',
    badge: 'Dimension 4',
    details: [
      'Checks for AI content disclosure and transparency statements',
      'Evaluates human oversight mechanisms in AI-assisted workflows',
      'Assesses data privacy considerations in AI training materials',
      'Reviews bias mitigation strategies in AI-generated imagery and copy',
      'Monitors for AI hallucination risks in brand facts and statistics',
      'Validates that AI suggestions are reviewed before publication',
    ],
  },
];

const colorAccessibilityDetails = [
  {
    title: 'OKLCH Perceptual Color Model',
    icon: Palette,
    content: 'BrandHub uses the OKLCH (Oklab Lightness, Chroma, Hue) color space for perceptually uniform contrast calculations. Unlike sRGB-based checks, OKLCH accounts for how humans actually perceive brightness differences, providing more accurate contrast ratios — especially for saturated colors where traditional checks often fail.',
  },
  {
    title: 'Colorblind Simulations',
    icon: Eye,
    content: 'Preview your brand palette under four types of color vision deficiency: Protanopia (red-blind, ~1% of males), Deuteranopia (green-blind, ~5% of males), Tritanopia (blue-blind, very rare), and Achromatopsia (complete color blindness). The platform flags palette combinations that become indistinguishable under any simulation.',
  },
  {
    title: 'Helmholtz-Kohlrausch (H-K) Effect',
    icon: Blend,
    content: 'Highly saturated colors appear brighter than their measured luminance suggests — this is the H-K effect. BrandHub applies Nayatani model correction to account for perceived brightness, preventing false "pass" results on contrast checks for vivid brand colors like saturated reds, blues, and purples.',
  },
  {
    title: 'Global Cultural Symbolism Map',
    icon: Globe2,
    content: 'Colors carry different cultural meanings worldwide. Red symbolizes luck in China but mourning in South Africa. White represents purity in Western markets but death in many East Asian cultures. The Cultural Symbolism Map covers 7+ major markets and flags conflicts before you launch regionally.',
  },
  {
    title: 'Tonal Harmony Engine',
    icon: ScanSearch,
    content: 'A hue-based classification system that categorizes your palette as Analogous, Complementary, Triadic, Split-Complementary, or Custom. This helps ensure intentional color relationships and identifies when palettes drift into clashing combinations that reduce readability.',
  },
  {
    title: 'Adaptive Motion Controls',
    icon: AudioLines,
    content: 'Some users experience vestibular disorders triggered by parallax scrolling, auto-playing animations, or rapid transitions. BrandHub evaluates whether brand materials include `prefers-reduced-motion` support and provides built-in pause/reduce controls for all animated elements.',
  },
];

const personaSpectrumData = [
  {
    dimension: 'Vision',
    permanent: 'Blind',
    temporary: 'Cataract recovery',
    situational: 'Distracted driver',
    criteria: 'Alt-text on images, high contrast ratios (7:1), scalable text, no color-only information',
  },
  {
    dimension: 'Mobility',
    permanent: 'Limb difference',
    temporary: 'Broken arm',
    situational: 'Holding a child',
    criteria: 'Responsive layouts, 44px touch targets, keyboard navigation, one-hand operation support',
  },
  {
    dimension: 'Hearing',
    permanent: 'Deaf',
    temporary: 'Ear infection',
    situational: 'Noisy environment',
    criteria: 'Captions on video, visual indicators for audio cues, text alternatives for voice content',
  },
  {
    dimension: 'Speech',
    permanent: 'Non-verbal',
    temporary: 'Laryngitis',
    situational: 'Heavy accent',
    criteria: 'Chat/text alternatives to voice, no voice-only interfaces, multiple input methods',
  },
  {
    dimension: 'Cognitive',
    permanent: 'Learning disability',
    temporary: 'Concussion',
    situational: 'Information overload',
    criteria: 'Plain language (Grade 8), clear navigation, consistent layout, minimal cognitive load',
  },
];

const frameworkReferences = [
  { name: 'WCAG 2.2', org: 'W3C', description: 'Web Content Accessibility Guidelines — the global standard for digital accessibility with levels A, AA, and AAA.' },
  { name: 'Microsoft Inclusive Design', org: 'Microsoft', description: 'Persona Spectrum methodology recognizing permanent, temporary, and situational disabilities for universal design.' },
  { name: 'PI&E "Who Else?" Framework', org: 'PI&E', description: 'A representation audit asking who is present, who is missing, and how people are portrayed in brand imagery.' },
  { name: 'WFA Creative Litmus Test', org: 'World Federation of Advertisers', description: '12-step checklist evaluating creative work for stereotypes, authenticity, and inclusive storytelling.' },
  { name: 'ADA/IBC Physical Standards', org: 'ADA / International Building Code', description: 'Door widths, corridor clearances, and wayfinding standards for accessible event venues and physical spaces.' },
  { name: 'Nayatani H-K Model', org: 'CIE', description: 'Mathematical model correcting for the Helmholtz-Kohlrausch effect — perceived brightness of saturated colors.' },
];

interface BiasAccessibilitySectionProps {
  searchQuery?: string;
}

export function BiasAccessibilitySection({ searchQuery = '' }: BiasAccessibilitySectionProps) {
  const q = searchQuery.toLowerCase();
  
  const matchesSearch = (text: string) => !q || text.toLowerCase().includes(q);
  
  const filteredBiasStandards = biasStandards.filter(s => 
    matchesSearch(s.title) || matchesSearch(s.description) || s.details.some(d => matchesSearch(d))
  );

  const filteredColorDetails = colorAccessibilityDetails.filter(d =>
    matchesSearch(d.title) || matchesSearch(d.content)
  );

  const filteredPersona = personaSpectrumData.filter(p =>
    matchesSearch(p.dimension) || matchesSearch(p.criteria) || matchesSearch(p.permanent) || matchesSearch(p.temporary) || matchesSearch(p.situational)
  );

  const filteredFrameworks = frameworkReferences.filter(f =>
    matchesSearch(f.name) || matchesSearch(f.org) || matchesSearch(f.description)
  );

  const hasResults = filteredBiasStandards.length > 0 || filteredColorDetails.length > 0 || filteredPersona.length > 0 || filteredFrameworks.length > 0;

  if (!hasResults) {
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
          <h2 className="text-2xl font-bold text-foreground">Bias Awareness & Accessibility</h2>
          <Badge variant="secondary" className="ml-2">2026 Standards</Badge>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-3xl">
          BrandHub evaluates your brand content against modern inclusive governance standards. 
          Every scan produces scores across four dimensions, a Persona Spectrum coverage grid, 
          and actionable findings — ensuring your brands are accessible, representative, and culturally aware.
        </p>
      </div>

      {/* Four Dimensions of Bias Scanning */}
      {filteredBiasStandards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-accent" />
            Four Dimensions of Bias Scanning
          </h3>
          <Accordion type="multiple" className="space-y-2">
            {filteredBiasStandards.map((standard, idx) => (
              <AccordionItem
                key={idx}
                value={`bias-${idx}`}
                className="border border-border/50 rounded-lg px-4 bg-card/50"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">{standard.title}</span>
                    {standard.badge && (
                      <Badge variant="outline" className="text-xs">{standard.badge}</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-muted-foreground">{standard.description}</p>
                  <ul className="space-y-2">
                    {standard.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* Color Accessibility Deep Dive */}
      {filteredColorDetails.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Blend className="h-5 w-5 text-accent" />
            Color Accessibility Deep Dive
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredColorDetails.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="border-border/50 bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.content}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Persona Spectrum */}
      {filteredPersona.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-accent" />
            Microsoft Persona Spectrum
          </h3>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Based on Microsoft's Inclusive Design methodology. Rather than designing for a single "average" user, 
            the Persona Spectrum considers the full range of human diversity — recognizing that disability is a 
            mismatch between a person and their environment, not a personal attribute.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border/50 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-semibold text-foreground">Dimension</th>
                  <th className="text-left p-3 font-semibold text-foreground">Permanent</th>
                  <th className="text-left p-3 font-semibold text-foreground">Temporary</th>
                  <th className="text-left p-3 font-semibold text-foreground">Situational</th>
                  <th className="text-left p-3 font-semibold text-foreground">Coverage Criteria</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersona.map((row, idx) => (
                  <tr key={idx} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{row.dimension}</td>
                    <td className="p-3 text-muted-foreground">{row.permanent}</td>
                    <td className="p-3 text-muted-foreground">{row.temporary}</td>
                    <td className="p-3 text-muted-foreground">{row.situational}</td>
                    <td className="p-3 text-muted-foreground text-xs">{row.criteria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scoring & Thresholds */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          Scoring & Thresholds
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-emerald-500/5">
            <CardContent className="p-4 text-center space-y-1">
              <div className="text-2xl font-bold text-emerald-500">80–100</div>
              <div className="text-sm font-medium text-foreground">Excellent</div>
              <p className="text-xs text-muted-foreground">Strong inclusive practices across all dimensions. Minor refinements recommended.</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-amber-500/5">
            <CardContent className="p-4 text-center space-y-1">
              <div className="text-2xl font-bold text-amber-500">60–79</div>
              <div className="text-sm font-medium text-foreground">Needs Attention</div>
              <p className="text-xs text-muted-foreground">Some gaps in accessibility or representation. Review findings and address warnings.</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-red-500/5">
            <CardContent className="p-4 text-center space-y-1">
              <div className="text-2xl font-bold text-red-500">Below 60</div>
              <div className="text-sm font-medium text-foreground">Critical</div>
              <p className="text-xs text-muted-foreground">Significant accessibility or bias issues detected. Immediate action recommended.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* WFA Creative Checklist */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-accent" />
          WFA Creative Checklist (12 Steps)
        </h3>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Does the creative reflect real people, not stereotypes?</li>
              <li>Are diverse identities represented authentically?</li>
              <li>Is anyone portrayed in a limiting or diminishing role?</li>
              <li>Would the subject of the creative feel respected?</li>
              <li>Does the narrative avoid savior or victim tropes?</li>
              <li>Are cultural references accurate and respectful?</li>
              <li>Is the creative accessible to people with disabilities?</li>
              <li>Does imagery avoid tokenism or superficial inclusion?</li>
              <li>Are power dynamics balanced in group compositions?</li>
              <li>Is language free of gendered, ableist, or exclusionary terms?</li>
              <li>Does the creative work across cultural contexts?</li>
              <li>Has the work been reviewed by people from represented communities?</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Framework References */}
      {filteredFrameworks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Info className="h-5 w-5 text-accent" />
            Standards & Framework References
          </h3>
          <div className="space-y-2">
            {filteredFrameworks.map((fw, idx) => (
              <Card key={idx} className="border-border/50 bg-card/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">{fw.org}</Badge>
                  <div>
                    <p className="font-medium text-sm text-foreground">{fw.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fw.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Where to Find Reports */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Brain className="h-5 w-5 text-accent" />
          Where to Find Reports
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 space-y-2">
              <p className="font-medium text-sm text-foreground">Admin Dashboard</p>
              <p className="text-xs text-muted-foreground">
                "Bias Awareness" tab with org-wide KPIs, dimension averages, and an entity scores table with expandable detail rows.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 space-y-2">
              <p className="font-medium text-sm text-foreground">Insights & Updates</p>
              <p className="text-xs text-muted-foreground">
                Bias scan results appear as insight cards with deep-dive dialogs showing full findings, scores, and recommendations.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4 space-y-2">
              <p className="font-medium text-sm text-foreground">Entity Editors</p>
              <p className="text-xs text-muted-foreground">
                Trigger scans directly from brand, product, or event editors. Results persist in the database for historical tracking.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

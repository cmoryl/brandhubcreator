/**
 * Getting Started Guide
 * Step-by-step walkthrough for creating your first brand page
 * Targets: team members, public visitors, new users
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Circle, ChevronRight, Play, BookOpen, 
  Palette, Type, Image, Globe, Layers, ArrowRight,
  Sparkles, FileText, Users, Settings, Eye, Rocket,
  Pause, Volume2, VolumeX
} from 'lucide-react';

import step1Video from '@/assets/videos/step-1-organization.mp4';
import step2Video from '@/assets/videos/step-2-brand.mp4';
import step3Video from '@/assets/videos/step-3-colors.mp4';
import step4Video from '@/assets/videos/step-4-typography.mp4';
import step5Video from '@/assets/videos/step-5-logos.mp4';
import step6Video from '@/assets/videos/step-6-voice.mp4';
import step7Video from '@/assets/videos/step-7-team.mp4';
import step8Video from '@/assets/videos/step-8-publish.mp4';

const STEP_VIDEOS = [
  step1Video, step2Video, step3Video, step4Video,
  step5Video, step6Video, step7Video, step8Video,
];
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface GuideStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  details: string[];
  icon: React.ElementType;
  videoPlaceholder: string;
  tip?: string;
  duration: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 1,
    title: 'Create Your Organization',
    subtitle: 'Set up your workspace',
    description: 'Start by creating an organization — this is your central hub where all brands, products, and events live. Think of it as your company\'s digital brand home. Every team member, asset, and guideline lives under this umbrella.',
    details: [
      'Sign up or log in to your BrandHub account using email or Google SSO',
      'Navigate to Settings → Organization and click "Create New Organization"',
      'Enter your organization name — this appears across the platform and in shared links',
      'Customize your slug (URL-friendly name) — this becomes your public portal URL (e.g., /org/your-company)',
      'Upload your organization logo (SVG or PNG with transparent background recommended)',
      'Set your primary, secondary, and accent brand colors using hex or HSL values',
      'Optionally configure a custom domain (e.g., brands.yourdomain.com) for a fully white-labeled experience',
      'Review and save — your workspace is now ready for brands, products, and events',
    ],
    icon: Settings,
    videoPlaceholder: 'Organization Setup Walkthrough',
    tip: 'Your organization slug becomes part of your public portal URL. Choose something short and memorable. You can also hide BrandHub branding entirely under White-Label Settings.',
    duration: '3 min',
  },
  {
    id: 2,
    title: 'Launch Your First Brand',
    subtitle: 'Build your brand identity',
    description: 'Create a new brand guide within your organization. This is the cornerstone of your brand management — where you\'ll define everything from visual identity to messaging guidelines. Each brand gets its own dedicated page with a unique URL.',
    details: [
      'From your dashboard or portal, click the "Create Brand" button in the Quick Add menu',
      'Enter a brand name — a URL-friendly slug will be auto-generated (you can customize it)',
      'Set up the Hero section: upload a 16:9 cover image, write a compelling tagline, and add a description',
      'Add a card image (used for portal grid thumbnails) — use abstract photography without text overlays',
      'Configure the brand\'s metadata: industry, parent organization, and visibility settings',
      'Toggle "Public" (is_public) to make the brand visible on your organization portal grid',
      'Choose which sections to display using the section visibility controls in the sidebar',
      'Drag and reorder sections to match your preferred guide structure',
      'Save your initial setup — you can always refine each section in depth later',
    ],
    icon: Sparkles,
    videoPlaceholder: 'Brand Creation Demo',
    tip: 'Master suite brands appear at the top of your portal grid with a distinct ring/badge. Set the brand as a "Master Suite" if it\'s the umbrella brand for sub-products.',
    duration: '5 min',
  },
  {
    id: 3,
    title: 'Define Your Color Palette',
    subtitle: 'Establish visual identity',
    description: 'Colors are the emotional foundation of your brand. A well-defined palette ensures consistency across every touchpoint — from digital ads to packaging. BrandHub lets you organize colors into groups and export them as design tokens.',
    details: [
      'Navigate to the Colors section in your Brand Editor sidebar',
      'Add your primary brand color with its hex code, name, and usage description',
      'Define secondary and accent colors that complement your primary palette',
      'Create neutral/grayscale colors for backgrounds, borders, and text',
      'Organize colors into meaningful groups (e.g., Primary, Secondary, Neutrals, Alerts)',
      'Use the built-in color picker or paste hex/HSL values directly',
      'Add usage notes for each color — specify where and when each should be used',
      'Consider adding gradient definitions for modern digital applications',
      'Review color accessibility: ensure sufficient contrast ratios for text readability (WCAG 2.1 AA)',
      'Export your palette as CSS custom properties, JSON tokens, or Tailwind config via Design Tokens',
    ],
    icon: Palette,
    videoPlaceholder: 'Color Palette Setup',
    tip: 'Add at least 6-8 core colors including neutrals. These appear as preview swatches on your brand card. Use the Bias Awareness scanner to check color accessibility scores.',
    duration: '5 min',
  },
  {
    id: 4,
    title: 'Set Up Typography',
    subtitle: 'Choose your typefaces',
    description: 'Typography defines how your brand speaks visually. A clear typographic hierarchy ensures readability and consistency across all media — web, print, presentations, and social. Define families, weights, sizes, and pairing rules.',
    details: [
      'Go to the Typography section in your Brand Editor',
      'Add your primary headline font family (e.g., Poppins, Montserrat, or a custom typeface)',
      'Define your secondary body font for paragraphs and long-form content (e.g., Verdana, Inter)',
      'Specify font weights for each use case: Bold (700) for headlines, SemiBold (600) for subheads, Regular (400) for body',
      'Set a type scale with specific sizes: H1 (36-48px), H2 (28-36px), H3 (22-28px), Body (16px), Small (14px)',
      'Define line-height ratios: typically 1.2 for headlines, 1.5-1.6 for body text',
      'Add letter-spacing guidelines: tighter for large headlines, normal for body text',
      'Include pairing rules: which fonts should be used together and which to avoid',
      'Add usage notes for special contexts (captions, buttons, navigation, code blocks)',
      'Upload custom font files if using proprietary typefaces (WOFF2 recommended for web)',
    ],
    icon: Type,
    videoPlaceholder: 'Typography Configuration',
    tip: 'The platform uses Poppins (Headlines, 700), Montserrat (Sub-Headlines, 600), and Verdana (Body/Web-safe) by default. Pair a distinctive display font with a clean sans-serif body font for maximum readability.',
    duration: '4 min',
  },
  {
    id: 5,
    title: 'Upload Logos & Assets',
    subtitle: 'Add your visual assets',
    description: 'Your logo is the most recognizable element of your brand. Upload it in multiple formats and color variations, define clear space rules, and provide guidance on correct vs. incorrect usage to prevent misrepresentation.',
    details: [
      'Navigate to the Logos section in the Brand Editor and upload your primary logo',
      'Add color variations: full-color, monochrome white, monochrome black, and reversed versions',
      'Upload an icon-only version (favicon/app icon) for compact placements',
      'Define clear space rules — the minimum padding around your logo (typically 1x the logo mark height)',
      'Set minimum size requirements for print (e.g., 25mm) and digital (e.g., 120px)',
      'Add incorrect usage examples: stretching, rotating, recoloring, adding effects, busy backgrounds',
      'Upload pattern assets for backgrounds, textures, and decorative elements',
      'Add iconography guidelines: icon style, stroke width, corner radius, and grid specifications',
      'Include brand photography guidelines: mood, composition rules, and subject matter',
      'Upload files in SVG (scalable vector), PNG (transparent), and EPS/PDF (print-ready) formats',
      'Use the Image Library to organize all assets by category for easy team access',
    ],
    icon: Image,
    videoPlaceholder: 'Logo & Asset Upload Guide',
    tip: 'Always upload SVG files for scalability and PNG files with transparent backgrounds. Use the IconKIT studio to generate consistent icon sets that match your brand DNA.',
    duration: '8 min',
  },
  {
    id: 6,
    title: 'Craft Your Brand Voice',
    subtitle: 'Define tone & messaging',
    description: 'Brand voice is how your brand sounds in words. It\'s the personality that comes through in every email, social post, and webpage. Define clear voice attributes, tone variations, and provide real-world examples your team can follow.',
    details: [
      'Open the Voice & Tone section in the Brand Editor',
      'Define 3-5 core brand personality traits (e.g., Professional, Approachable, Innovative, Bold)',
      'For each trait, describe what it means and how it manifests in communication',
      'Create a "We are / We are not" framework: "We are confident, not arrogant"',
      'Define tone variations by context: formal (legal/contracts), friendly (social media), urgent (alerts)',
      'Add writing do\'s: active voice, inclusive language, specific over vague, benefit-led messaging',
      'Add writing don\'ts: jargon, passive voice, clickbait, overpromising, gendered language',
      'Include sample copy for common scenarios: email subject lines, social captions, error messages, CTAs',
      'Define key messaging pillars: 3-4 core messages your brand consistently communicates',
      'Add a glossary of preferred terms vs. terms to avoid (e.g., "customers" not "users")',
      'Use Brand Intelligence AI to analyze existing content and generate voice consistency scores',
    ],
    icon: FileText,
    videoPlaceholder: 'Brand Voice Workshop',
    tip: 'Use the DataForce Brand Assistant (supports 15+ languages) to test if new copy aligns with your defined voice. The AI will score consistency and suggest improvements.',
    duration: '6 min',
  },
  {
    id: 7,
    title: 'Invite Your Team',
    subtitle: 'Collaborate together',
    description: 'Brand consistency requires team alignment. Invite designers, marketers, copywriters, and stakeholders to your workspace. Set permissions so the right people can edit while others have read-only access to stay informed.',
    details: [
      'Go to Settings → People in your admin dashboard',
      'Click "Invite Member" and enter their email address',
      'Assign a role: Admin (full control), Editor (can modify content), or Viewer (read-only)',
      'Team members receive an email invitation with a direct link to join your workspace',
      'Admins can manage all sections, invite others, configure settings, and run AI analyses',
      'Editors can update brand content, upload assets, and modify guidelines within their scope',
      'Viewers get a clean, read-only interface — perfect for external partners and stakeholders',
      'Set up organization-level permissions for cross-brand access control',
      'Use the audit log (Settings → Activity Logs) to track all changes made by team members',
      'Consider starting with a core team of 2-3 editors and expanding as guidelines mature',
    ],
    icon: Users,
    videoPlaceholder: 'Team Collaboration Setup',
    tip: 'Use the "Pending Invites" tab to manage outstanding invitations. Admins can optionally assign new members to specific organizations during the approval workflow for immediate workspace access.',
    duration: '3 min',
  },
  {
    id: 8,
    title: 'Publish & Share',
    subtitle: 'Go live with your brand',
    description: 'Time to share your brand with the world. Publishing makes your guidelines accessible via a permanent URL. Before going live, run a final quality check, enable compliance scanning, and generate share assets for easy distribution.',
    details: [
      'Review all sections for completeness — check Colors, Typography, Logos, Voice, and any custom sections',
      'Run a DataForce AI compliance scan to ensure brand consistency across all sections',
      'Check the Brand Health Score in your admin dashboard — aim for 80%+ across all categories',
      'Toggle the brand to "Public" in the Hero settings (is_public = true)',
      'Verify the brand appears correctly on your organization portal grid with proper card image and tagline',
      'Share your portal URL (e.g., /org/your-company) with stakeholders and partners',
      'Generate a QR code from the QR Codes section for print materials, business cards, or presentations',
      'Set up GlobalLink translations if your brand operates in multiple regions or languages',
      'Create regional variants for markets requiring cultural adaptations (colors, imagery, messaging)',
      'Enable auto-compliance scanning (DataForce) to maintain brand quality as your team makes future updates',
      'Consider creating Product and Event sub-guides linked to your master brand for a complete brand ecosystem',
    ],
    icon: Globe,
    videoPlaceholder: 'Publishing Your Brand Guide',
    tip: 'Enable the Brand Intelligence module after publishing to get AI-powered insights on market positioning, competitive landscape, and growth opportunities. The system learns and improves with each analysis.',
    duration: '4 min',
  },
];

const StepCard = ({ 
  step, 
  isActive, 
  isCompleted, 
  onClick 
}: { 
  step: GuideStep; 
  isActive: boolean; 
  isCompleted: boolean;
  onClick: () => void;
}) => {
  const Icon = step.icon;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-xl border transition-all duration-300 group',
        isActive 
          ? 'bg-primary/10 border-primary/40 shadow-md ring-1 ring-primary/20' 
          : 'bg-card border-border/50 hover:border-border hover:shadow-sm',
        isCompleted && !isActive && 'opacity-75'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'mt-0.5 rounded-full p-1.5 shrink-0 transition-colors',
          isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}>
          {isCompleted ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}>
              Step {step.id}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {step.duration}
            </Badge>
          </div>
          <h3 className={cn(
            'font-semibold text-sm mt-1 transition-colors',
            isActive ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
          )}>
            {step.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {step.subtitle}
          </p>
        </div>
        <ChevronRight className={cn(
          'h-4 w-4 mt-1 shrink-0 transition-all',
          isActive ? 'text-primary translate-x-0.5' : 'text-muted-foreground/50'
        )} />
      </div>
    </button>
  );
};

const StepVideo = ({ step }: { step: GuideStep }) => {
  const Icon = step.icon;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoSrc = STEP_VIDEOS[step.id - 1];

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative aspect-video rounded-xl bg-muted/50 border border-border/50 overflow-hidden group">
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {/* Play overlay */}
      {!isPlaying && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-background/30 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg hover:bg-primary transition-colors">
            <Play className="h-7 w-7 text-primary-foreground ml-1" />
          </div>
        </button>
      )}
      {/* Controls */}
      <div className={cn(
        "absolute bottom-3 right-3 flex gap-1.5 transition-opacity",
        isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
      )}>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm" onClick={togglePlay}>
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm" onClick={() => { setIsMuted(!isMuted); if (videoRef.current) videoRef.current.muted = !isMuted; }}>
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {/* Step badge */}
      <div className="absolute top-3 left-3">
        <Badge className="bg-primary/90 text-primary-foreground text-xs gap-1">
          <Icon className="h-3 w-3" />
          Step {step.id}
        </Badge>
      </div>
    </div>
  );
};

const StepDetail = ({ step }: { step: GuideStep }) => {
  const Icon = step.icon;
  
  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <StepVideo step={step} />

      {/* Step content */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Eye className="h-3 w-3" />
            {step.duration} read
          </Badge>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{step.title}</h2>
        <p className="text-muted-foreground leading-relaxed">{step.description}</p>
      </div>

      <Separator />

      {/* Steps list */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          How to do it
        </h4>
        <ol className="space-y-3">
          {step.details.map((detail, i) => (
            <li key={i} className="flex items-start gap-3 group">
              <span className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                {i + 1}
              </span>
              <p className="text-sm text-foreground/90 leading-relaxed pt-0.5">{detail}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Tip */}
      {step.tip && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Pro Tip</p>
              <p className="text-sm text-foreground/80">{step.tip}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const GettingStarted = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleComplete = (stepIndex: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepIndex)) {
        next.delete(stepIndex);
      } else {
        next.add(stepIndex);
      }
      return next;
    });
  };

  const progress = Math.round((completedSteps.size / GUIDE_STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-xs">Getting Started</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Build Your Brand Page
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Follow this step-by-step guide to create a comprehensive, professional brand guidelines page from scratch. Estimated time: ~22 minutes.
            </p>

            {/* Progress bar */}
            <div className="mt-6 max-w-md">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{completedSteps.size} of {GUIDE_STEPS.length} steps completed</span>
                <span className="font-semibold text-primary">{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main content - sidebar + detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Steps sidebar */}
          <div className="lg:w-[340px] shrink-0">
            <div className="lg:sticky lg:top-20 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Guide Steps
              </p>
              {GUIDE_STEPS.map((step, i) => (
                <StepCard
                  key={step.id}
                  step={step}
                  isActive={activeStep === i}
                  isCompleted={completedSteps.has(i)}
                  onClick={() => setActiveStep(i)}
                />
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="flex-1 min-w-0">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  <StepDetail step={GUIDE_STEPS[activeStep]} />
                </AnimatePresence>

                {/* Navigation */}
                <Separator className="my-6" />
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-1.5',
                      completedSteps.has(activeStep) ? 'text-primary' : 'text-muted-foreground'
                    )}
                    onClick={() => toggleComplete(activeStep)}
                  >
                    {completedSteps.has(activeStep) ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Completed
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={activeStep === GUIDE_STEPS.length - 1}
                    onClick={() => setActiveStep(prev => prev + 1)}
                  >
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;

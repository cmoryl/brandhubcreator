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
    description: 'Start by creating an organization — this is your central hub where all brands, products, and events live. Think of it as your company\'s digital brand home.',
    details: [
      'Sign up or log in to your BrandHub account',
      'Navigate to Settings and create a new Organization',
      'Add your organization name, slug (URL-friendly name), and primary colors',
      'Upload your organization logo for branding consistency',
    ],
    icon: Settings,
    videoPlaceholder: 'Organization Setup Walkthrough',
    tip: 'Your organization slug becomes part of your public portal URL (e.g., /org/your-company)',
    duration: '2 min',
  },
  {
    id: 2,
    title: 'Launch Your First Brand',
    subtitle: 'Build your brand identity',
    description: 'Create a new brand guide within your organization. This is where you\'ll define everything from colors and typography to logos and brand voice.',
    details: [
      'Click "Create Brand" from your dashboard or portal',
      'Enter a brand name — a URL slug will be auto-generated',
      'Set up the Hero section with a cover image, tagline, and description',
      'Toggle "Public" to make it visible on your organization portal',
    ],
    icon: Sparkles,
    videoPlaceholder: 'Brand Creation Demo',
    tip: 'You can always change the brand name and slug later from the Brand Editor.',
    duration: '3 min',
  },
  {
    id: 3,
    title: 'Define Your Color Palette',
    subtitle: 'Establish visual identity',
    description: 'Colors are the foundation of your brand. Add your primary, secondary, and accent colors with hex values, and organize them into meaningful groups.',
    details: [
      'Navigate to the Colors section in your Brand Editor',
      'Add colors with names, hex codes, and optional descriptions',
      'Group colors into categories (Primary, Secondary, Neutral, etc.)',
      'Use the color picker or paste hex values directly',
    ],
    icon: Palette,
    videoPlaceholder: 'Color Palette Setup',
    tip: 'Add at least 4-6 core colors. These will also appear as preview swatches on your brand card in the portal.',
    duration: '3 min',
  },
  {
    id: 4,
    title: 'Set Up Typography',
    subtitle: 'Choose your typefaces',
    description: 'Define your brand\'s typographic hierarchy — from headlines to body text. Specify font families, weights, and usage guidelines.',
    details: [
      'Go to the Typography section in your Brand Editor',
      'Add your primary (headline) and secondary (body) font families',
      'Define font weights, sizes, and line heights for each use case',
      'Include usage notes for when each typeface should be used',
    ],
    icon: Type,
    videoPlaceholder: 'Typography Configuration',
    tip: 'Pair a distinctive display font with a clean sans-serif body font for maximum readability.',
    duration: '2 min',
  },
  {
    id: 5,
    title: 'Upload Logos & Assets',
    subtitle: 'Add your visual assets',
    description: 'Upload your logo in multiple formats and color variations. Add usage guidelines showing correct and incorrect applications.',
    details: [
      'Navigate to the Logos section and upload your primary logo',
      'Add variations: full color, white, black, and icon-only versions',
      'Specify clear space rules and minimum size requirements',
      'Upload additional assets like patterns, icons, and imagery',
    ],
    icon: Image,
    videoPlaceholder: 'Logo & Asset Upload Guide',
    tip: 'Upload SVG files for scalability and PNG files with transparent backgrounds for versatility.',
    duration: '5 min',
  },
  {
    id: 6,
    title: 'Craft Your Brand Voice',
    subtitle: 'Define tone & messaging',
    description: 'Establish your brand\'s personality through voice and tone guidelines. Define how your brand communicates across different channels and contexts.',
    details: [
      'Open the Voice & Tone section in the Brand Editor',
      'Define your brand personality traits (e.g., Professional, Friendly, Bold)',
      'Add do\'s and don\'ts for brand communication',
      'Include sample copy for different scenarios (social media, email, web)',
    ],
    icon: FileText,
    videoPlaceholder: 'Brand Voice Workshop',
    tip: 'Use the Brand Intelligence AI to analyze your existing content and suggest voice guidelines.',
    duration: '4 min',
  },
  {
    id: 7,
    title: 'Invite Your Team',
    subtitle: 'Collaborate together',
    description: 'Bring your team on board. Invite designers, marketers, and stakeholders to collaborate on your brand guidelines.',
    details: [
      'Go to Settings → People to invite team members',
      'Assign roles: Admin, Editor, or Viewer',
      'Team members receive an email invitation to join',
      'Admins can manage sections, while viewers get read-only access',
    ],
    icon: Users,
    videoPlaceholder: 'Team Collaboration Setup',
    tip: 'Start with a small core team and expand access as your guidelines mature.',
    duration: '2 min',
  },
  {
    id: 8,
    title: 'Publish & Share',
    subtitle: 'Go live with your brand',
    description: 'Make your brand guidelines public and share them with the world. Your portal URL is your brand\'s permanent home on the web.',
    details: [
      'Review all sections for completeness',
      'Toggle the brand to "Public" in the Hero settings',
      'Share your portal URL with stakeholders and partners',
      'Use the QR code generator for print materials or presentations',
    ],
    icon: Globe,
    videoPlaceholder: 'Publishing Your Brand Guide',
    tip: 'Enable DataForce AI compliance scanning to ensure brand consistency before publishing.',
    duration: '1 min',
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

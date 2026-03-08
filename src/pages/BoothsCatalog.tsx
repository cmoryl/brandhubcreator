import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, FlaskConical, Scale, Shield, Monitor, Film, Gamepad2, 
  Radio, Heart, Database, Microscope, Globe, X, ChevronLeft, ChevronRight,
  Mail, ExternalLink, ArrowLeft, Plus, Pencil, Trash2, Loader2, BarChart3, Settings, ZoomIn, ChevronDown, Upload, RotateCcw, Type, Download, ArrowUpDown, Ruler, Brain, Check,
  LogOut, User, HelpCircle, LayoutDashboard, Box, MapPin
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PreviewDialog } from "@/components/ui/preview-dialog";
// ScrollArea removed - using native overflow for mobile compatibility
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBoothDownloadLinks } from "@/hooks/useBoothDownloadLinks";

import { useBoothVariantInfo } from "@/hooks/useBoothVariantInfo";
import { useBoothQRCodes } from "@/hooks/useBoothQRCodes";
import { useBoothProductionSpecs } from "@/hooks/useBoothProductionSpecs";
import { useBoothImages } from "@/hooks/useBoothImages";
import { useBoothServices } from "@/hooks/useBoothServices";
import { useCustomDivisions, type CustomDivision } from "@/hooks/useCustomDivisions";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePageHeroSettings } from "@/hooks/usePageHeroSettings";
import { BoothContentManager } from "@/components/booths/BoothContentManager";
import { BoothGalleryManager } from "@/components/booths/BoothGalleryManager";
import { BoothAIAnalysis } from "@/components/booths/BoothAIAnalysis";
import { BoothColorAnalysisPanel } from "@/components/booths/BoothColorAnalysisPanel";
import { GlitchText } from "@/components/ui/GlitchText";
import { BrandHubLogo } from "@/components/BrandHubLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

import { HeroEditToolbar, HeroEffectType } from "@/components/brand/HeroEditToolbar";
import { GradientBarsHero } from "@/components/backgrounds/GradientBarsHero";
import { HorizonGlowHero } from "@/components/backgrounds/HorizonGlowHero";
import { FloatingOrbsHero } from "@/components/backgrounds/FloatingOrbsHero";
import { GradientSpheresHero } from "@/components/backgrounds/GradientSpheresHero";
import { ImageOrbsHero } from "@/components/backgrounds/ImageOrbsHero";
import { ImagePanelsHero } from "@/components/backgrounds/ImagePanelsHero";

const LazyBoothMapper3D = lazy(() => import("@/components/booths/booth3d/BoothMapper3D").then(m => ({ default: m.BoothMapper3D })));
export interface BoothDivision {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  color: string;
  email: string;
  website: string;
  services: string[];
  stats?: { label: string; value: string }[];
  images: string[];
  variants: { label: string; image: string }[];
  boothColors?: string[];
  downloadLinks?: { label: string; url: string }[];
  boothContent?: { heading: string; bullets: string[] }[];
}

export const DIVISIONS: BoothDivision[] = [
  {
    id: "corporate",
    name: "Corporate",
    tagline: "The Language of Global Business",
    description: "Any Customer. Any Language. Any Channel. TransPerfect Corporate delivers efficient translation, real-time analytics, and improved user experience across all channels.",
    icon: Building2,
    color: "hsl(200, 85%, 45%)",
    boothColors: ["#0a3d5c", "#0d6eab", "#139cd8", "#3ab8e8", "#7ed3f2", "#c4ecfa"],
    email: "info@transperfect.com",
    website: "www.transperfect.com",
    services: ["Efficient Translation", "Analytics & Insights", "Real-Time Updates", "User Experience", "Accessibility", "Same-Day Services", "Telephonic Support", "Boutique Interpretation", "Healthcare Innovation"],
    stats: [{ label: "Languages", value: "170+" }, { label: "Offices", value: "100+" }],
    images: ["/booths/corporate-dark.jpg", "/booths/corporate-lite.jpg", "/booths/corporate-custom.jpg"],
    variants: [
      { label: "Dark Theme", image: "/booths/corporate-dark.jpg" },
      { label: "Lite Theme", image: "/booths/corporate-lite.jpg" },
      { label: "Custom / Ryanair", image: "/booths/corporate-custom.jpg" },
    ],
    boothContent: [
      { heading: "Core Messaging", bullets: ["The Language of Global Business", "Any Customer. Any Language. Any Channel.", "Any Member, Any Language. Any Format Every Time", "Engage Locally, Grow Globally"] },
      { heading: "Key Capabilities", bullets: ["Efficient Translation", "Analytics & Insights", "Real-Time Updates", "Improved User Experience & Management", "Accessibility", "Same-Day Services", "Telephonic Support", "Boutique Interpretation"] },
      { heading: "Healthcare Innovation", bullets: ["Dedicated healthcare innovation division", "Contact: healthcareinnovation@transperfect.com"] },
    ],
  },
  {
    id: "life-sciences",
    name: "Life Sciences",
    tagline: "Simplify Your Path From Lab to Launch",
    description: "End-to-end language and technology solutions for pharmaceutical, biotech, and medical device companies—from clinical trials through global product launch.",
    icon: FlaskConical,
    color: "hsl(195, 80%, 40%)",
    boothColors: ["#0b3a4a", "#0e6680", "#1295b6", "#38b4d4", "#74d0e8", "#b8e8f4"],
    email: "lifesciences@transperfect.com",
    website: "lifesciences.transperfect.com",
    services: ["Regulatory Affairs & Labeling", "COA/eCOA & Digital Health", "Patient Recruitment", "Global Product Launch", "Medical Writing", "AI/ML Automation & Translation", "Training & Development", "Pharmacovigilance", "eClinical & CTD eSubmission", "Literature Monitoring"],
    stats: [{ label: "Top-10 Pharmas Served", value: "10 of 10" }, { label: "Languages", value: "170+" }, { label: "Worldwide Offices", value: "100+" }],
    images: ["/booths/lifesciences-1.jpg", "/booths/lifesciences-2.jpg", "/booths/lifesciences-3.jpg", "/booths/lifesciences-china.jpg", "/booths/lifesciences-4.jpg", "/booths/lifesciences-5.jpg"],
    variants: [
      { label: "General / Icons", image: "/booths/lifesciences-1.jpg" },
      { label: "R&D / Commercial", image: "/booths/lifesciences-2.jpg" },
      { label: "Large Booth", image: "/booths/lifesciences-3.jpg" },
      { label: "China Market", image: "/booths/lifesciences-china.jpg" },
      { label: "Tabletop Dark", image: "/booths/lifesciences-4.jpg" },
      { label: "Tabletop Lite", image: "/booths/lifesciences-5.jpg" },
    ],
    boothContent: [
      { heading: "Core Messaging", bullets: ["Simplify Your Path From Lab to Launch", "10 of Top-10 Pharmas, CROs, Biotechs", "100+ Worldwide Offices", "170+ Language Support"] },
      { heading: "R&D Services", bullets: ["Regulatory Affairs & Labeling", "COA/eCOA & Digital Health", "Patient Recruitment", "Medical Writing", "AI/ML Automation & Translation", "eClinical & CTD eSubmission", "Linguistic Validation & eCOA"] },
      { heading: "Commercial Services", bullets: ["Global Product Launch", "Training & Development", "Pharmacovigilance", "Literature Monitoring", "Digital Health", "Digital Marketing", "Regulatory Consulting", "Training & eLearning"] },
      { heading: "China Market", bullets: ["AI Technology & Consulting", "Translation", "TMF Service", "Medical Writing", "Official WeChat integration"] },
    ],
  },
  {
    id: "legal",
    name: "Legal",
    tagline: "The Global Leader in Legal Technology & Support",
    description: "Faster case outcomes through innovative legal technology, strategic industry expertise, and seamless multilingual support.",
    icon: Scale,
    color: "hsl(210, 70%, 35%)",
    boothColors: ["#0f2440", "#1a3a66", "#2a5a8f", "#4a7ab8", "#7da3d4", "#b8cceb"],
    email: "legal@transperfect.com",
    website: "www.transperfectlegal.com",
    services: ["Faster Case Outcomes", "Innovative Legal Technology", "Strategic Industry Expertise", "Seamless Multilingual Support", "eDiscovery", "Forensic Technology", "Managed Review"],
    images: ["/booths/legal.jpg"],
    variants: [{ label: "Standard", image: "/booths/legal.jpg" }],
    
    boothContent: [
      { heading: "Core Messaging", bullets: ["The Global Leader in Legal Technology & Support"] },
      { heading: "Key Differentiators", bullets: ["Faster Case Outcomes", "Innovative Legal Technology", "Strategic Industry Expertise", "Seamless Multilingual Support"] },
      { heading: "Services", bullets: ["eDiscovery", "Forensic Technology", "Managed Review"] },
    ],
  },
  {
    id: "ip",
    name: "IP (Intellectual Property)",
    tagline: "Protect Your IP in Any Country",
    description: "Leverage global patent expertise, streamline filing processes, and accelerate translation timelines with AI-powered GlobalLink solutions.",
    icon: Shield,
    color: "hsl(220, 65%, 40%)",
    boothColors: ["#12234a", "#1e3a73", "#2e55a3", "#5078c4", "#839fdb", "#bac9ed"],
    email: "patents@transperfect.com",
    website: "www.transperfectip.com",
    services: ["Global Patent Quality & Efficiency", "Streamlined Patent Filing", "AI-Powered Translation", "Quality & Expertise", "Accelerated Filing Timelines", "GlobalLink Integration"],
    images: ["/booths/ip.jpg"],
    variants: [{ label: "Standard", image: "/booths/ip.jpg" }],
    boothContent: [
      { heading: "Core Messaging", bullets: ["Protect Your IP in Any Country"] },
      { heading: "Key Capabilities", bullets: ["Leverage Global Patent Quality, Efficiency, with AI-Powered Translation Memory", "Streamline Patent Filing Processes", "Quality, Efficiency and Expertise", "Accelerate Translation and Global Filing Timelines with GlobalLink"] },
    ],
  },
  {
    id: "digital",
    name: "Digital",
    tagline: "Global Performance for International Brands",
    description: "Any Market. Any Language. Performance-led. Measurable Results. Full-service international digital marketing powered by AI and data.",
    icon: Monitor,
    color: "hsl(265, 60%, 50%)",
    boothColors: ["#2d1a5e", "#4a2d8c", "#6b3fc4", "#8e66d9", "#b399e6", "#d6ccf2"],
    email: "TPDigital@transperfect.com",
    website: "www.transperfectdigital.com",
    services: ["International SEO & Paid Media", "Performance Content & Copywriting", "LLM Solutions", "Social Media Intelligence", "AI Copywriting", "Market Intelligence"],
    images: ["/booths/digital-1.jpg", "/booths/digital-2.jpg"],
    variants: [
      { label: "Dark Theme", image: "/booths/digital-1.jpg" },
      { label: "Lite Theme", image: "/booths/digital-2.jpg" },
    ],
    boothContent: [
      { heading: "Core Messaging", bullets: ["Global Performance for International Brands", "Any Market. Any Language.", "Performance-led. Measurable Results."] },
      { heading: "Services", bullets: ["International SEO & Paid Media", "Performance Content & Copywriting", "LLM Solutions", "Social Media Intelligence", "AI Copywriting", "Market Intelligence"] },
    ],
  },
  {
    id: "media",
    name: "Media",
    tagline: "Where Boutique Expertise Meets Global Excellence",
    description: "Full-spectrum media localization, post-production, accessibility, distribution, and content creation with 130+ recording studios worldwide.",
    icon: Film,
    color: "hsl(340, 65%, 45%)",
    boothColors: ["#4a0f2a", "#7a1a45", "#b32861", "#d45a88", "#e48fae", "#f2c4d5"],
    email: "media@transperfect.com",
    website: "media.transperfect.com",
    services: ["Subtitling & Captioning", "Dubbing & Voiceover", "Post-Production & VFX", "Accessibility (SDH, CC, AD)", "Quality Control", "Distribution & Fulfillment", "Film Restoration (2K/4K/Dolby)", "Content Creation", "AI-Enabled Workflows"],
    stats: [{ label: "Recording Studios", value: "130+" }, { label: "Mixing Rooms", value: "51+" }, { label: "Dolby Atmos Rooms", value: "3" }],
    images: ["/booths/media-1.jpg", "/booths/media-2.jpg", "/booths/media-3.jpg", "/booths/media-4.jpg"],
    variants: [
      { label: "General", image: "/booths/media-1.jpg" },
      { label: "MIP Africa", image: "/booths/media-2.jpg" },
      { label: "IBC / GlobalLink", image: "/booths/media-3.jpg" },
      { label: "Kidscreen", image: "/booths/media-4.jpg" },
    ],
    boothContent: [
      { heading: "Localization", bullets: ["Subtitling in all industry formats and 200+ languages and dialects with in-context review", "Dubbing & Voiceover — Traditional and cloud-based recording, with custom casting", "In-studio and remote recording, AI-enabled workflows"] },
      { heading: "Post-Production", bullets: ["Image and sound design and editing", "VFX, SFX, GFX, and creative post", "Content Creation — Secure storage, packaging and delivery in all industry formats"] },
      { heading: "Accessibility", bullets: ["SDH, CC, AD, and sign language for pre-recorded and live content", "Captioning, SDH, HOH, live CC and audio descriptions"] },
      { heading: "Distribution & QC", bullets: ["Quality Control — Master QC, digital, physical QC, and device certification", "Distribution — Secure encoding, transcoding, packaging, metadata, artwork and distribution", "Film Restoration — Digitization and restoration in 2K, 4K, and Dolby Cinema"] },
      { heading: "GlobalLink Media", bullets: ["BluQC — One interface, infinite possibilities", "BluConductor — Product Management, Editing & Transcoding, Compliance & Content Moderation", "Quality Control, Packaging & Delivery, Localization & Accessibility"] },
    ],
  },
  {
    id: "games",
    name: "Games",
    tagline: "The Language of Global Games",
    description: "Where Boutique Expertise Meets Global Excellence. Full lifecycle game services from art and development to localization, marketing, QA, and player support.",
    icon: Gamepad2,
    color: "hsl(150, 60%, 40%)",
    boothColors: ["#0d3d2a", "#1a6b48", "#2a9d6a", "#5abf8e", "#8ed9b3", "#c4edd9"],
    email: "games@transperfect.com",
    website: "transperfectgames.com",
    services: ["Art & Development", "Localization", "Marketing", "QA Testing", "Player Support", "AI Integration"],
    images: ["/booths/games.jpg"],
    variants: [{ label: "Standard", image: "/booths/games.jpg" }],
    boothContent: [
      { heading: "Core Messaging", bullets: ["The Language of Global Games", "Where Boutique Expertise Meets Global Excellence"] },
      { heading: "Full Lifecycle Services", bullets: ["Art & Development", "Localization", "Marketing", "QA Testing", "Player Support", "AI Integration"] },
    ],
  },
  {
    id: "live",
    name: "Live",
    tagline: "Multilingual Event Solutions",
    description: "Powered by GlobalLink. Deliver engaging, inclusive, and accessible events for global audiences with human expertise, AI services, and event technology.",
    icon: Radio,
    color: "hsl(180, 55%, 40%)",
    boothColors: ["#0d3d3d", "#1a6b6b", "#2a9e9e", "#55bfbf", "#8ad9d9", "#c0edeb"],
    email: "live@transperfect.com",
    website: "www.transperfect.com",
    services: ["Content Creation", "Technology Consulting", "App, Web & Platform Localization", "Post-Launch Activities", "Expert Interpreters", "Global Availability", "Tailored Service", "Human Expertise", "AI Services", "Event Technology"],
    images: ["/booths/live-1.jpg", "/booths/live-2.jpg", "/booths/live-3.jpg"],
    variants: [
      { label: "Dark Theme", image: "/booths/live-1.jpg" },
      { label: "Lite Theme", image: "/booths/live-2.jpg" },
      { label: "Custom Build", image: "/booths/live-3.jpg" },
    ],
    boothContent: [
      { heading: "Core Messaging", bullets: ["Multilingual Event Solutions", "Powered by GlobalLink", "Deliver engaging, inclusive, and accessible events for global audiences"] },
      { heading: "Services", bullets: ["Content Creation", "Technology Consulting", "App, Web & Platform Localization", "Post-Launch Activities"] },
      { heading: "Key Differentiators", bullets: ["Expert Interpreters", "Global Availability", "Tailored Service", "Human Expertise", "AI Services", "Event Technology"] },
      { heading: "Custom Build Features", bullets: ["Exterior & Interior Canopy Branding", "43\" Monitor Integration", "Corner and Canopy Signage"] },
    ],
  },
  {
    id: "health",
    name: "Health",
    tagline: "Serving Seniors Through the Continuum of Care",
    description: "Holistic, outcome-driven rehabilitation services and partnership models with translation, localization, and digital health solutions.",
    icon: Heart,
    color: "hsl(350, 70%, 50%)",
    boothColors: ["#5c0a1a", "#991030", "#d42050", "#e05578", "#eb8da6", "#f5c4d0"],
    email: "tphealth@transperfect.com",
    website: "www.transperfect.com",
    services: ["Physical, Occupational & Speech Therapy", "Rehabilitation Services & Staffing", "Flexible Partnership Models", "Marketing Data Access", "Translation & Localization", "Digital Health", "30+ Years Experience"],
    images: ["/booths/health-1.jpg", "/booths/health-2.jpg"],
    variants: [
      { label: "Dark Theme", image: "/booths/health-1.jpg" },
      { label: "Lite Theme", image: "/booths/health-2.jpg" },
    ],
    boothContent: [
      { heading: "Core Messaging", bullets: ["Serving Seniors Through the Continuum of Care", "With holistic, outcome-driven support", "Effortless Localization for all your digital health needs"] },
      { heading: "Outcome Based Rehabilitation Solutions", bullets: ["Physical, Occupational & Speech Therapy", "Rehabilitation Services & Staffing", "Flexible Partnership Models", "30+ Years of Experience"] },
      { heading: "Additional Services", bullets: ["Access to Marketing Data", "Translation & Localization", "Digital Health Solutions"] },
    ],
  },
  {
    id: "dataforce",
    name: "DataForce",
    tagline: "Human Insights for AI that is Reliable. Refined. Respected.",
    description: "AI training data services including data collection, annotation, transcription, generative AI support, user studies, and ethical content moderation.",
    icon: Database,
    color: "hsl(270, 55%, 50%)",
    boothColors: ["#2a1055", "#45208a", "#6633bf", "#8a5cd4", "#ad8ce3", "#d1bff0"],
    email: "dataforce@transperfect.com",
    website: "www.dataforce.ai",
    services: ["Data Collection", "Data Annotation", "Data Relevance", "Transcription", "Generative AI", "User Studies & Rating", "Business Process Chatbot", "Bias Mitigation", "Ethical Content Moderation"],
    images: ["/booths/dataforce-1.jpg", "/booths/dataforce-2.jpg"],
    variants: [
      { label: "Standard", image: "/booths/dataforce-1.jpg" },
      { label: "China Smart", image: "/booths/dataforce-2.jpg" },
    ],
    boothContent: [
      { heading: "Core Messaging", bullets: ["Human Insights for AI that is Reliable. Refined. Respected."] },
      { heading: "Services", bullets: ["Data Collection", "Data Annotation", "Data Relevance", "Transcription", "Generative AI", "User Studies & Rating", "Business Process Chatbot", "Bias Mitigation", "Ethical Content Moderation"] },
      { heading: "China Smart Booth", bullets: ["6 core AI disciplines", "46 specialized capabilities", "140+ use case scenarios"] },
    ],
  },
  {
    id: "trial-interactive",
    name: "Trial Interactive",
    tagline: "Enabling Trial Collaboration in the Cloud",
    description: "eClinical platform delivering connected, white-glove expert support services with AI-powered trial intelligence for clinical research.",
    icon: Microscope,
    color: "hsl(190, 65%, 42%)",
    boothColors: ["#0a3642", "#126070", "#1d90a8", "#42b3cc", "#7ccde0", "#bbe5f0"],
    email: "info@trialinteractive.com",
    website: "www.trialinteractive.com",
    services: ["eClinical Platform", "Connected Support", "White-Glove Service", "Expert Support Services", "AI-Powered Trial Intelligence", "Cloud Collaboration"],
    images: ["/booths/trial-interactive-1.jpg", "/booths/trial-interactive-2.jpg"],
    variants: [
      { label: "Dark Theme", image: "/booths/trial-interactive-1.jpg" },
      { label: "Lite Theme", image: "/booths/trial-interactive-2.jpg" },
    ],
    boothContent: [
      { heading: "Core Messaging", bullets: ["eClinical Platform", "Enabling Trial Collaboration in the Cloud"] },
      { heading: "Key Capabilities", bullets: ["Connected Support", "White-Glove Expert Service", "Expert Support Services", "AI-Powered Trial Intelligence", "eClinical Platform Support Services"] },
    ],
  },
  {
    id: "g3",
    name: "G3",
    tagline: "Shaping Global Content. Empowering Human Connection.",
    description: "AI-driven global content solutions—scalable, AI-powered, and human-driven—for learning, localization, market insights, and growth partnerships. WBENC & ISO certified.",
    icon: Globe,
    color: "hsl(25, 70%, 50%)",
    boothColors: ["#5c2a0a", "#994510", "#d96a1a", "#e8924a", "#f0b880", "#f7dbb8"],
    email: "info@theg3company.com",
    website: "theg3company.com",
    services: ["Learning & Development", "Localization & Content Solutions", "Market & Insights", "Scalable Growth Partnership", "Content Enablement", "AI-Driven Content"],
    images: ["/booths/g3-1.jpg", "/booths/g3-2.jpg"],
    variants: [
      { label: "Dark Theme", image: "/booths/g3-1.jpg" },
      { label: "Lite Theme", image: "/booths/g3-2.jpg" },
    ],
    boothContent: [
      { heading: "Core Messaging", bullets: ["Shaping Global Content. Empowering Human Connection.", "AI-Driven Global Content — Scalable, AI-powered, and human-driven content solutions for a connected world", "To Optimize your Communication Impact"] },
      { heading: "Services", bullets: ["Learning & Development", "Localization & Content Solutions", "Market & Insights", "Scalable Growth Partnership", "Content Enablement"] },
      { heading: "Certifications", bullets: ["WBENC Certified", "ISO Certified"] },
      { heading: "Websites", bullets: ["theg3company.com", "g3lifesciences.com"] },
    ],
  },
];

const BoothCard = ({ division, onClick, cardImage, isAdmin, onUploadCardImage, imagesLoading }: { division: BoothDivision; onClick: () => void; cardImage?: string; isAdmin?: boolean; onUploadCardImage?: (file: File) => void; imagesLoading?: boolean }) => {
  const Icon = division.icon;
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Determine the final image: use DB card image, skip hardcoded fallbacks during loading
  const displayImage = cardImage || (!imagesLoading ? division.images[0] : undefined);
  return (
    <motion.button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card text-left transition-all hover:border-primary/30 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={`${division.name} booth`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: division.color + "20" }}>
            <Icon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: division.color }}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white font-heading">{division.name}</h3>
          </div>
          <p className="text-xs text-white/80 line-clamp-1">{division.tagline}</p>
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          {isAdmin && onUploadCardImage && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadCardImage(f);
                  e.target.value = '';
                }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                title="Upload card image"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <Badge variant="secondary" className="bg-white/90 text-gray-900 text-xs backdrop-blur-sm border-none">
            {division.variants.length} {division.variants.length === 1 ? "variant" : "variants"}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        
        <div className="flex flex-wrap gap-1.5">
          {division.services.slice(0, 3).map((s) => (
            <Badge key={s} variant="outline" className="text-[10px] font-normal">
              {s}
            </Badge>
          ))}
          {division.services.length > 3 && (
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
              +{division.services.length - 3} more
            </Badge>
          )}
        </div>
      </div>
    </motion.button>
  );
};

const BoothCardWithImages = ({ division, onClick, isAdmin }: { division: BoothDivision; onClick: () => void; isAdmin: boolean }) => {
  const { getVariantImage, getMergedVariants, uploadImage, loading: imagesLoading } = useBoothImages(division.id);
  const cardImage = getVariantImage("__card__", "");
  const mergedVariants = getMergedVariants(division.variants);
  const handleUpload = async (file: File) => {
    await uploadImage("__card__", file);
  };
  // Override variant count with merged count
  const divisionWithCount = { ...division, variants: mergedVariants.map(v => ({ label: v.label, image: v.image })) };
  return (
    <BoothCard
      division={divisionWithCount}
      onClick={onClick}
      cardImage={cardImage || undefined}
      isAdmin={isAdmin}
      onUploadCardImage={handleUpload}
      imagesLoading={imagesLoading}
    />
  );
};

const DownloadLinksList = ({ 
  links, 
  isAdmin, 
  linkType, 
  title, 
  addLabel,
  onAdd, 
  onUpdate, 
  onDelete 
}: { 
  links: { id: string; label: string; url: string }[];
  isAdmin: boolean;
  linkType: 'project' | 'asset';
  title: string;
  addLabel: string;
  onAdd: (label: string, url: string) => Promise<void>;
  onUpdate: (id: string, label: string, url: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const handleAdd = async () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    await onAdd(newLabel.trim(), newUrl.trim());
    setNewLabel(""); setNewUrl(""); setAdding(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editLabel.trim() || !editUrl.trim()) return;
    await onUpdate(editingId, editLabel.trim(), editUrl.trim());
    setEditingId(null);
  };

  const startEdit = (link: { id: string; label: string; url: string }) => {
    setEditingId(link.id);
    setEditLabel(link.label);
    setEditUrl(link.url);
  };

  if (links.length === 0 && !isAdmin) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
        {isAdmin && !adding && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => setAdding(true)}>
            <Plus className="h-3 w-3" /> {addLabel}
          </Button>
        )}
      </div>

      {adding && (
        <div className="flex flex-col sm:flex-row gap-2 mb-3 p-3 rounded-lg border border-border bg-muted/30">
          <Input placeholder="Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="text-sm h-9" />
          <Input placeholder="URL (https://...)" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="text-sm h-9" />
          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" className="h-9" onClick={handleAdd} disabled={!newLabel.trim() || !newUrl.trim()}>Save</Button>
            <Button size="sm" variant="ghost" className="h-9" onClick={() => { setAdding(false); setNewLabel(""); setNewUrl(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {links.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {links.map((link) => (
            <div key={link.id}>
              {editingId === link.id ? (
                <div className="flex flex-col gap-1.5 p-2 rounded-lg border border-primary/30 bg-muted/30">
                  <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="text-sm h-8" />
                  <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="text-sm h-8" />
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-7 text-xs" onClick={handleUpdate}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-colors text-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </a>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(link)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(link.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : isAdmin ? (
        <p className="text-xs text-muted-foreground italic">No {linkType === 'project' ? 'project files' : 'individual assets'} yet.</p>
      ) : null}
    </div>
  );
};

const DownloadLinksManager = ({ divisionId, isAdmin, color, variantLabel }: { divisionId: string; isAdmin: boolean; color: string; variantLabel?: string }) => {
  const { links, loading, addLink, updateLink, deleteLink } = useBoothDownloadLinks(divisionId, variantLabel);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading downloads...
      </div>
    );
  }

  const projectLinks = links.filter(l => (l as any).link_type !== 'asset');
  const assetLinks = links.filter(l => (l as any).link_type === 'asset');

  const hasContent = projectLinks.length > 0 || assetLinks.length > 0;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Download Files</h3>
      
      {!hasContent && !isAdmin && (
        <p className="text-xs text-muted-foreground italic py-2">No download files available for this division.</p>
      )}

      <DownloadLinksList
        links={projectLinks}
        isAdmin={isAdmin}
        linkType="project"
        title="Project Files"
        addLabel="Add Project File"
        onAdd={(label, url) => addLink(label, url, 'project')}
        onUpdate={updateLink}
        onDelete={deleteLink}
      />

      <DownloadLinksList
        links={assetLinks}
        isAdmin={isAdmin}
        linkType="asset"
        title="Individual Assets"
        addLabel="Add Asset"
        onAdd={(label, url) => addLink(label, url, 'asset')}
        onUpdate={updateLink}
        onDelete={deleteLink}
      />
    </div>
  );
};

// --- Color Palette Component ---
const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const rgbToCmyk = (r: number, g: number, b: number) => {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  const c1 = 1 - r / 255, m1 = 1 - g / 255, y1 = 1 - b / 255;
  const k = Math.min(c1, m1, y1);
  return {
    c: Math.round(((c1 - k) / (1 - k)) * 100),
    m: Math.round(((m1 - k) / (1 - k)) * 100),
    y: Math.round(((y1 - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
};

const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const v = max, d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
};

const nearestPantone = (r: number, g: number, b: number): string => {
  const pantones: [string, number, number, number][] = [
    ['PMS 186 C', 200, 16, 46], ['PMS 485 C', 218, 41, 28], ['PMS 021 C', 254, 80, 0],
    ['PMS 137 C', 252, 163, 17], ['PMS 116 C', 255, 205, 0], ['PMS 382 C', 196, 214, 0],
    ['PMS 361 C', 30, 181, 58], ['PMS 3285 C', 0, 178, 169], ['PMS 299 C', 0, 163, 224],
    ['PMS 286 C', 0, 51, 160], ['PMS 2685 C', 86, 0, 160], ['PMS 254 C', 160, 45, 150],
    ['PMS Process Black C', 39, 37, 31], ['PMS Cool Gray 11 C', 83, 86, 90],
    ['PMS Cool Gray 7 C', 151, 153, 155], ['PMS Cool Gray 3 C', 200, 201, 199],
    ['PMS White', 255, 255, 255], ['PMS 7463 C', 0, 60, 76], ['PMS 7476 C', 0, 104, 120],
    ['PMS 7489 C', 116, 170, 80], ['PMS 7548 C', 255, 183, 0], ['PMS 7621 C', 135, 24, 27],
    ['PMS 7687 C', 29, 56, 134], ['PMS 7694 C', 0, 93, 137], ['PMS 7725 C', 0, 122, 82],
    ['PMS 1795 C', 210, 38, 48], ['PMS 7455 C', 58, 93, 174], ['PMS 7461 C', 0, 133, 173],
    ['PMS 539 C', 0, 42, 76], ['PMS 534 C', 27, 54, 93], ['PMS 289 C', 12, 35, 64],
  ];
  let best = pantones[0][0], bestDist = Infinity;
  for (const [name, pr, pg, pb] of pantones) {
    const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (dist < bestDist) { bestDist = dist; best = name; }
  }
  return best + (bestDist > 2500 ? ' (approx)' : '');
};

const ColorCodeRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/40 group/code">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-mono font-medium text-foreground">{value}</span>
      <button
        className="opacity-0 group-hover/code:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        title="Copy"
        onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied`); }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
    </div>
  </div>
);

const exportPalette = (palette: string[], name: string) => {
  const rgbFromHex = (h: string) => {
    const rv = parseInt(h.slice(1, 3), 16);
    const gv = parseInt(h.slice(3, 5), 16);
    const bv = parseInt(h.slice(5, 7), 16);
    return { r: rv, g: gv, b: bv };
  };
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };
  const rgbToCmyk = (r: number, g: number, b: number) => {
    if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
    const c1 = 1 - r / 255, m1 = 1 - g / 255, y1 = 1 - b / 255;
    const k = Math.min(c1, m1, y1);
    return {
      c: Math.round(((c1 - k) / (1 - k)) * 100),
      m: Math.round(((m1 - k) / (1 - k)) * 100),
      y: Math.round(((y1 - k) / (1 - k)) * 100),
      k: Math.round(k * 100),
    };
  };
  const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const v = max, d = max - min;
    const s = max === 0 ? 0 : d / max;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
  };
  // Approximate Pantone lookup based on nearest match from common Pantone colors
  const nearestPantone = (r: number, g: number, b: number): string => {
    const pantones: [string, number, number, number][] = [
      ['PMS 186 C', 200, 16, 46], ['PMS 485 C', 218, 41, 28], ['PMS 021 C', 254, 80, 0],
      ['PMS 137 C', 252, 163, 17], ['PMS 116 C', 255, 205, 0], ['PMS 382 C', 196, 214, 0],
      ['PMS 361 C', 30, 181, 58], ['PMS 3285 C', 0, 178, 169], ['PMS 299 C', 0, 163, 224],
      ['PMS 286 C', 0, 51, 160], ['PMS 2685 C', 86, 0, 160], ['PMS 254 C', 160, 45, 150],
      ['PMS Process Black C', 39, 37, 31], ['PMS Cool Gray 11 C', 83, 86, 90],
      ['PMS Cool Gray 7 C', 151, 153, 155], ['PMS Cool Gray 3 C', 200, 201, 199],
      ['PMS White', 255, 255, 255], ['PMS 7463 C', 0, 60, 76], ['PMS 7476 C', 0, 104, 120],
      ['PMS 7489 C', 116, 170, 80], ['PMS 7548 C', 255, 183, 0], ['PMS 7621 C', 135, 24, 27],
      ['PMS 7687 C', 29, 56, 134], ['PMS 7694 C', 0, 93, 137], ['PMS 7725 C', 0, 122, 82],
      ['PMS 1795 C', 210, 38, 48], ['PMS 7455 C', 58, 93, 174], ['PMS 7461 C', 0, 133, 173],
      ['PMS 539 C', 0, 42, 76], ['PMS 534 C', 27, 54, 93], ['PMS 289 C', 12, 35, 64],
    ];
    let best = pantones[0][0], bestDist = Infinity;
    for (const [name, pr, pg, pb] of pantones) {
      const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (dist < bestDist) { bestDist = dist; best = name; }
    }
    return best + (bestDist > 2500 ? ' (approx)' : '');
  };

  // Generate PNG swatch
  const canvas = document.createElement('canvas');
  const swatchW = 120, swatchH = 80, padding = 20, labelH = 24;
  const totalW = padding * 2 + palette.length * swatchW + (palette.length - 1) * 8;
  const totalH = padding * 2 + swatchH + labelH;
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalW, totalH);
  palette.forEach((c, i) => {
    const x = padding + i * (swatchW + 8);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(x, padding, swatchW, swatchH, 8);
    ctx.fill();
    ctx.fillStyle = '#333333';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(c.toUpperCase(), x + swatchW / 2, padding + swatchH + 16);
  });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-color-palette.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');

  // Export text file with HEX, RGB, CMYK, HSL (as HSV), and Pantone
  const title = name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const lines = [`${title} — Color Palette`, '═'.repeat(60), ''];
  palette.forEach((c, i) => {
    const rgb = rgbFromHex(c);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const pantone = nearestPantone(rgb.r, rgb.g, rgb.b);
    lines.push(`Color ${i + 1}`);
    lines.push(`  HEX:     ${c.toUpperCase()}`);
    lines.push(`  RGB:     ${rgb.r}, ${rgb.g}, ${rgb.b}`);
    lines.push(`  CMYK:    ${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`);
    lines.push(`  HSL:     ${hsl.h}°, ${hsl.s}%, ${hsl.l}%`);
    lines.push(`  HSV:     ${hsv.h}°, ${hsv.s}%, ${hsv.v}%`);
    lines.push(`  Pantone: ${pantone}`);
    lines.push('');
  });
  lines.push('─'.repeat(60));
  lines.push(`Exported from TransPerfect Booth Catalog`);
  const textBlob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const textUrl = URL.createObjectURL(textBlob);
  const a2 = document.createElement('a');
  a2.href = textUrl;
  a2.download = `${name}-color-palette.txt`;
  a2.click();
  URL.revokeObjectURL(textUrl);
};

const BoothColorPalette = ({ color, boothColors, isAdmin, divisionId, variantLabel, divisionName, imageUrls }: { color: string; boothColors?: string[]; isAdmin?: boolean; divisionId?: string; variantLabel?: string; divisionName?: string; imageUrls?: string[] }) => {
  const hex = color.startsWith('#') ? color : `#${color}`;
  const { r, g, b } = hexToRgb(hex);

  const tintShade = (factor: number) => {
    const nr = Math.round(r + (255 - r) * factor);
    const ng = Math.round(g + (255 - g) * factor);
    const nb = Math.round(b + (255 - b) * factor);
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  };
  const shade = (factor: number) => {
    const nr = Math.round(r * (1 - factor));
    const ng = Math.round(g * (1 - factor));
    const nb = Math.round(b * (1 - factor));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  };

  const defaultPalette = boothColors && boothColors.length >= 6 ? boothColors.slice(0, 6) : [
    shade(0.5), shade(0.3), hex, tintShade(0.25), tintShade(0.5), tintShade(0.75),
  ];

  // Load saved palette from DB
  const [dbColors, setDbColors] = useState<string[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [editColors, setEditColors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);

  useEffect(() => {
    if (!divisionId) return;
    supabase.from('booth_color_palettes').select('colors, variant_label').eq('division_id', divisionId)
      .then(({ data }) => {
        if (data) {
          // Find variant-specific or shared palette
          const match = data.find(d => d.variant_label === (variantLabel || null))
            || data.find(d => d.variant_label === null);
          if (match?.colors && match.colors.length >= 6) {
            setDbColors(match.colors.slice(0, 6));
          }
        }
      });
  }, [divisionId, variantLabel]);

  const palette = dbColors || defaultPalette;

  const [selectedIdx, setSelectedIdx] = useState(0);
  const selHex = palette[selectedIdx] || palette[0];
  const selRgb = hexToRgb(selHex);
  const selHsl = rgbToHsl(selRgb.r, selRgb.g, selRgb.b);
  const selCmyk = rgbToCmyk(selRgb.r, selRgb.g, selRgb.b);
  const selHsv = rgbToHsv(selRgb.r, selRgb.g, selRgb.b);
  const selPantone = nearestPantone(selRgb.r, selRgb.g, selRgb.b);

  const startEdit = () => {
    setEditColors([...palette]);
    setEditing(true);
  };

  const saveColors = async () => {
    if (!divisionId) return;
    setSaving(true);
    const { error } = await supabase.from('booth_color_palettes' as any)
      .upsert({ division_id: divisionId, colors: editColors, variant_label: variantLabel || null, updated_at: new Date().toISOString() } as any, { onConflict: 'division_id' });
    setSaving(false);
    if (error) { toast.error('Failed to save palette'); return; }
    setDbColors(editColors);
    setEditing(false);
    toast.success('Color palette saved');
  };

  const extractPaletteFromImages = async () => {
    if (!divisionId || !imageUrls?.length) {
      toast.error("No booth images available to analyze");
      return;
    }
    setAiExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("booth-palette-analyzer", {
        body: {
          division_id: divisionId,
          division_name: divisionName,
          variant_label: variantLabel || null,
          image_urls: imageUrls,
        },
      });
      if (error) throw error;
      if (data?.colors) {
        setDbColors(data.colors);
        toast.success(data.reasoning ? `Palette extracted: ${data.reasoning.slice(0, 80)}...` : "AI color palette extracted from booth images");
      }
    } catch (err: any) {
      console.error("AI palette extraction error:", err);
      toast.error(err.message || "Failed to extract palette from images");
    } finally {
      setAiExtracting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3 hover:border-primary/30 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Booth Color Palette</h3>
        <div className="flex items-center gap-1">
          {!editing && (
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Export palette" onClick={() => exportPalette(palette, divisionId || 'booth')}>
              <Download className="h-3 w-3" />
            </Button>
          )}
          {isAdmin && !editing && imageUrls && imageUrls.length > 0 && (
            <Button variant="ghost" size="icon" className="h-6 w-6" title="AI extract palette from images" onClick={extractPaletteFromImages} disabled={aiExtracting}>
              {aiExtracting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
            </Button>
          )}
          {isAdmin && !editing && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startEdit}>
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-2">
            {editColors.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <input
                  type="color"
                  value={c}
                  onChange={(e) => {
                    const updated = [...editColors];
                    updated[i] = e.target.value;
                    setEditColors(updated);
                  }}
                  className="h-10 w-full rounded border border-border cursor-pointer"
                />
                <span className="text-[9px] font-mono text-muted-foreground">{c.toUpperCase()}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={saveColors} disabled={saving} className="gap-1">
              {saving && <Loader2 className="h-3 w-3 animate-spin" />} Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* 6-color swatch strip */}
          <div className="flex rounded-lg overflow-hidden h-12">
            {palette.map((c, i) => (
              <div
                key={i}
                className={`flex-1 relative cursor-pointer transition-all ${selectedIdx === i ? 'flex-[1.8] ring-2 ring-foreground/30 z-10' : 'hover:flex-[1.3]'}`}
                style={{ backgroundColor: c }}
                title={c.toUpperCase()}
                onClick={() => setSelectedIdx(i)}
              >
                {selectedIdx === i && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white/90 ring-1 ring-white/50 shadow-sm" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Selected color codes */}
          <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
            <div className="w-14 h-14 rounded-lg shadow-sm border border-border/40" style={{ backgroundColor: selHex }} />
            <div className="space-y-1">
              <ColorCodeRow label="HEX" value={selHex.toUpperCase()} />
              <ColorCodeRow label="RGB" value={`${selRgb.r}, ${selRgb.g}, ${selRgb.b}`} />
              <ColorCodeRow label="HSL" value={`${selHsl.h}°, ${selHsl.s}%, ${selHsl.l}%`} />
              <ColorCodeRow label="HSV" value={`${selHsv.h}°, ${selHsv.s}%, ${selHsv.v}%`} />
              <ColorCodeRow label="CMYK" value={`${selCmyk.c}, ${selCmyk.m}, ${selCmyk.y}, ${selCmyk.k}`} />
              <ColorCodeRow label="Pantone" value={selPantone} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ServicesManager = ({ divisionId, isAdmin, color, variantLabel }: { divisionId: string; isAdmin: boolean; color: string; variantLabel?: string }) => {
  const { services, loading, addService, updateService, deleteService } = useBoothServices(divisionId, variantLabel);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newIconSvg, setNewIconSvg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editIconSvg, setEditIconSvg] = useState("");

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    await addService(newLabel.trim(), newIconSvg.trim() || undefined);
    setNewLabel(""); setNewIconSvg(""); setAdding(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editLabel.trim()) return;
    await updateService(editingId, editLabel.trim(), editIconSvg.trim() || null);
    setEditingId(null);
  };

  const startEdit = (svc: { id: string; label: string; icon_svg: string | null }) => {
    setEditingId(svc.id);
    setEditLabel(svc.label);
    setEditIconSvg(svc.icon_svg || "");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading services...
      </div>
    );
  }

  if (services.length === 0 && !isAdmin) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Services & Capabilities</h3>
        {isAdmin && !adding && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Service
          </Button>
        )}
      </div>

      {adding && isAdmin && (
        <div className="mb-3 space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
          <Input placeholder="Service name" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="text-sm" />
          <div className="space-y-1">
            <Textarea placeholder="SVG icon code (optional, paste <svg>...</svg>)" value={newIconSvg} onChange={(e) => setNewIconSvg(e.target.value)} className="text-xs font-mono min-h-[60px]" />
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <input type="file" accept=".svg,image/svg+xml" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => { const text = ev.target?.result as string; if (text) setNewIconSvg(text); };
                  reader.readAsText(file);
                }
                e.target.value = '';
              }} />
              <Plus className="h-3 w-3" /> Upload SVG file
            </label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="text-xs" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setAdding(false); setNewLabel(""); setNewIconSvg(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {services.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {services.map((svc) => (
            editingId === svc.id && isAdmin ? (
              <div key={svc.id} className="space-y-2 p-3 rounded-lg border border-primary/30 bg-muted/20 col-span-full">
                <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="text-sm" />
                <div className="space-y-1">
                  <Textarea placeholder="SVG icon code (optional)" value={editIconSvg} onChange={(e) => setEditIconSvg(e.target.value)} className="text-xs font-mono min-h-[60px]" />
                  <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <input type="file" accept=".svg,image/svg+xml" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => { const text = ev.target?.result as string; if (text) setEditIconSvg(text); };
                        reader.readAsText(file);
                      }
                      e.target.value = '';
                    }} />
                    <Plus className="h-3 w-3" /> Upload SVG file
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs" onClick={handleUpdate}>Save</Button>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div key={svc.id} className="bg-muted/50 rounded-lg px-4 py-3 text-center relative group min-w-[80px] flex flex-col items-center gap-1.5 hover:bg-muted/80 hover:shadow-md hover:scale-[1.03] hover:border-primary/30 border border-transparent transition-all duration-200 cursor-default">
                {svc.icon_svg ? (
                  <div className="flex justify-center [&>svg]:h-7 [&>svg]:w-7" style={{ color: color + "80" }} dangerouslySetInnerHTML={{ __html: svc.icon_svg }} />
                ) : (
                  <BarChart3 className="h-7 w-7" style={{ color: color + "80" }} />
                )}
                <div className="text-xs font-medium leading-tight" style={{ color }}>{svc.label}</div>
                {svc.icon_svg && (
                  <button
                    className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex items-center justify-center rounded-full bg-background shadow-sm border border-border hover:bg-muted"
                    title="Download SVG"
                    onClick={() => {
                      const blob = new Blob([svc.icon_svg!], { type: 'image/svg+xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${svc.label.replace(/\s+/g, '-').toLowerCase()}.svg`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                {isAdmin && (
                  <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(svc)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteService(svc.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

interface BoothQRCode { id: string; division_id: string; label: string; url: string; image_url: string | null; display_order: number; }

const QRCodesManager = ({ divisionId, isAdmin, color, variantLabel }: { divisionId: string; isAdmin: boolean; color: string; variantLabel?: string }) => {
  const { qrCodes, loading, addQRCode, updateQRCode, deleteQRCode } = useBoothQRCodes(divisionId, variantLabel);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (
    file: File,
    setImageUrl: (url: string) => void
  ) => {
    if (!file) return;
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an SVG, PNG, JPG, or WebP file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'svg';
      const path = `booth-qr/${divisionId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
      toast.success('QR image uploaded');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleBatchUpload = async (files: FileList) => {
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];
    const validFiles = Array.from(files).filter(f => validTypes.includes(f.type) && f.size <= 5 * 1024 * 1024);
    if (validFiles.length === 0) {
      toast.error('No valid image files selected (SVG, PNG, JPG, WebP under 5MB)');
      return;
    }
    setUploading(true);
    let added = 0;
    for (const file of validFiles) {
      try {
        const ext = file.name.split('.').pop() || 'svg';
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const path = `booth-qr/${divisionId}/${Date.now()}-${added}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('organization-assets')
          .upload(path, file, { contentType: file.type, upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('organization-assets')
          .getPublicUrl(path);
        await addQRCode(nameWithoutExt, '#', urlData.publicUrl);
        added++;
      } catch (err: any) {
        console.error('Batch upload error:', err);
      }
    }
    setUploading(false);
    if (added > 0) toast.success(`${added} QR code${added > 1 ? 's' : ''} uploaded`);
  };

  const handleAdd = async () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    await addQRCode(newLabel.trim(), newUrl.trim(), newImageUrl.trim() || undefined);
    setNewLabel(""); setNewUrl(""); setNewImageUrl(""); setAdding(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editLabel.trim() || !editUrl.trim()) return;
    await updateQRCode(editingId, editLabel.trim(), editUrl.trim(), editImageUrl.trim() || null);
    setEditingId(null);
  };

  const startEdit = (qr: BoothQRCode) => {
    setEditingId(qr.id);
    setEditLabel(qr.label);
    setEditUrl(qr.url);
    setEditImageUrl(qr.image_url || "");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading QR codes...
      </div>
    );
  }

  if (qrCodes.length === 0 && !isAdmin) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">QR Codes</h3>
        {isAdmin && !adding && (
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input type="file" multiple accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { if (e.target.files?.length) handleBatchUpload(e.target.files); e.target.value = ''; }} />
              <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" disabled={uploading} asChild>
                <span>{uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</> : <><Plus className="h-3.5 w-3.5" /> Bulk Upload</>}</span>
              </Button>
            </label>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" /> Add QR Code
            </Button>
          </div>
        )}
      </div>

      {adding && isAdmin && (
        <div className="mb-3 space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
          <Input placeholder="Label (e.g. Booth Registration)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="text-sm" />
          <Input placeholder="URL (e.g. https://example.com)" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="text-sm" />
          <div className="space-y-1">
            <div className="flex gap-2 items-center">
              <Input placeholder="QR Code Image URL (optional)" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} className="text-sm flex-1" />
              <label className="cursor-pointer">
                <input type="file" accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, setNewImageUrl); e.target.value = ''; }} />
                <Button type="button" variant="outline" size="sm" className="text-xs gap-1" disabled={uploading} asChild>
                  <span>{uploading ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</> : 'Upload SVG/Image'}</span>
                </Button>
              </label>
            </div>
            {newImageUrl && (
              <div className="flex items-center gap-3 p-2 rounded-lg border border-border/40 bg-card">
                <img src={newImageUrl} alt="QR Preview" className="w-20 h-20 object-contain rounded" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">QR Code Preview</span>
                  <button onClick={() => setNewImageUrl("")} className="text-xs text-destructive hover:underline text-left">Remove</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="text-xs" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setAdding(false); setNewLabel(""); setNewUrl(""); setNewImageUrl(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {qrCodes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {qrCodes.map((qr) => (
            editingId === qr.id && isAdmin ? (
              <div key={qr.id} className="space-y-2 p-3 rounded-lg border border-primary/30 bg-muted/20 col-span-full">
                <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Label" className="text-sm" />
                <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="URL" className="text-sm" />
                <div className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <Input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} placeholder="QR Image URL (optional)" className="text-sm flex-1" />
                    <label className="cursor-pointer">
                      <input type="file" accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, setEditImageUrl); e.target.value = ''; }} />
                      <Button type="button" variant="outline" size="sm" className="text-xs gap-1" disabled={uploading} asChild>
                        <span>{uploading ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</> : 'Upload SVG/Image'}</span>
                      </Button>
                    </label>
                  </div>
                  {editImageUrl && (
                    <div className="flex items-center gap-3 p-2 rounded-lg border border-border/40 bg-card">
                      <img src={editImageUrl} alt="QR Preview" className="w-20 h-20 object-contain rounded" />
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">QR Code Preview</span>
                        <button onClick={() => setEditImageUrl("")} className="text-xs text-destructive hover:underline text-left">Remove</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs" onClick={handleUpdate}>Save</Button>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div key={qr.id} className="bg-muted/50 rounded-lg p-3 text-center relative group hover:bg-muted/80 hover:shadow-md hover:scale-[1.03] border border-transparent hover:border-primary/30 transition-all duration-200">
                {qr.image_url ? (
                  <div className="mb-2 flex justify-center">
                    <img src={qr.image_url} alt={qr.label} className="w-24 h-24 object-contain rounded" />
                  </div>
                ) : (
                  <div className="mb-2 flex justify-center">
                    <div className="w-24 h-24 rounded bg-muted flex items-center justify-center border border-border/40">
                      <ExternalLink className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  </div>
                )}
                <div className="text-xs font-medium truncate" style={{ color }}>{qr.label}</div>
                <a href={qr.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary truncate block mt-0.5">
                  {qr.url.replace(/^https?:\/\//, '').slice(0, 30)}
                </a>
                {qr.image_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-[10px] h-6 px-2 gap-1"
                    onClick={async () => {
                      try {
                        const resp = await fetch(qr.image_url!);
                        const blob = await resp.blob();
                        const ext = qr.image_url!.toLowerCase().includes('.svg') ? 'svg' : 'png';
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${qr.label.replace(/[^a-z0-9]/gi, '_')}-qr.${ext}`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {
                        toast.error('Failed to download QR code');
                      }
                    }}
                  >
                    <Download className="h-3 w-3" /> Download
                  </Button>
                )}
                {isAdmin && (
                  <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(qr)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteQRCode(qr.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      )}

      {qrCodes.length === 0 && isAdmin && !adding && (
        <p className="text-xs text-muted-foreground italic">No QR codes yet. Click "Add QR Code" to add one.</p>
      )}
    </div>
  );
};

const SPEC_CATEGORIES = [
  { value: "content-sizing", label: "Content Sizing" },
  { value: "resolution", label: "Resolution & DPI" },
  { value: "file-formats", label: "File Formats" },
  { value: "color-space", label: "Color Space" },
  { value: "safe-zones", label: "Safe Zones" },
  { value: "best-practices", label: "Best Practices" },
  { value: "general", label: "General" },
];

const ProductionSpecsManager = ({ divisionId, isAdmin, color, variantLabel }: { divisionId: string; isAdmin: boolean; color: string; variantLabel?: string }) => {
  const { specs, loading, addSpec, updateSpec, deleteSpec } = useBoothProductionSpecs(divisionId, variantLabel);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("general");

  const handleAdd = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await addSpec(newTitle.trim(), newContent.trim(), newCategory);
    setNewTitle(""); setNewContent(""); setNewCategory("general"); setAdding(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editTitle.trim() || !editContent.trim()) return;
    await updateSpec(editingId, editTitle.trim(), editContent.trim(), editCategory);
    setEditingId(null);
  };

  const startEdit = (spec: { id: string; title: string; content: string; category: string }) => {
    setEditingId(spec.id);
    setEditTitle(spec.title);
    setEditContent(spec.content);
    setEditCategory(spec.category);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading production specs...
      </div>
    );
  }

  if (specs.length === 0 && !isAdmin) return null;

  const grouped = SPEC_CATEGORIES.map(cat => ({
    ...cat,
    items: specs.filter(s => s.category === cat.value),
  })).filter(g => g.items.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Production Specifications</h3>
        {isAdmin && !adding && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Spec
          </Button>
        )}
      </div>

      {adding && isAdmin && (
        <div className="mb-3 space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
          <Input placeholder="Title (e.g. Banner Dimensions)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="text-sm" />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full text-sm rounded-md border border-input bg-background px-3 py-2"
          >
            {SPEC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <Textarea placeholder="Specification details..." value={newContent} onChange={(e) => setNewContent(e.target.value)} className="text-sm min-h-[80px]" />
          <div className="flex gap-2">
            <Button size="sm" className="text-xs" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setAdding(false); setNewTitle(""); setNewContent(""); setNewCategory("general"); }}>Cancel</Button>
          </div>
        </div>
      )}

      {editingId && isAdmin && (
        <div className="mb-3 space-y-2 p-3 rounded-lg border border-primary/30 bg-muted/20">
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" className="text-sm" />
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            className="w-full text-sm rounded-md border border-input bg-background px-3 py-2"
          >
            {SPEC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="Details" className="text-sm min-h-[80px]" />
          <div className="flex gap-2">
            <Button size="sm" className="text-xs" onClick={handleUpdate}>Save</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {grouped.length > 0 && (
        <div className="space-y-2">
          {grouped.map(group => {
            const isOpen = openCategories[group.value] ?? false;
            return (
              <div key={group.value} className="rounded-lg border border-border/40 overflow-hidden">
                <button
                  onClick={() => setOpenCategories(prev => ({ ...prev, [group.value]: !isOpen }))}
                  className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color }}>{group.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{group.items.length}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-2 space-y-2">
                        {group.items.map(spec => (
                          <div key={spec.id} className="bg-muted/40 rounded-lg p-3 relative group hover:bg-muted/60 hover:shadow-md border border-transparent hover:border-primary/30 transition-all duration-200">
                            <div className="text-xs font-semibold text-foreground mb-1">{spec.title}</div>
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{spec.content}</div>
                            {isAdmin && !editingId && (
                              <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(spec)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteSpec(spec.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {specs.length === 0 && isAdmin && !adding && (
        <p className="text-xs text-muted-foreground italic">No production specs yet. Click "Add Spec" to add one.</p>
      )}
    </div>
  );
};

const VariantInfoSection = ({ divisionId, variantLabel, isAdmin, color, divisionTagline }: { divisionId: string; variantLabel: string; isAdmin: boolean; color: string; divisionTagline?: string }) => {
  const { info, loading, saveInfo } = useBoothVariantInfo(divisionId, variantLabel);
  const [editing, setEditing] = useState(false);
  const [editTagline, setEditTagline] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSections, setEditSections] = useState<{ heading: string; bullets: string[] }[]>([]);

  const resolvedTagline = info?.tagline || divisionTagline || '';

  const startEditing = () => {
    setEditTagline(info?.tagline || divisionTagline || "");
    setEditDesc(info?.description || "");
    setEditSections(info?.details?.length ? info.details : [{ heading: "", bullets: [""] }]);
    setEditing(true);
  };

  const handleSave = async () => {
    const cleanedSections = editSections
      .filter(s => s.heading.trim() || s.bullets.some(b => b.trim()))
      .map(s => ({ heading: s.heading.trim(), bullets: s.bullets.filter(b => b.trim()) }));
    await saveInfo(editDesc.trim(), cleanedSections, editTagline.trim());
    setEditing(false);
  };

  const addSection = () => setEditSections([...editSections, { heading: "", bullets: [""] }]);
  const removeSection = (idx: number) => setEditSections(editSections.filter((_, i) => i !== idx));
  const updateSectionHeading = (idx: number, heading: string) => {
    const copy = [...editSections];
    copy[idx] = { ...copy[idx], heading };
    setEditSections(copy);
  };
  const addBullet = (sIdx: number) => {
    const copy = [...editSections];
    copy[sIdx] = { ...copy[sIdx], bullets: [...copy[sIdx].bullets, ""] };
    setEditSections(copy);
  };
  const updateBullet = (sIdx: number, bIdx: number, val: string) => {
    const copy = [...editSections];
    const bullets = [...copy[sIdx].bullets];
    bullets[bIdx] = val;
    copy[sIdx] = { ...copy[sIdx], bullets };
    setEditSections(copy);
  };
  const removeBullet = (sIdx: number, bIdx: number) => {
    const copy = [...editSections];
    copy[sIdx] = { ...copy[sIdx], bullets: copy[sIdx].bullets.filter((_, i) => i !== bIdx) };
    setEditSections(copy);
  };

  if (loading) return <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading variant info...</div>;

  if (!info && !isAdmin) {
    // Still show the tagline even in read-only if there's a division-level one
    if (resolvedTagline) {
      return (
        <div className="mt-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color }}>
            {variantLabel}
          </h4>
          <p className="text-2xl md:text-3xl font-normal leading-relaxed text-primary" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400 }}>{resolvedTagline}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span>Font: Poppins Regular 400</span>
            <span>Booth: 48–72pt</span>
            <span>Banner: 36–48pt</span>
            <span>Safe Zone: 2" from edges</span>
          </div>
        </div>
      );
    }
    return null;
  }

  if (editing && isAdmin) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-muted/20 space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Edit: {variantLabel} Info
        </h4>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tagline for this variant</label>
          <Textarea value={editTagline} onChange={e => setEditTagline(e.target.value)} className="text-sm min-h-[50px]" placeholder="Variant-specific tagline..." />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="text-sm min-h-[60px]" placeholder="About this specific booth variant..." />
        </div>
        {editSections.map((section, sIdx) => (
          <div key={sIdx} className="p-3 rounded-lg border border-border/40 bg-card space-y-2">
            <div className="flex items-center gap-2">
              <Input value={section.heading} onChange={e => updateSectionHeading(sIdx, e.target.value)} placeholder="Section heading" className="text-sm flex-1" />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeSection(sIdx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            {section.bullets.map((bullet, bIdx) => (
              <div key={bIdx} className="flex items-center gap-2 ml-4">
                <span className="h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <Input value={bullet} onChange={e => updateBullet(sIdx, bIdx, e.target.value)} placeholder="Detail point" className="text-xs flex-1" />
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeBullet(sIdx, bIdx)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-xs ml-4" onClick={() => addBullet(sIdx)}>
              <Plus className="h-3 w-3 mr-1" /> Add point
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="text-xs" onClick={addSection}>
          <Plus className="h-3 w-3 mr-1" /> Add Section
        </Button>
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="text-xs" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color }}>
          {variantLabel}
        </h4>
        {isAdmin && (
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={startEditing}>
            <Pencil className="h-3 w-3" /> {info ? "Edit" : "Add Info"}
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {/* Variant Tagline */}
        <div>
          <p className="text-2xl md:text-3xl font-normal leading-relaxed text-primary" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400 }}>{resolvedTagline}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span>Font: Poppins Regular 400</span>
            <span>Booth: 48–72pt</span>
            <span>Banner: 36–48pt</span>
            <span>Safe Zone: 2" from edges</span>
          </div>
        </div>
        {info?.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
        )}
        {info?.details && info.details.length > 0 && (
          <div className="grid gap-3">
            {info.details.map((section, i) => (
              <div key={i} className="bg-muted/30 rounded-lg p-3 border border-border/40">
                <h5 className="text-xs font-semibold mb-1.5" style={{ color }}>{section.heading}</h5>
                <ul className="space-y-1">
                  {section.bullets.map((bullet, j) => (
                    <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ContactWebsiteEditor = ({ division, isAdmin }: { division: BoothDivision; isAdmin: boolean }) => {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(division.email);
  const [website, setWebsite] = useState(division.website);
  const { divisions: customDivisions, updateDivision, refetch } = useCustomDivisions();

  useEffect(() => {
    setEmail(division.email);
    setWebsite(division.website);
  }, [division.email, division.website]);

  const handleSave = async () => {
    const existsInDb = customDivisions.some(c => c.division_id === division.id);
    if (existsInDb) {
      await updateDivision(division.id, { email: email.trim(), website: website.trim() });
    } else {
      await supabase.from("booth_custom_divisions").insert({
        division_id: division.id,
        name: division.name,
        tagline: division.tagline,
        description: division.description || "",
        color: division.color,
        email: email.trim(),
        website: website.trim(),
        display_order: 0,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });
    }
    await refetch();
    setEditing(false);
    toast.success("Contact info updated");
  };

  if (editing && isAdmin) {
    return (
      <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="text-sm h-8" />
        </div>
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.example.com" className="text-sm h-8" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="text-xs" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setEditing(false); setEmail(division.email); setWebsite(division.website); }}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 group relative">
      <a href={`mailto:${division.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <Mail className="h-4 w-4" /> {division.email}
      </a>
      <a href={`https://${division.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ExternalLink className="h-4 w-4" /> {division.website}
      </a>
      {isAdmin && (
        <Button variant="ghost" size="sm" className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export const DivisionDetail = ({ division, onClose, isAdmin, mode = 'modal' }: { division: BoothDivision; onClose: () => void; isAdmin: boolean; mode?: 'modal' | 'page' }) => {
  const [activeVariant, setActiveVariant] = useState(0);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addingVariant, setAddingVariant] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [newVariantLabel, setNewVariantLabel] = useState("");
  const Icon = division.icon;
  const { getMergedVariants, uploadImage, deleteImage, images } = useBoothImages(division.id);
  const variantImgRef = useRef<HTMLInputElement>(null);
  const newVariantFileRef = useRef<HTMLInputElement>(null);

  const mergedVariants = getMergedVariants(division.variants);
  const currentVariant = mergedVariants[activeVariant] || mergedVariants[0];
  const resolvedImage = currentVariant?.image || division.images[0];
  const hasCustomImage = currentVariant?.isCustom || currentVariant?.hasOverride;

  // Clamp activeVariant if variants changed
  useEffect(() => {
    if (activeVariant >= mergedVariants.length && mergedVariants.length > 0) {
      setActiveVariant(mergedVariants.length - 1);
    }
  }, [mergedVariants.length, activeVariant]);

  const handleVariantUpload = async (file: File) => {
    if (!currentVariant) return;
    setUploading(true);
    await uploadImage(currentVariant.label, file);
    setUploading(false);
  };

  const handleAddVariant = async (file: File) => {
    if (!newVariantLabel.trim()) {
      toast.error("Enter a label for the new variant");
      return;
    }
    setUploading(true);
    await uploadImage(newVariantLabel.trim(), file);
    setUploading(false);
    setNewVariantLabel("");
    setAddingVariant(false);
    // Jump to the new variant
    setActiveVariant(mergedVariants.length); // will be the next index
  };

  const handleDeleteVariant = async () => {
    if (!currentVariant) return;
    if (currentVariant.isCustom) {
      await deleteImage(currentVariant.label);
      setActiveVariant(0);
    } else if (currentVariant.hasOverride) {
      await deleteImage(currentVariant.label);
    }
  };

  const contentBody = (
    <div className={mode === 'page' ? "space-y-6" : "p-6 space-y-6"}>
      {/* Image Viewer */}
      <div
        className="relative rounded-xl overflow-hidden bg-muted aspect-[16/9] cursor-zoom-in group/img"
        onClick={() => setImagePreviewOpen(true)}
        title="Click to enlarge"
      >
        {uploading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.img
            key={`${activeVariant}-${resolvedImage}`}
            src={resolvedImage}
            alt={currentVariant?.label || division.name}
            className="w-full h-full object-contain bg-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/20 pointer-events-none">
          <ZoomIn className="h-8 w-8 text-white drop-shadow-lg" />
        </div>
        {isAdmin && (
          <div className="absolute top-3 right-3 z-10 flex gap-1.5">
            <input
              ref={variantImgRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleVariantUpload(f);
                e.target.value = '';
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); variantImgRef.current?.click(); }}
              className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              title="Upload image for this variant"
            >
              <Upload className="h-4 w-4" />
            </button>
            {hasCustomImage && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteVariant(); }}
                className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-destructive/70 transition-colors"
                title={currentVariant?.isCustom ? "Delete this variant" : "Revert to default image"}
              >
                {currentVariant?.isCustom ? <Trash2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
              </button>
            )}
          </div>
        )}
        {mergedVariants.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveVariant((p) => (p - 1 + mergedVariants.length) % mergedVariants.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveVariant((p) => (p + 1) % mergedVariants.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {mergedVariants.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setActiveVariant(i); }}
              className={`h-2 rounded-full transition-all ${
                i === activeVariant ? "w-6 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      <PreviewDialog
        open={imagePreviewOpen}
        onOpenChange={setImagePreviewOpen}
        title={`${division.name} — ${currentVariant?.label || ''}`}
        previewUrl={resolvedImage}
        type="image"
      />

      {/* Variant Labels + Add Variant */}
      <div className="flex gap-2 flex-wrap items-center">
        {mergedVariants.map((v, i) => (
          <Button
            key={v.label}
            variant={i === activeVariant ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveVariant(i)}
            className="text-xs gap-1"
          >
            {v.label}
            {v.isCustom && <span className="text-[9px] opacity-60">(custom)</span>}
          </Button>
        ))}
        {isAdmin && !addingVariant && (
          <Button variant="outline" size="sm" className="text-xs gap-1 border-dashed" onClick={() => setAddingVariant(true)}>
            <Plus className="h-3 w-3" /> Add Variant
          </Button>
        )}
      </div>

      {/* Add Variant Form */}
      {isAdmin && addingVariant && (
        <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg border border-border bg-muted/30">
          <Input
            placeholder="Variant label (e.g. RDT-110 Dark)"
            value={newVariantLabel}
            onChange={(e) => setNewVariantLabel(e.target.value)}
            className="text-sm h-9"
          />
          <input
            ref={newVariantFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAddVariant(f);
              e.target.value = '';
            }}
          />
          <div className="flex gap-1.5 shrink-0">
            <Button
              size="sm"
              className="h-9 gap-1"
              onClick={() => newVariantFileRef.current?.click()}
              disabled={!newVariantLabel.trim() || uploading}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>
            <Button size="sm" variant="ghost" className="h-9" onClick={() => { setAddingVariant(false); setNewVariantLabel(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Variant-Specific Info Section */}
      {currentVariant && (
        <VariantInfoSection
          divisionId={division.id}
          variantLabel={currentVariant.label}
          isAdmin={isAdmin}
          color={division.color}
          divisionTagline={division.tagline}
        />
      )}

      {/* Booth Details - Collapsible, default open in page mode */}
      <div className="rounded-xl border border-border/60 bg-background overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/40 transition-colors"
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Booth Details</h3>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence initial={false}>
          {detailsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-6">
                {/* Info Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <ServicesManager divisionId={division.id} isAdmin={isAdmin} color={division.color} variantLabel={currentVariant?.label} />
                    <QRCodesManager divisionId={division.id} isAdmin={isAdmin} color={division.color} variantLabel={currentVariant?.label} />
                    <ContactWebsiteEditor division={division} isAdmin={isAdmin} />
                  </div>

                  <div className="space-y-6">
                    <ProductionSpecsManager divisionId={division.id} isAdmin={isAdmin} color={division.color} variantLabel={currentVariant?.label} />

                    {/* Font Family Callout */}
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3 hover:border-primary/30 hover:shadow-lg transition-all duration-200">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Type className="h-4 w-4" /> Font Family
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Poppins</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Used across all booth materials — weights 300–800</p>
                        </div>
                        <a
                          href="https://fonts.google.com/specimen/Poppins"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors shrink-0"
                        >
                          <Download className="h-3 w-3" /> Download
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {['Light 300', 'Regular 400', 'Medium 500', 'SemiBold 600', 'Bold 700', 'ExtraBold 800'].map(w => (
                          <span key={w} className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border/40 text-muted-foreground">{w}</span>
                        ))}
                      </div>
                    </div>

                    {/* Color Palette */}
                    <BoothColorPalette color={division.color} boothColors={division.boothColors} isAdmin={isAdmin} divisionId={division.id} variantLabel={currentVariant?.label} divisionName={division.name} imageUrls={images.map(img => img.image_url)} />

                    {/* Color Analysis */}
                    <BoothColorAnalysisPanel
                      divisionId={division.id}
                      divisionName={division.name}
                      variantLabel={currentVariant?.label}
                      fallbackColors={division.boothColors}
                      isAdmin={isAdmin}
                      color={division.color}
                    />

                    {/* Booth Gallery */}
                    <BoothGalleryManager divisionId={division.id} isAdmin={isAdmin} color={division.color} variantLabel={currentVariant?.label} />
                  </div>
                </div>

                {/* 3D Booth Mapper */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Box className="h-5 w-5" style={{ color: division.color }} />
                    <h3 className="text-lg font-semibold">3D Booth Mapper</h3>
                    <Badge variant="outline" className="text-xs">Interactive</Badge>
                  </div>
                  <Suspense fallback={
                    <div className="h-[400px] rounded-xl border flex items-center justify-center bg-muted/30">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading 3D viewer...</span>
                      </div>
                    </div>
                  }>
                    <LazyBoothMapper3D
                      variantImages={mergedVariants.map(v => ({ label: v.label, url: v.image }))}
                      divisionName={division.name}
                      divisionId={division.id}
                      variantLabel={currentVariant?.label || 'default'}
                      isAdmin={isAdmin}
                    />
                  </Suspense>
                </div>

                {/* Booth Content Details */}
                <BoothContentManager divisionId={division.id} divisionName={division.name} isAdmin={isAdmin} color={division.color} variantLabel={currentVariant?.label} variants={mergedVariants.map(v => v.label)} />

                {/* Download Links */}
                <DownloadLinksManager divisionId={division.id} isAdmin={isAdmin} color={division.color} variantLabel={currentVariant?.label} />

                {/* AI Booth Analysis */}
                <BoothAIAnalysis
                  divisionId={division.id}
                  divisionName={division.name}
                  divisionTagline={division.tagline}
                  divisionDescription={division.description}
                  divisionServices={division.services}
                  divisionColor={division.color}
                  variantLabel={currentVariant?.label}
                  isAdmin={isAdmin}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  if (mode === 'page') {
    return (
      <div className="w-full">
        {/* Page header with division info */}
        <div className="mb-6">
          <p className="text-lg text-muted-foreground">{division.tagline}</p>
          <p className="text-sm text-muted-foreground/80 mt-2 max-w-3xl leading-relaxed">{division.description}</p>
          {division.stats && division.stats.length > 0 && (
            <div className="flex gap-3 mt-4">
              {division.stats.map((stat) => (
                <div key={stat.label} className="px-4 py-2 rounded-lg bg-muted/50 border border-border">
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {contentBody}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-5xl max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: division.color }}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading">{division.name}</h2>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {contentBody}
        </div>
      </motion.div>
    </motion.div>
  );
};

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, FlaskConical, Scale, Shield, Monitor, Film, Gamepad2,
  Radio, Heart, Database, Microscope, Globe, BarChart3,
};

export function customToBoothDivision(c: CustomDivision): BoothDivision {
  return {
    id: c.division_id,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    icon: ICON_MAP[c.icon_name] || Building2,
    color: c.color,
    email: c.email,
    website: c.website,
    services: c.services || [],
    images: [],
    variants: [],
  };
}

export default function BoothsCatalog() {
  const [selected, setSelected] = useState<BoothDivision | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [heroEditorOpen, setHeroEditorOpen] = useState(false);
  const [addingBooth, setAddingBooth] = useState(false);
  const [newBoothName, setNewBoothName] = useState("");
  const [newBoothTagline, setNewBoothTagline] = useState("");
  const [newBoothDesc, setNewBoothDesc] = useState("");
  const [newBoothColor, setNewBoothColor] = useState("hsl(200, 70%, 45%)");
  const [newBoothEmail, setNewBoothEmail] = useState("");
  const [newBoothWebsite, setNewBoothWebsite] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { settings: heroSettings, updateSettings: updateHeroSettings } = usePageHeroSettings('booths');
  const { divisions: customDivisions, addDivision, updateDivision, deleteDivision, refetch: refetchCustomDivisions } = useCustomDivisions();
  const [editingBooth, setEditingBooth] = useState<CustomDivision | null>(null);
  const [editFields, setEditFields] = useState({ name: "", tagline: "", description: "", color: "", email: "", website: "" });
  const [sortBy, setSortBy] = useState<'default' | 'a-z' | 'z-a' | 'services'>('default');

  const staticDivisionIds = new Set(DIVISIONS.map(d => d.id));
  const allDivisions: BoothDivision[] = [
    ...DIVISIONS.map(div => {
      const override = customDivisions.find(c => c.division_id === div.id);
      if (!override) return div;
      return {
        ...div,
        tagline: override.tagline || div.tagline,
        description: override.description || div.description,
        email: override.email || div.email,
        website: override.website || div.website,
        services: override.services?.length ? override.services : div.services,
        color: override.color || div.color,
      };
    }),
    ...customDivisions.filter(c => !staticDivisionIds.has(c.division_id)).map(customToBoothDivision),
  ];

  const sortedDivisions = [...allDivisions].sort((a, b) => {
    switch (sortBy) {
      case 'a-z': return a.name.localeCompare(b.name);
      case 'z-a': return b.name.localeCompare(a.name);
      case 'services': return b.services.length - a.services.length;
      default: return 0;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Auto-open a division if navigated from a linked booth card
  useEffect(() => {
    const state = location.state as { openDivision?: string } | null;
    if (state?.openDivision) {
      navigate(`/booths/${state.openDivision}`, { replace: true });
    }
  }, [location.state]);

  // Check if current user is authenticated (admin)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(!!user);
      setUserEmail(user?.email ?? null);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session?.user);
      setUserEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAddBooth = async () => {
    if (!newBoothName.trim()) return;
    const result = await addDivision({
      name: newBoothName.trim(),
      tagline: newBoothTagline.trim(),
      description: newBoothDesc.trim(),
      color: newBoothColor,
      email: newBoothEmail.trim(),
      website: newBoothWebsite.trim(),
    });
    if (result) {
      setAddingBooth(false);
      setNewBoothName("");
      setNewBoothTagline("");
      setNewBoothDesc("");
      setNewBoothColor("hsl(200, 70%, 45%)");
      setNewBoothEmail("");
      setNewBoothWebsite("");
    }
  };

  const isCustomDivision = (divId: string) => customDivisions.some(c => c.division_id === divId);

  const startEditBooth = (divId: string) => {
    const c = customDivisions.find(d => d.division_id === divId);
    const staticDiv = DIVISIONS.find(d => d.id === divId);
    if (c) {
      setEditingBooth(c);
      setEditFields({ name: c.name, tagline: c.tagline, description: c.description, color: c.color, email: c.email, website: c.website });
    } else if (staticDiv) {
      // Create a virtual CustomDivision for editing static booths
      const virtual: CustomDivision = {
        id: '', division_id: divId, name: staticDiv.name, tagline: staticDiv.tagline,
        description: staticDiv.description, color: staticDiv.color, icon_name: '',
        email: staticDiv.email, website: staticDiv.website, services: staticDiv.services, display_order: 0,
      };
      setEditingBooth(virtual);
      setEditFields({ name: staticDiv.name, tagline: staticDiv.tagline, description: staticDiv.description, color: staticDiv.color, email: staticDiv.email, website: staticDiv.website });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBooth || !editFields.name.trim()) return;
    const existsInDb = customDivisions.some(c => c.division_id === editingBooth.division_id);
    if (existsInDb) {
      const ok = await updateDivision(editingBooth.division_id, {
        name: editFields.name.trim(),
        tagline: editFields.tagline.trim(),
        description: editFields.description.trim(),
        color: editFields.color,
        email: editFields.email.trim(),
        website: editFields.website.trim(),
      });
      if (ok) setEditingBooth(null);
    } else {
      // Create override row for static division
      const { error } = await supabase.from("booth_custom_divisions").insert({
        division_id: editingBooth.division_id,
        name: editFields.name.trim(),
        tagline: editFields.tagline.trim(),
        description: editFields.description.trim(),
        color: editFields.color,
        email: editFields.email.trim(),
        website: editFields.website.trim(),
        display_order: 0,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) {
        toast.error("Failed to save: " + error.message);
      } else {
        toast.success("Booth details updated");
        setEditingBooth(null);
        await refetchCustomDivisions();
      }
    }
  };

  const renderHeroEffect = () => {
    const effect = heroSettings.heroEffect;
    if (effect === 'none') return null;

    const commonProps = {
      colorScheme: (heroSettings.heroEffectColorScheme || 'cyan-purple') as any,
      mode: heroSettings.heroEffectMode || 'dark',
      brightness: heroSettings.heroEffectBrightness ?? 50,
    };

    switch (effect) {
      case 'gradient-bars':
        return (
          <GradientBarsHero
            {...commonProps}
            intensity={heroSettings.heroEffectIntensity || 'medium'}
            barCount={6}
          />
        );
      case 'horizon-glow':
        return <HorizonGlowHero {...commonProps} />;
      case 'floating-orbs':
        return (
          <FloatingOrbsHero
            {...commonProps}
            density={heroSettings.heroEffectDensity || 'normal'}
            speed={heroSettings.heroEffectSpeed || 'normal'}
          />
        );
      case 'gradient-spheres':
        return (
          <GradientSpheresHero
            {...commonProps}
            density={heroSettings.heroEffectDensity || 'normal'}
            speed={heroSettings.heroEffectSpeed || 'normal'}
          />
        );
      case 'image-orbs':
        return (
          <ImageOrbsHero
            {...commonProps}
            orbCount={
              heroSettings.heroEffectDensity === 'few' ? 3 :
              heroSettings.heroEffectDensity === 'many' ? 8 :
              heroSettings.heroEffectDensity === 'dense' ? 12 : 5
            }
          />
        );
      case 'image-panels':
        return <ImagePanelsHero {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative" style={{ minHeight: '320px' }}>
        <div className="absolute inset-0 overflow-hidden">
          {/* Hero Effect Background */}
          {heroSettings.heroEffect !== 'none' ? (
            <div className="absolute inset-0 z-0">
              {renderHeroEffect()}
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(200,85%,20%)] via-[hsl(205,75%,30%)] to-[hsl(210,70%,25%)]" />
          )}
        </div>

        {/* Admin Hero Edit Toggle */}
        {isAdmin && !heroEditorOpen && (
          <button
            onClick={() => setHeroEditorOpen(true)}
            className="absolute top-4 right-4 z-50 h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            title="Edit Hero"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}

        {/* Admin Hero Edit Toolbar - toggleable */}
        {isAdmin && heroEditorOpen && (
          <div className="absolute inset-x-0 top-0 z-50 pointer-events-none">
            <div className="relative max-w-7xl mx-auto pointer-events-auto">
              <button
                onClick={() => setHeroEditorOpen(false)}
                className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                title="Close Editor"
              >
                <X className="h-4 w-4" />
              </button>
              <HeroEditToolbar
                useVideo={false}
                kenBurnsEffect={false}
                kenBurnsPreview={false}
                isUploading={false}
                onMediaTypeChange={() => {}}
                onKenBurnsToggle={() => {}}
                onKenBurnsPreviewStart={() => {}}
                onKenBurnsPreviewEnd={() => {}}
                onUploadClick={() => {}}
                onVideoUrlClick={() => {}}
                onLibrarySelect={() => {}}
                heroEffect={heroSettings.heroEffect}
                heroEffectIntensity={heroSettings.heroEffectIntensity}
                heroEffectColorScheme={heroSettings.heroEffectColorScheme}
                heroEffectMode={heroSettings.heroEffectMode}
                heroEffectBrightness={heroSettings.heroEffectBrightness}
                heroEffectDensity={heroSettings.heroEffectDensity}
                heroEffectSpeed={heroSettings.heroEffectSpeed}
                onHeroEffectChange={(effect) => updateHeroSettings({ heroEffect: effect })}
                onHeroEffectIntensityChange={(v) => updateHeroSettings({ heroEffectIntensity: v })}
                onHeroEffectColorSchemeChange={(v) => updateHeroSettings({ heroEffectColorScheme: v })}
                onHeroEffectModeChange={(v) => updateHeroSettings({ heroEffectMode: v })}
                onHeroEffectBrightnessChange={(v) => updateHeroSettings({ heroEffectBrightness: v })}
                onHeroEffectDensityChange={(v) => updateHeroSettings({ heroEffectDensity: v })}
                onHeroEffectSpeedChange={(v) => updateHeroSettings({ heroEffectSpeed: v })}
              />
            </div>
          </div>
        )}

        <div className="relative max-w-7xl mx-auto z-10 py-20 px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="cursor-pointer inline-block" onClick={() => navigate('/org/transperfect')}><BrandHubLogo size="sm" forceDark /></div>
            <div className="flex items-center gap-2">
              <ThemeToggle className="h-8 w-8 text-white hover:bg-white/10" />
            {isAdmin && userEmail && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent/10 text-accent text-sm font-medium">
                        {userEmail.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent border-2 border-background" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userEmail}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3 text-accent" />
                        <span className="text-accent">Admin</span>
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 cursor-pointer">
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/org/transperfect')} className="gap-2 cursor-pointer">
                    <Building2 className="h-4 w-4" />
                    Organization Portal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/org/transperfect/settings')} className="gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Organization Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/help')} className="gap-2 cursor-pointer">
                    <HelpCircle className="h-4 w-4" />
                    Help Center
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => { await supabase.auth.signOut(); navigate('/auth'); }} 
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="h-1 w-16 bg-[hsl(195,100%,50%)] rounded-full" />
            <span className="text-[hsl(195,100%,70%)] text-sm font-semibold tracking-[0.2em] uppercase">
              TransPerfect 2026
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white font-heading mb-3 tracking-tight">
            Booth <GlitchText text="Catalog" glowColor="hsl(195 100% 60%)" className="text-4xl md:text-6xl font-bold font-heading" forceDark />
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Explore booth designs across all 12 TransPerfect divisions. Click any card to view variants, services, and contact details.
          </p>
          <div className="mt-6 flex gap-3">
            <Badge className="bg-white/10 text-white/80 border-white/20 text-sm px-3 py-1">
              12 Divisions
            </Badge>
            <Badge className="bg-white/10 text-white/80 border-white/20 text-sm px-3 py-1">
              30+ Booth Variants
            </Badge>
            <Badge className="bg-white/10 text-white/80 border-white/20 text-sm px-3 py-1">
              2026 Season
            </Badge>
            <Badge className="bg-white/10 text-white/80 border-white/20 text-sm px-3 py-1">
              2026 Season
            </Badge>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2"
              onClick={() => navigate('/booth-systems')}
            >
              <BookTemplate className="h-4 w-4" />
              System Library
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2"
              onClick={() => navigate('/expo-floor')}
            >
              <MapPin className="h-4 w-4" />
              Expo Floor Planner
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Sort Bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">{sortedDivisions.length} Divisions</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort by</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="a-z">A → Z</SelectItem>
                <SelectItem value="z-a">Z → A</SelectItem>
                <SelectItem value="services">Most Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDivisions.map((div, i) => (
            <motion.div
              key={div.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="relative group/card"
            >
              <BoothCardWithImages division={div} onClick={() => navigate(`/booths/${div.id}`)} isAdmin={isAdmin} />
              {/* Edit/Delete buttons for admin */}
              {isAdmin && (
                <div className="absolute top-3 left-3 z-10 flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEditBooth(div.id); }}
                    className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-primary/70 transition-colors"
                    title="Edit booth details"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {isCustomDivision(div.id) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteDivision(div.id); }}
                      className="h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-destructive/70 transition-colors"
                      title="Delete this booth"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}

          {/* Add Booth Card - Admin only */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: allDivisions.length * 0.05, duration: 0.4 }}
            >
              {!addingBooth ? (
                <button
                  onClick={() => setAddingBooth(true)}
                  className="w-full h-full min-h-[280px] rounded-2xl border-2 border-dashed border-border/60 bg-card/50 hover:border-primary/40 hover:bg-card transition-all flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground group"
                >
                  <div className="h-12 w-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">Add New Booth</span>
                </button>
              ) : (
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold">New Booth Division</h3>
                  <Input
                    placeholder="Booth name *"
                    value={newBoothName}
                    onChange={(e) => setNewBoothName(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Tagline"
                    value={newBoothTagline}
                    onChange={(e) => setNewBoothTagline(e.target.value)}
                    className="text-sm"
                  />
                  <Textarea
                    placeholder="Description"
                    value={newBoothDesc}
                    onChange={(e) => setNewBoothDesc(e.target.value)}
                    className="text-sm min-h-[60px]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Email"
                      value={newBoothEmail}
                      onChange={(e) => setNewBoothEmail(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Website"
                      value={newBoothWebsite}
                      onChange={(e) => setNewBoothWebsite(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Color:</label>
                    <input
                      type="color"
                      value={newBoothColor.startsWith("hsl") ? "#3b82f6" : newBoothColor}
                      onChange={(e) => setNewBoothColor(e.target.value)}
                      className="h-8 w-10 rounded border border-border cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleAddBooth} disabled={!newBoothName.trim()}>
                      Create Booth
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddingBooth(false); setNewBoothName(""); setNewBoothTagline(""); setNewBoothDesc(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Edit Booth Dialog */}
      {editingBooth && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingBooth(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Booth Details</h3>
              <button onClick={() => setEditingBooth(null)} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Input
              placeholder="Booth name *"
              value={editFields.name}
              onChange={(e) => setEditFields(f => ({ ...f, name: e.target.value }))}
              className="text-sm"
            />
            <Input
              placeholder="Tagline"
              value={editFields.tagline}
              onChange={(e) => setEditFields(f => ({ ...f, tagline: e.target.value }))}
              className="text-sm"
            />
            <Textarea
              placeholder="Description"
              value={editFields.description}
              onChange={(e) => setEditFields(f => ({ ...f, description: e.target.value }))}
              className="text-sm min-h-[80px]"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Email"
                value={editFields.email}
                onChange={(e) => setEditFields(f => ({ ...f, email: e.target.value }))}
                className="text-sm"
              />
              <Input
                placeholder="Website"
                value={editFields.website}
                onChange={(e) => setEditFields(f => ({ ...f, website: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Color:</label>
              <input
                type="color"
                value={editFields.color.startsWith("hsl") ? "#3b82f6" : editFields.color}
                onChange={(e) => setEditFields(f => ({ ...f, color: e.target.value }))}
                className="h-8 w-10 rounded border border-border cursor-pointer"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={!editFields.name.trim()}>
                Save Changes
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingBooth(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

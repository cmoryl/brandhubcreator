import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, FlaskConical, Scale, Shield, Monitor, Film, Gamepad2, 
  Radio, Heart, Database, Microscope, Globe, X, ChevronLeft, ChevronRight,
  Mail, ExternalLink, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BoothDivision {
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
}

const DIVISIONS: BoothDivision[] = [
  {
    id: "corporate",
    name: "Corporate",
    tagline: "The Language of Global Business",
    description: "Any Customer. Any Language. Any Channel. TransPerfect Corporate delivers efficient translation, real-time analytics, and improved user experience across all channels.",
    icon: Building2,
    color: "hsl(200, 85%, 45%)",
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
  },
  {
    id: "life-sciences",
    name: "Life Sciences",
    tagline: "Simplify Your Path From Lab to Launch",
    description: "End-to-end language and technology solutions for pharmaceutical, biotech, and medical device companies—from clinical trials through global product launch.",
    icon: FlaskConical,
    color: "hsl(195, 80%, 40%)",
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
  },
  {
    id: "legal",
    name: "Legal",
    tagline: "The Global Leader in Legal Technology & Support",
    description: "Faster case outcomes through innovative legal technology, strategic industry expertise, and seamless multilingual support.",
    icon: Scale,
    color: "hsl(210, 70%, 35%)",
    email: "legal@transperfect.com",
    website: "www.transperfectlegal.com",
    services: ["Faster Case Outcomes", "Innovative Legal Technology", "Strategic Industry Expertise", "Seamless Multilingual Support", "eDiscovery", "Forensic Technology", "Managed Review"],
    images: ["/booths/legal.jpg"],
    variants: [{ label: "Standard", image: "/booths/legal.jpg" }],
  },
  {
    id: "ip",
    name: "IP (Intellectual Property)",
    tagline: "Protect Your IP in Any Country",
    description: "Leverage global patent expertise, streamline filing processes, and accelerate translation timelines with AI-powered GlobalLink solutions.",
    icon: Shield,
    color: "hsl(220, 65%, 40%)",
    email: "patents@transperfect.com",
    website: "www.transperfectip.com",
    services: ["Global Patent Quality & Efficiency", "Streamlined Patent Filing", "AI-Powered Translation", "Quality & Expertise", "Accelerated Filing Timelines", "GlobalLink Integration"],
    images: ["/booths/ip.jpg"],
    variants: [{ label: "Standard", image: "/booths/ip.jpg" }],
  },
  {
    id: "digital",
    name: "Digital",
    tagline: "Global Performance for International Brands",
    description: "Any Market. Any Language. Performance-led. Measurable Results. Full-service international digital marketing powered by AI and data.",
    icon: Monitor,
    color: "hsl(265, 60%, 50%)",
    email: "TPDigital@transperfect.com",
    website: "www.transperfectdigital.com",
    services: ["International SEO & Paid Media", "Performance Content & Copywriting", "LLM Solutions", "Social Media Intelligence", "AI Copywriting", "Market Intelligence"],
    images: ["/booths/digital-1.jpg", "/booths/digital-2.jpg"],
    variants: [
      { label: "Dark Theme", image: "/booths/digital-1.jpg" },
      { label: "Lite Theme", image: "/booths/digital-2.jpg" },
    ],
  },
  {
    id: "media",
    name: "Media",
    tagline: "Where Boutique Expertise Meets Global Excellence",
    description: "Full-spectrum media localization, post-production, accessibility, distribution, and content creation with 130+ recording studios worldwide.",
    icon: Film,
    color: "hsl(340, 65%, 45%)",
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
  },
  {
    id: "games",
    name: "Games",
    tagline: "The Language of Global Games",
    description: "Where Boutique Expertise Meets Global Excellence. Full lifecycle game services from art and development to localization, marketing, QA, and player support.",
    icon: Gamepad2,
    color: "hsl(150, 60%, 40%)",
    email: "games@transperfect.com",
    website: "transperfectgames.com",
    services: ["Art & Development", "Localization", "Marketing", "QA Testing", "Player Support", "AI Integration"],
    images: ["/booths/games.jpg"],
    variants: [{ label: "Standard", image: "/booths/games.jpg" }],
  },
  {
    id: "live",
    name: "Live",
    tagline: "Multilingual Event Solutions",
    description: "Powered by GlobalLink. Deliver engaging, inclusive, and accessible events for global audiences with human expertise, AI services, and event technology.",
    icon: Radio,
    color: "hsl(180, 55%, 40%)",
    email: "live@transperfect.com",
    website: "www.transperfect.com",
    services: ["Content Creation", "Technology Consulting", "App, Web & Platform Localization", "Post-Launch Activities", "Expert Interpreters", "Global Availability", "Tailored Service", "Human Expertise", "AI Services", "Event Technology"],
    images: ["/booths/live-1.jpg", "/booths/live-2.jpg", "/booths/live-3.jpg"],
    variants: [
      { label: "Dark Theme", image: "/booths/live-1.jpg" },
      { label: "Lite Theme", image: "/booths/live-2.jpg" },
      { label: "Custom Build", image: "/booths/live-3.jpg" },
    ],
  },
  {
    id: "health",
    name: "Health",
    tagline: "Serving Seniors Through the Continuum of Care",
    description: "Holistic, outcome-driven rehabilitation services and partnership models with translation, localization, and digital health solutions.",
    icon: Heart,
    color: "hsl(350, 70%, 50%)",
    email: "tphealth@transperfect.com",
    website: "www.transperfect.com",
    services: ["Physical, Occupational & Speech Therapy", "Rehabilitation Services & Staffing", "Flexible Partnership Models", "Marketing Data Access", "Translation & Localization", "Digital Health", "30+ Years Experience"],
    images: ["/booths/health-1.jpg", "/booths/health-2.jpg"],
    variants: [
      { label: "Dark Theme", image: "/booths/health-1.jpg" },
      { label: "Lite Theme", image: "/booths/health-2.jpg" },
    ],
  },
  {
    id: "dataforce",
    name: "DataForce",
    tagline: "Human Insights for AI that is Reliable. Refined. Respected.",
    description: "AI training data services including data collection, annotation, transcription, generative AI support, user studies, and ethical content moderation.",
    icon: Database,
    color: "hsl(270, 55%, 50%)",
    email: "dataforce@transperfect.com",
    website: "www.dataforce.ai",
    services: ["Data Collection", "Data Annotation", "Data Relevance", "Transcription", "Generative AI", "User Studies & Rating", "Business Process Chatbot", "Bias Mitigation", "Ethical Content Moderation"],
    images: ["/booths/dataforce-1.jpg", "/booths/dataforce-2.jpg"],
    variants: [
      { label: "Standard", image: "/booths/dataforce-1.jpg" },
      { label: "China Smart", image: "/booths/dataforce-2.jpg" },
    ],
  },
  {
    id: "trial-interactive",
    name: "Trial Interactive",
    tagline: "Enabling Trial Collaboration in the Cloud",
    description: "eClinical platform delivering connected, white-glove expert support services with AI-powered trial intelligence for clinical research.",
    icon: Microscope,
    color: "hsl(190, 65%, 42%)",
    email: "info@trialinteractive.com",
    website: "www.trialinteractive.com",
    services: ["eClinical Platform", "Connected Support", "White-Glove Service", "Expert Support Services", "AI-Powered Trial Intelligence", "Cloud Collaboration"],
    images: ["/booths/trial-interactive-1.jpg", "/booths/trial-interactive-2.jpg"],
    variants: [
      { label: "Dark Theme", image: "/booths/trial-interactive-1.jpg" },
      { label: "Lite Theme", image: "/booths/trial-interactive-2.jpg" },
    ],
  },
  {
    id: "g3",
    name: "G3",
    tagline: "Shaping Global Content. Empowering Human Connection.",
    description: "AI-driven global content solutions—scalable, AI-powered, and human-driven—for learning, localization, market insights, and growth partnerships. WBENC & ISO certified.",
    icon: Globe,
    color: "hsl(25, 70%, 50%)",
    email: "info@theg3company.com",
    website: "theg3company.com",
    services: ["Learning & Development", "Localization & Content Solutions", "Market & Insights", "Scalable Growth Partnership", "Content Enablement", "AI-Driven Content"],
    images: ["/booths/g3-1.jpg", "/booths/g3-2.jpg"],
    variants: [
      { label: "Dark Theme", image: "/booths/g3-1.jpg" },
      { label: "Lite Theme", image: "/booths/g3-2.jpg" },
    ],
  },
];

const BoothCard = ({ division, onClick }: { division: BoothDivision; onClick: () => void }) => {
  const Icon = division.icon;
  return (
    <motion.button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card text-left transition-all hover:border-primary/30 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={division.images[0]}
          alt={`${division.name} booth`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
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
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-white/90 text-foreground text-xs backdrop-blur-sm">
            {division.variants.length} {division.variants.length === 1 ? "variant" : "variants"}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{division.description}</p>
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

const DivisionDetail = ({ division, onClose }: { division: BoothDivision; onClose: () => void }) => {
  const [activeVariant, setActiveVariant] = useState(0);
  const Icon = division.icon;

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
              <p className="text-sm text-muted-foreground">{division.tagline}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Image Viewer */}
            <div className="relative rounded-xl overflow-hidden bg-muted aspect-[16/9]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeVariant}
                  src={division.variants[activeVariant].image}
                  alt={division.variants[activeVariant].label}
                  className="w-full h-full object-contain bg-muted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              {division.variants.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveVariant((p) => (p - 1 + division.variants.length) % division.variants.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setActiveVariant((p) => (p + 1) % division.variants.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {division.variants.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveVariant(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === activeVariant ? "w-6 bg-white" : "w-2 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Variant Labels */}
            {division.variants.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {division.variants.map((v, i) => (
                  <Button
                    key={v.label}
                    variant={i === activeVariant ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveVariant(i)}
                    className="text-xs"
                  >
                    {v.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Info Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
                  <p className="text-sm leading-relaxed">{division.description}</p>
                </div>

                {division.stats && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Stats</h3>
                    <div className="flex gap-4">
                      {division.stats.map((s) => (
                        <div key={s.label} className="bg-muted/50 rounded-lg px-4 py-3 text-center">
                          <div className="text-lg font-bold" style={{ color: division.color }}>{s.value}</div>
                          <div className="text-xs text-muted-foreground">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <a href={`mailto:${division.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Mail className="h-4 w-4" /> {division.email}
                  </a>
                  <a href={`https://${division.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink className="h-4 w-4" /> {division.website}
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Services & Capabilities</h3>
                <div className="flex flex-wrap gap-2">
                  {division.services.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="text-xs"
                      style={{ borderColor: division.color + "40" }}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
};

export default function BoothsCatalog() {
  const [selected, setSelected] = useState<BoothDivision | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[hsl(200,85%,20%)] via-[hsl(205,75%,30%)] to-[hsl(210,70%,25%)] py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url('/booths/page-cover.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px)',
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="text-white/70 hover:text-white hover:bg-white/10 mb-6 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-1 w-16 bg-[hsl(195,100%,50%)] rounded-full" />
            <span className="text-[hsl(195,100%,70%)] text-sm font-semibold tracking-[0.2em] uppercase">
              TransPerfect 2026
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white font-heading mb-3 tracking-tight">
            Booth <span className="text-[hsl(195,100%,60%)]">Catalog</span>
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
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DIVISIONS.map((div, i) => (
            <motion.div
              key={div.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <BoothCard division={div} onClick={() => setSelected(div)} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <DivisionDetail division={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

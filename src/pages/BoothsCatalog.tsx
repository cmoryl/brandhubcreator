import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, FlaskConical, Scale, Shield, Monitor, Film, Gamepad2, 
  Radio, Heart, Database, Microscope, Globe, X, ChevronLeft, ChevronRight,
  Mail, ExternalLink, ArrowLeft, Plus, Pencil, Trash2, Loader2, BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// ScrollArea removed - using native overflow for mobile compatibility
import { supabase } from "@/integrations/supabase/client";
import { useBoothDownloadLinks } from "@/hooks/useBoothDownloadLinks";
import { useBoothKeyStats } from "@/hooks/useBoothKeyStats";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { usePageHeroSettings } from "@/hooks/usePageHeroSettings";
import { HeroEditToolbar, HeroEffectType } from "@/components/brand/HeroEditToolbar";
import { GradientBarsHero } from "@/components/backgrounds/GradientBarsHero";
import { HorizonGlowHero } from "@/components/backgrounds/HorizonGlowHero";
import { FloatingOrbsHero } from "@/components/backgrounds/FloatingOrbsHero";
import { GradientSpheresHero } from "@/components/backgrounds/GradientSpheresHero";
import { ImageOrbsHero } from "@/components/backgrounds/ImageOrbsHero";
import { ImagePanelsHero } from "@/components/backgrounds/ImagePanelsHero";
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
  imageRotation?: number;
  downloadLinks?: { label: string; url: string }[];
  boothContent?: { heading: string; bullets: string[] }[];
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
    email: "legal@transperfect.com",
    website: "www.transperfectlegal.com",
    services: ["Faster Case Outcomes", "Innovative Legal Technology", "Strategic Industry Expertise", "Seamless Multilingual Support", "eDiscovery", "Forensic Technology", "Managed Review"],
    images: ["/booths/legal.jpg"],
    variants: [{ label: "Standard", image: "/booths/legal.jpg" }],
    imageRotation: -90,
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
          style={division.imageRotation ? { transform: `rotate(${division.imageRotation}deg)`, objectFit: 'contain' } : undefined}
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

const DownloadLinksManager = ({ divisionId, isAdmin, color }: { divisionId: string; isAdmin: boolean; color: string }) => {
  const { links, loading, addLink, updateLink, deleteLink } = useBoothDownloadLinks(divisionId);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const handleAdd = async () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    await addLink(newLabel.trim(), newUrl.trim());
    setNewLabel("");
    setNewUrl("");
    setAdding(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editLabel.trim() || !editUrl.trim()) return;
    await updateLink(editingId, editLabel.trim(), editUrl.trim());
    setEditingId(null);
  };

  const startEdit = (link: { id: string; label: string; url: string }) => {
    setEditingId(link.id);
    setEditLabel(link.label);
    setEditUrl(link.url);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading downloads...
      </div>
    );
  }

  if (links.length === 0 && !isAdmin) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Download Files</h3>
        {isAdmin && !adding && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Link
          </Button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="flex flex-col sm:flex-row gap-2 mb-3 p-3 rounded-lg border border-border bg-muted/30">
          <Input
            placeholder="Label (e.g. 108 Dark)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="text-sm h-9"
          />
          <Input
            placeholder="URL (https://...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="text-sm h-9"
          />
          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" className="h-9" onClick={handleAdd} disabled={!newLabel.trim() || !newUrl.trim()}>
              Save
            </Button>
            <Button size="sm" variant="ghost" className="h-9" onClick={() => { setAdding(false); setNewLabel(""); setNewUrl(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {links.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {links.map((link) => (
            <div key={link.id}>
              {editingId === link.id ? (
                <div className="flex flex-col gap-1.5 p-2 rounded-lg border border-primary/30 bg-muted/30">
                  <Input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="text-sm h-8"
                  />
                  <Input
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="text-sm h-8"
                  />
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
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteLink(link.id)}>
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
        <p className="text-xs text-muted-foreground italic">No download links yet. Click "Add Link" to add URLs for this booth.</p>
      ) : null}
    </div>
  );
};

const KeyStatsManager = ({ divisionId, isAdmin, color }: { divisionId: string; isAdmin: boolean; color: string }) => {
  const { stats, loading, addStat, updateStat, deleteStat } = useBoothKeyStats(divisionId);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newIconSvg, setNewIconSvg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editIconSvg, setEditIconSvg] = useState("");

  const handleAdd = async () => {
    if (!newLabel.trim() || !newValue.trim()) return;
    await addStat(newLabel.trim(), newValue.trim(), newIconSvg.trim() || undefined);
    setNewLabel(""); setNewValue(""); setNewIconSvg(""); setAdding(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editLabel.trim() || !editValue.trim()) return;
    await updateStat(editingId, editLabel.trim(), editValue.trim(), editIconSvg.trim() || null);
    setEditingId(null);
  };

  const startEdit = (stat: { id: string; label: string; value: string; icon_svg: string | null }) => {
    setEditingId(stat.id);
    setEditLabel(stat.label);
    setEditValue(stat.value);
    setEditIconSvg(stat.icon_svg || "");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading stats...
      </div>
    );
  }

  if (stats.length === 0 && !isAdmin) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Key Stats</h3>
        {isAdmin && !adding && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Stat
          </Button>
        )}
      </div>

      {adding && isAdmin && (
        <div className="mb-3 space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Label (e.g. Languages)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="text-sm" />
            <Input placeholder="Value (e.g. 170+)" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="text-sm" />
          </div>
          <Textarea placeholder="SVG icon code (optional, paste <svg>...</svg>)" value={newIconSvg} onChange={(e) => setNewIconSvg(e.target.value)} className="text-xs font-mono min-h-[60px]" />
          <div className="flex gap-2">
            <Button size="sm" className="text-xs" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setAdding(false); setNewLabel(""); setNewValue(""); setNewIconSvg(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {stats.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {stats.map((s) => (
            editingId === s.id && isAdmin ? (
              <div key={s.id} className="space-y-2 p-3 rounded-lg border border-primary/30 bg-muted/20 w-full">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="text-sm" />
                  <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-sm" />
                </div>
                <Textarea placeholder="SVG icon code (optional)" value={editIconSvg} onChange={(e) => setEditIconSvg(e.target.value)} className="text-xs font-mono min-h-[60px]" />
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs" onClick={handleUpdate}>Save</Button>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div key={s.id} className="bg-muted/50 rounded-lg px-4 py-3 text-center relative group min-w-[80px]">
                {s.icon_svg ? (
                  <div className="flex justify-center mb-1" dangerouslySetInnerHTML={{ __html: s.icon_svg }} />
                ) : (
                  <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground/50" />
                )}
                <div className="text-lg font-bold" style={{ color }}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                {isAdmin && (
                  <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(s)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteStat(s.id)}>
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

const DivisionDetail = ({ division, onClose, isAdmin }: { division: BoothDivision; onClose: () => void; isAdmin: boolean }) => {
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

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
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
                  style={division.imageRotation ? { transform: `rotate(${division.imageRotation}deg)` } : undefined}
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

                <KeyStatsManager divisionId={division.id} isAdmin={isAdmin} color={division.color} />

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

            {/* Booth Content Details */}
            {division.boothContent && division.boothContent.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Booth Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {division.boothContent.map((section) => (
                    <div key={section.heading} className="bg-muted/30 rounded-lg p-4 border border-border/40">
                      <h4 className="text-sm font-semibold mb-2" style={{ color: division.color }}>{section.heading}</h4>
                      <ul className="space-y-1.5">
                        {section.bullets.map((bullet, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: division.color }} />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download Links - Database-backed with admin management */}
            <DownloadLinksManager divisionId={division.id} isAdmin={isAdmin} color={division.color} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function BoothsCatalog() {
  const [selected, setSelected] = useState<BoothDivision | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { settings: heroSettings, updateSettings: updateHeroSettings } = usePageHeroSettings('booths');

  // Check if current user is authenticated (admin)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(!!user);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

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
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(200,85%,20%)] via-[hsl(205,75%,30%)] to-[hsl(210,70%,25%)]" />
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full" style={{
                  backgroundImage: `url('/booths/page-cover.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(2px)',
                }} />
              </div>
            </>
          )}
        </div>

        {/* Admin Hero Edit Toolbar - centered in hero for full visibility */}
        {isAdmin && (
          <div className="absolute inset-x-0 top-0 z-50 pointer-events-none">
            <div className="relative max-w-7xl mx-auto pointer-events-auto">
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
          <DivisionDetail division={selected} onClose={() => setSelected(null)} isAdmin={isAdmin} />
        )}
      </AnimatePresence>
    </div>
  );
}

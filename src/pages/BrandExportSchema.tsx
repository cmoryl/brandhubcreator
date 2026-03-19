import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Palette, 
  Type, 
  Image, 
  MessageSquare, 
  Share2, 
  Layout, 
  FileText, 
  Video, 
  Target,
  Sparkles,
  Ban,
  Hash,
  Globe,
  Layers,
  BookOpen
} from "lucide-react";

interface FieldDoc {
  name: string;
  type: string;
  description: string;
  example: string | object;
  eventKitUse?: string;
}

interface SchemaSection {
  title: string;
  icon: React.ReactNode;
  description: string;
  fields: FieldDoc[];
}

const schemaSections: SchemaSection[] = [
  {
    title: "Core Branding",
    icon: <Palette className="h-5 w-5" />,
    description: "Primary brand identity elements",
    fields: [
      {
        name: "colors",
        type: "Array<ColorObject>",
        description: "Full color palette with hex, RGB, CMYK, and Pantone values",
        example: [{ name: "Primary", hex: "#0066CC", role: "primary", cmyk: "100,50,0,0" }],
        eventKitUse: "Theme generation, asset colorization"
      },
      {
        name: "fonts",
        type: "Array<FontObject>",
        description: "Typography definitions for heading, body, and accent",
        example: [{ role: "heading", family: "Inter", weight: "700", fallback: "sans-serif" }],
        eventKitUse: "Text styling across all generated assets"
      },
      {
        name: "logo_url",
        type: "string | null",
        description: "Primary logo URL for quick access",
        example: "https://storage.example.com/logos/primary.svg",
        eventKitUse: "Default logo placement"
      },
      {
        name: "tagline",
        type: "string | null",
        description: "Primary brand tagline",
        example: "Innovating Tomorrow, Today",
        eventKitUse: "Header/footer text, social posts"
      },
      {
        name: "taglineVariations",
        type: "Array<string>",
        description: "Alternative taglines for different contexts",
        example: ["Lead with Innovation", "Your Partner in Growth"],
        eventKitUse: "A/B testing, context-specific messaging"
      }
    ]
  },
  {
    title: "Logo Variants",
    icon: <Layers className="h-5 w-5" />,
    description: "All available logo versions for different use cases",
    fields: [
      {
        name: "logos.primary",
        type: "string | null",
        description: "Full-color primary logo",
        example: "https://storage.example.com/logos/primary.svg",
        eventKitUse: "Main branding, light backgrounds"
      },
      {
        name: "logos.secondary",
        type: "string | null",
        description: "Secondary/alternate logo version",
        example: "https://storage.example.com/logos/secondary.svg",
        eventKitUse: "Alternative placements"
      },
      {
        name: "logos.monochrome",
        type: "string | null",
        description: "Single-color version for limited color contexts",
        example: "https://storage.example.com/logos/mono.svg",
        eventKitUse: "Watermarks, limited-color printing"
      },
      {
        name: "logos.reversed",
        type: "string | null",
        description: "Inverted colors for dark backgrounds",
        example: "https://storage.example.com/logos/reversed.svg",
        eventKitUse: "Dark mode, video overlays"
      },
      {
        name: "logos.icon",
        type: "string | null",
        description: "Standalone icon/symbol without wordmark",
        example: "https://storage.example.com/logos/icon.svg",
        eventKitUse: "Favicons, app icons, small spaces"
      },
      {
        name: "logos.wordmark",
        type: "string | null",
        description: "Text-only logo without symbol",
        example: "https://storage.example.com/logos/wordmark.svg",
        eventKitUse: "Horizontal layouts, headers"
      },
      {
        name: "logos.all",
        type: "Array<LogoObject>",
        description: "Complete array of all logo variants with metadata",
        example: [{ id: "uuid", name: "Primary", url: "...", variant: "primary" }],
        eventKitUse: "Full logo library access"
      }
    ]
  },
  {
    title: "Brand Identity",
    icon: <Target className="h-5 w-5" />,
    description: "Brand personality and positioning",
    fields: [
      {
        name: "voice",
        type: "Array<string>",
        description: "Tone of voice keywords",
        example: ["Professional", "Innovative", "Approachable"],
        eventKitUse: "AI content generation tone"
      },
      {
        name: "mission",
        type: "string | null",
        description: "Brand mission statement",
        example: "To empower businesses through innovative solutions",
        eventKitUse: "About sections, boilerplate text"
      },
      {
        name: "archetype",
        type: "string | null",
        description: "Brand archetype (e.g., Hero, Creator, Sage)",
        example: "The Innovator",
        eventKitUse: "Content style guidance"
      },
      {
        name: "values",
        type: "Array<ValueObject>",
        description: "Core brand values with descriptions",
        example: [{ id: "uuid", text: "Innovation", description: "Always pushing boundaries", icon: "lightbulb" }],
        eventKitUse: "Value propositions, culture content"
      },
      {
        name: "services",
        type: "Array<ServiceObject>",
        description: "Products/services offered",
        example: [{ id: "uuid", name: "Consulting", description: "Expert guidance", imageUrl: "..." }],
        eventKitUse: "Service pages, promotional materials"
      }
    ]
  },
  {
    title: "Photography Guidelines",
    icon: <Image className="h-5 w-5" />,
    description: "Image style direction for AI generation and curation",
    fields: [
      {
        name: "photography.approved",
        type: "Array<PhotoObject>",
        description: "Approved photography examples (do's)",
        example: [{ id: "uuid", url: "https://...", description: "Clean, modern office setting" }],
        eventKitUse: "AI image generation style reference"
      },
      {
        name: "photography.rejected",
        type: "Array<PhotoObject>",
        description: "Rejected photography examples (don'ts)",
        example: [{ id: "uuid", url: "https://...", description: "Avoid cluttered backgrounds" }],
        eventKitUse: "AI negative prompts, style constraints"
      },
      {
        name: "photography.allApprovedUrls",
        type: "Array<string>",
        description: "Quick access to all approved image URLs",
        example: ["https://storage.example.com/photo1.jpg", "https://storage.example.com/photo2.jpg"],
        eventKitUse: "Bulk image downloads"
      },
      {
        name: "photography.styleDirection",
        type: "string | null",
        description: "Summary of photography style counts",
        example: "5 approved styles, 3 rejected examples",
        eventKitUse: "Quick style overview"
      }
    ]
  },
  {
    title: "AI Constraints",
    icon: <Ban className="h-5 w-5" />,
    description: "Rules and restrictions for AI-generated content",
    fields: [
      {
        name: "constraints.brandMisuse",
        type: "Array<ConstraintObject>",
        description: "Brand misuse examples (what NOT to do)",
        example: [{ id: "uuid", description: "Never stretch the logo", exampleUrl: "..." }],
        eventKitUse: "AI generation guardrails"
      },
      {
        name: "constraints.colorCombinations",
        type: "Array<CombinationRule>",
        description: "Approved/forbidden color pairings",
        example: [{ primary: "#0066CC", accent: "#FF6600", allowed: true }],
        eventKitUse: "Palette validation"
      },
      {
        name: "constraints.rejectedPhotography",
        type: "Array<PhotoObject>",
        description: "Photography styles to avoid",
        example: [{ url: "...", description: "No dark, moody imagery" }],
        eventKitUse: "AI negative prompts"
      }
    ]
  },
  {
    title: "Social Media",
    icon: <Share2 className="h-5 w-5" />,
    description: "Social presence and generated content helpers",
    fields: [
      {
        name: "socialMedia.handles",
        type: "Array<HandleObject>",
        description: "Social media account information",
        example: [{ platform: "twitter", handle: "@brandname", url: "https://twitter.com/brandname", color: "#1DA1F2" }],
        eventKitUse: "Auto-populate social links"
      },
      {
        name: "socialMedia.hashtags",
        type: "Array<string>",
        description: "Auto-generated hashtags from brand values",
        example: ["#Innovation", "#Leadership", "#Growth"],
        eventKitUse: "Social post generation"
      },
      {
        name: "socialMedia.assets",
        type: "Array<SocialAssetObject>",
        description: "Platform-specific asset specifications",
        example: [{ platform: "instagram", postSize: "1080x1080", storySize: "1080x1920", profileIconUrl: "..." }],
        eventKitUse: "Correct sizing for each platform"
      }
    ]
  },
  {
    title: "Visual Assets",
    icon: <Sparkles className="h-5 w-5" />,
    description: "Patterns, gradients, icons, and brand symbols",
    fields: [
      {
        name: "brandIcons",
        type: "Array<IconObject>",
        description: "Brand-specific icons/symbols",
        example: [{ id: "uuid", name: "Spark", url: "...", isPrimary: true }],
        eventKitUse: "Decorative elements, accents"
      },
      {
        name: "patterns",
        type: "Array<PatternObject>",
        description: "Brand patterns for backgrounds",
        example: [{ id: "uuid", name: "Geometric Grid", url: "..." }],
        eventKitUse: "Background textures"
      },
      {
        name: "gradients",
        type: "Array<GradientObject>",
        description: "Brand gradient definitions",
        example: [{ id: "uuid", name: "Primary Fade", css: "linear-gradient(135deg, #0066CC, #00AAFF)" }],
        eventKitUse: "Background gradients, overlays"
      },
      {
        name: "iconography",
        type: "Array<IconStyle>",
        description: "Icon style preferences",
        example: ["outline", "rounded"],
        eventKitUse: "Consistent icon styling"
      },
      {
        name: "defaultIconColor",
        type: "string | null",
        description: "Default color for icons",
        example: "#0066CC",
        eventKitUse: "Icon colorization"
      }
    ]
  },
  {
    title: "Templates & Layouts",
    icon: <Layout className="h-5 w-5" />,
    description: "Pre-approved layouts and template specifications",
    fields: [
      {
        name: "templates",
        type: "Array<TemplateObject>",
        description: "Editable template references",
        example: [{ id: "uuid", name: "Presentation Deck", fileType: "pptx", thumbnailUrl: "...", externalUrl: "..." }],
        eventKitUse: "Starting point for designs"
      },
      {
        name: "templateSpecs",
        type: "Array<SpecObject>",
        description: "Detailed template specifications",
        example: [{ name: "Business Card", width: 3.5, height: 2, unit: "inches", bleed: 0.125 }],
        eventKitUse: "Print-ready asset generation"
      }
    ]
  },
  {
    title: "Collateral",
    icon: <FileText className="h-5 w-5" />,
    description: "Marketing materials and case studies",
    fields: [
      {
        name: "caseStudies",
        type: "Array<CaseStudyObject>",
        description: "Success stories and case studies",
        example: [{ id: "uuid", title: "Enterprise Success", description: "How we helped...", previewUrl: "..." }],
        eventKitUse: "Content examples, testimonials"
      },
      {
        name: "brochures",
        type: "Array<BrochureObject>",
        description: "Digital brochures and sales materials",
        example: [{ id: "uuid", title: "Product Overview", category: "sales", previewUrl: "...", thumbnailUrl: "..." }],
        eventKitUse: "Reference materials"
      },
      {
        name: "imageAssets",
        type: "Array<ImageAssetObject>",
        description: "General image asset library",
        example: [{ id: "uuid", name: "Hero Banner", url: "...", type: "banner" }],
        eventKitUse: "Ready-to-use imagery"
      }
    ]
  },
  {
    title: "Video Content",
    icon: <Video className="h-5 w-5" />,
    description: "Video assets and webinar recordings",
    fields: [
      {
        name: "videos",
        type: "Array<VideoObject>",
        description: "Brand videos and motion content",
        example: [{ id: "uuid", title: "Brand Story", url: "https://...", type: "brand", thumbnail: "..." }],
        eventKitUse: "Video embeds, thumbnails"
      },
      {
        name: "webinars",
        type: "Array<WebinarObject>",
        description: "Webinar recordings and materials",
        example: [{ id: "uuid", title: "Product Launch", thumbnailUrl: "...", recordingUrl: "...", status: "recorded" }],
        eventKitUse: "Event replays, content"
      }
    ]
  },
  {
    title: "Sponsor Logos",
    icon: <Target className="h-5 w-5" />,
    description: "Partner and sponsor logos organized by tier",
    fields: [
      {
        name: "sponsorLogos.byTier",
        type: "Object<Tier, Array<SponsorObject>>",
        description: "Sponsors grouped by tier (platinum, gold, silver, bronze, partner, media)",
        example: { platinum: [{ id: "uuid", name: "Acme Corp", url: "...", placement: "main stage" }] },
        eventKitUse: "Tiered sponsor placement"
      },
      {
        name: "sponsorLogos.all",
        type: "Array<SponsorObject>",
        description: "All sponsor logos with full metadata",
        example: [{ id: "uuid", name: "Acme Corp", url: "...", tier: "platinum", websiteUrl: "https://...", placement: "lanyards" }],
        eventKitUse: "Full sponsor inventory"
      },
      {
        name: "sponsorLogos.allLogoUrls",
        type: "Array<string>",
        description: "Quick access to all sponsor logo URLs",
        example: ["https://storage.example.com/sponsor1.png", "https://storage.example.com/sponsor2.png"],
        eventKitUse: "Bulk sponsor logo access"
      },
      {
        name: "sponsorLogos.totalCount",
        type: "number",
        description: "Total number of sponsors",
        example: "12",
        eventKitUse: "Sponsor count display"
      }
    ]
  },
  {
    title: "All Imagery",
    icon: <Globe className="h-5 w-5" />,
    description: "Consolidated inventory of all visual assets",
    fields: [
      {
        name: "allImagery.totalCount",
        type: "number",
        description: "Total count of all imagery URLs",
        example: "47",
        eventKitUse: "Asset library overview"
      },
      {
        name: "allImagery.byType",
        type: "Object<string, Array<string>>",
        description: "URLs grouped by asset type",
        example: { logos: ["url1", "url2"], photography: ["url3"], patterns: ["url4"] },
        eventKitUse: "Filtered asset access"
      },
      {
        name: "allImagery.all",
        type: "Array<ImageryObject>",
        description: "Complete list with metadata",
        example: [{ url: "...", type: "logo", name: "Primary Logo", description: "Main brand logo" }],
        eventKitUse: "Full asset inventory"
      }
    ]
  },
  {
    title: "Metadata",
    icon: <BookOpen className="h-5 w-5" />,
    description: "Additional brand context and settings",
    fields: [
      {
        name: "industry",
        type: "string | null",
        description: "Brand's industry vertical",
        example: "Technology",
        eventKitUse: "Industry-specific templates"
      },
      {
        name: "targetAudience",
        type: "string | null",
        description: "Primary target audience description",
        example: "Enterprise decision-makers",
        eventKitUse: "Content personalization"
      },
      {
        name: "heroSettings",
        type: "Object",
        description: "Hero section configuration",
        example: { coverImage: "...", coverVideo: "...", useVideo: false, kenBurnsEffect: true },
        eventKitUse: "Hero section styling"
      },
      {
        name: "guide_data",
        type: "Object",
        description: "Complete raw guide data for full import",
        example: "{ ... full guide_data object ... }",
        eventKitUse: "Complete data sync"
      }
    ]
  }
];

const CodeBlock = ({ children }: { children: string | object }) => {
  const content = typeof children === 'object' ? JSON.stringify(children, null, 2) : children;
  return (
    <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-x-auto font-mono">
      <code>{content}</code>
    </pre>
  );
};

const FieldCard = ({ field }: { field: FieldDoc }) => (
  <div className="border rounded-lg p-4 space-y-3 bg-card hover:shadow-sm transition-shadow">
    <div className="flex items-start justify-between gap-2">
      <code className="text-sm font-semibold text-primary">{field.name}</code>
      <Badge variant="outline" className="text-xs shrink-0">{field.type}</Badge>
    </div>
    <p className="text-sm text-muted-foreground">{field.description}</p>
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Example:</p>
      <CodeBlock>{field.example}</CodeBlock>
    </div>
    {field.eventKitUse && (
      <div className="flex items-center gap-2 pt-2 border-t">
        <Badge variant="secondary" className="text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          EventKIT Use
        </Badge>
        <span className="text-xs text-muted-foreground">{field.eventKitUse}</span>
      </div>
    )}
  </div>
);

export default function BrandExportSchema() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Brand Export Schema</h1>
              <p className="text-muted-foreground">API documentation for EventKIT integration</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-6">
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <Hash className="h-3 w-3 mr-1" />
              REST API
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
              <Globe className="h-3 w-3 mr-1" />
              Public Endpoint
            </Badge>
            <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
              <MessageSquare className="h-3 w-3 mr-1" />
              JSON Response
            </Badge>
          </div>
        </div>
      </div>

      {/* Endpoint Info */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-green-600">POST</Badge>
              <code className="text-sm bg-muted px-3 py-1.5 rounded-md font-mono">
                /functions/v1/get-shared-brand
              </code>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Request Body:</p>
              <CodeBlock>{`{
  "shareToken": "your-brand-share-token"
}`}</CodeBlock>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Response Structure:</p>
              <CodeBlock>{`{
  "brand": {
    // All fields documented below
  }
}`}</CodeBlock>
            </div>
          </CardContent>
        </Card>

        {/* Schema Sections */}
        <Tabs defaultValue="core-branding" className="space-y-6">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-full justify-start gap-1 p-1 h-auto flex-wrap">
              {schemaSections.map((section) => (
                <TabsTrigger 
                  key={section.title.toLowerCase().replace(/\s/g, '-')}
                  value={section.title.toLowerCase().replace(/\s/g, '-')}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  {section.icon}
                  <span className="hidden sm:inline">{section.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          {schemaSections.map((section) => (
            <TabsContent 
              key={section.title.toLowerCase().replace(/\s/g, '-')}
              value={section.title.toLowerCase().replace(/\s/g, '-')}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {section.icon}
                    </div>
                    <div>
                      <CardTitle>{section.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {section.fields.map((field) => (
                      <FieldCard key={field.name} field={field} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Reference */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Quick Reference: All Image Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { type: "logos", desc: "All logo variants" },
                { type: "brandIcons", desc: "Brand symbols/icons" },
                { type: "patterns", desc: "Background patterns" },
                { type: "photography", desc: "Approved photos" },
                { type: "heroImages", desc: "Hero/cover images" },
                { type: "collateral", desc: "Case studies, brochures, templates" },
                { type: "social", desc: "Social media assets" },
                { type: "banners", desc: "Display ad banners" },
                { type: "video", desc: "Video thumbnails" },
                { type: "sponsors", desc: "Sponsor/partner logos" }
              ].map((cat) => (
                <div key={cat.type} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Badge variant="outline" className="font-mono text-xs">{cat.type}</Badge>
                  <span className="text-sm text-muted-foreground">{cat.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

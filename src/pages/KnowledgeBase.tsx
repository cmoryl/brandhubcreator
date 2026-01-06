import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, HelpCircle, Lightbulb, Search, CreditCard, Plug, Users, Globe, Shield, Play, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Import tutorial videos
import tutorialGettingStarted from "@/assets/videos/tutorial-getting-started.mp4";
import tutorialColorSystems from "@/assets/videos/tutorial-color-systems.mp4";
import tutorialTypography from "@/assets/videos/tutorial-typography.mp4";
import tutorialLogoAssets from "@/assets/videos/tutorial-logo-assets.mp4";
import tutorialSharing from "@/assets/videos/tutorial-sharing.mp4";
import tutorialExportPdf from "@/assets/videos/tutorial-export-pdf.mp4";

const tutorials = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of creating your first brand guide in under 5 minutes.",
    duration: "0:05",
    video: tutorialGettingStarted,
  },
  {
    id: "color-systems",
    title: "Color Systems Deep Dive",
    description: "Master color palettes, A/B testing, and organizing your brand colors.",
    duration: "0:05",
    video: tutorialColorSystems,
  },
  {
    id: "typography",
    title: "Typography Guidelines",
    description: "Set up fonts, text styles, and usage rules for consistent typography.",
    duration: "0:05",
    video: tutorialTypography,
  },
  {
    id: "logo-assets",
    title: "Logo Usage & Assets",
    description: "Upload logos, define clear space rules, and document brand assets.",
    duration: "0:05",
    video: tutorialLogoAssets,
  },
  {
    id: "sharing",
    title: "Sharing & Collaboration",
    description: "Share brand guides with your team and manage access permissions.",
    duration: "0:05",
    video: tutorialSharing,
  },
  {
    id: "export-pdf",
    title: "Exporting to PDF",
    description: "Generate professional PDF exports of your complete brand guidelines.",
    duration: "0:05",
    video: tutorialExportPdf,
  },
];

const faqs = [
  {
    category: "Getting Started",
    icon: Lightbulb,
    questions: [
      {
        q: "What is BrandForge?",
        a: "BrandForge is a comprehensive brand guide creation platform that helps you build, manage, and share professional brand guidelines. Create stunning brand books with colors, typography, logos, and more."
      },
      {
        q: "How do I create my first brand guide?",
        a: "Sign in to your account, click 'New Brand' on the dashboard, and start customizing your brand identity. You can add colors, typography, logos, values, and much more to create a complete brand guide."
      },
      {
        q: "Can I share my brand guide publicly?",
        a: "Yes! All brand guides are publicly viewable by default. Share the link with your team, clients, or stakeholders so they can access your brand guidelines anytime."
      }
    ]
  },
  {
    category: "Brand Elements",
    icon: BookOpen,
    questions: [
      {
        q: "What sections can I include in my brand guide?",
        a: "BrandForge supports many sections including: Hero/Cover, Identity & Mission, Color Palette, Typography, Logo Usage, Imagery Guidelines, Patterns, Gradients, Icons, Social Media, Templates, and more."
      },
      {
        q: "How do I add custom colors to my palette?",
        a: "In the Color Palette section, click 'Add Color' to input hex codes, RGB values, or use the color picker. You can organize colors into groups like Primary, Secondary, and Accent."
      },
      {
        q: "Can I upload my own logos and assets?",
        a: "Yes, you can upload logos, icons, patterns, and other brand assets directly to your brand guide. Supported formats include PNG, SVG, JPG, and more."
      },
      {
        q: "How do I reorder sections in my brand guide?",
        a: "In edit mode, use the sidebar to drag and drop sections into your preferred order. You can also hide sections you don't need."
      }
    ]
  },
  {
    category: "Products & Sub-brands",
    icon: HelpCircle,
    questions: [
      {
        q: "What are product guides?",
        a: "Product guides are sub-brand guidelines that inherit from a parent brand. They're perfect for product lines, campaigns, or variations that need their own identity while staying connected to the main brand."
      },
      {
        q: "How do I link a product to a parent brand?",
        a: "When creating a new product, select the parent brand from the dropdown. The product will then be associated with that brand and appear in its product list."
      },
      {
        q: "Can products have different colors than the parent brand?",
        a: "Yes! Products can have their own unique color palettes, typography, and other elements while still being linked to the parent brand for organizational purposes."
      }
    ]
  },
  {
    category: "Sharing & Export",
    icon: Globe,
    questions: [
      {
        q: "How do I share my brand guide?",
        a: "Simply copy the URL of your brand guide and share it. Anyone with the link can view your brand guidelines without needing an account."
      },
      {
        q: "Can I export my brand guide as a PDF?",
        a: "Yes, use the Export PDF button in your brand guide to generate a downloadable PDF version of your complete brand guidelines."
      },
      {
        q: "Is there a way to password-protect my brand guide?",
        a: "Currently, all brand guides are publicly viewable. For private brand guides, we recommend sharing only with trusted parties. Enhanced privacy features are coming soon."
      }
    ]
  },
  {
    category: "Pricing & Plans",
    icon: CreditCard,
    questions: [
      {
        q: "Is BrandForge free to use?",
        a: "BrandForge offers a free tier with essential features. You can create and share brand guides at no cost. Premium features and advanced capabilities are available on paid plans."
      },
      {
        q: "What's included in the free plan?",
        a: "The free plan includes the ability to create brand guides, add colors, typography, logos, and share publicly. You get access to all core sections and basic export options."
      },
      {
        q: "How do I upgrade my account?",
        a: "Navigate to your account settings and select the plan that fits your needs. Upgrades are instant and you'll immediately get access to premium features."
      },
      {
        q: "Can I cancel my subscription anytime?",
        a: "Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period."
      },
      {
        q: "Do you offer discounts for students or nonprofits?",
        a: "Yes! We offer special pricing for students, educators, and nonprofit organizations. Contact our support team with verification to get your discount applied."
      }
    ]
  },
  {
    category: "Team Collaboration",
    icon: Users,
    questions: [
      {
        q: "Can I invite team members to collaborate?",
        a: "Yes! You can invite team members to your workspace. They'll be able to view and edit brand guides based on their assigned permissions."
      },
      {
        q: "What permission levels are available?",
        a: "We offer multiple permission levels: Viewer (view only), Editor (can edit guides), Admin (can manage settings and collaborators), and Owner (full control including deletion)."
      },
      {
        q: "How many team members can I add?",
        a: "The number of team members depends on your plan. Free plans support individual use, while paid plans offer unlimited team members."
      },
      {
        q: "Can different team members work on the same brand guide?",
        a: "Yes, multiple team members can collaborate on the same brand guide. Changes are saved in real-time so everyone stays in sync."
      },
      {
        q: "How do I remove a team member?",
        a: "Go to your workspace settings, find the People section, and remove the team member. They will immediately lose access to all shared brand guides."
      }
    ]
  },
  {
    category: "Integrations",
    icon: Plug,
    questions: [
      {
        q: "Does BrandForge integrate with design tools?",
        a: "We're actively working on integrations with popular design tools like Figma, Sketch, and Adobe Creative Cloud. Stay tuned for updates!"
      },
      {
        q: "Can I embed my brand guide on my website?",
        a: "Yes, you can embed your brand guide using an iframe or link directly to specific sections. This is great for internal wikis and documentation sites."
      },
      {
        q: "Is there an API available?",
        a: "API access is available on enterprise plans. Contact our sales team to learn more about programmatic access to your brand data."
      },
      {
        q: "Can I import brand assets from other tools?",
        a: "You can upload assets directly from your computer. We support common formats like PNG, SVG, JPG, PDF, and font files."
      }
    ]
  },
  {
    category: "Security & Privacy",
    icon: Shield,
    questions: [
      {
        q: "Is my brand data secure?",
        a: "Yes, we take security seriously. All data is encrypted in transit and at rest. We use industry-standard security practices to protect your brand assets."
      },
      {
        q: "Who can see my brand guides?",
        a: "Brand guides are publicly viewable by default via their unique URL. Only people with the link can access them. Private brand guides with access controls are coming soon."
      },
      {
        q: "Can I delete my account and data?",
        a: "Yes, you can delete your account at any time from your account settings. This will permanently remove all your brand guides and associated data."
      },
      {
        q: "Where is my data stored?",
        a: "Your data is stored on secure cloud servers with automatic backups. We use trusted infrastructure providers to ensure reliability and performance."
      }
    ]
  }
];

const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<typeof tutorials[0] | null>(null);
  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6 text-center border-b border-border/30">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="p-3 bg-accent/10 rounded-2xl w-fit mx-auto">
            <HelpCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions and learn how to make the most of BrandForge.
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto mt-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Video Tutorials Section */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="p-3 bg-accent/10 rounded-xl w-fit mx-auto mb-4">
              <Video className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Video Tutorials</h2>
            <p className="text-muted-foreground">
              Watch step-by-step guides to master BrandForge quickly.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tutorials.map((tutorial) => (
              <Card 
                key={tutorial.id}
                className="overflow-hidden border-border/50 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setSelectedVideo(tutorial)}
              >
                <div className="aspect-video bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center relative overflow-hidden">
                  <video 
                    src={tutorial.video} 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="relative w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-accent-foreground ml-1" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">{tutorial.title}</h3>
                  <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{tutorial.duration}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No results found for "{searchQuery}"</p>
              <Button 
                variant="link" 
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                Clear search
              </Button>
            </div>
          ) : (
            filteredFaqs.map((category) => (
              <div key={category.category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <category.icon className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-semibold text-foreground">{category.category}</h2>
                </div>
                
                <Accordion type="single" collapsible className="space-y-2">
                  {category.questions.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`${category.category}-${index}`}
                      className="border border-border/50 rounded-lg px-4 bg-card/50"
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-medium text-foreground">{faq.q}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 px-6 border-t border-border/30">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Still have questions?</h2>
          <p className="text-muted-foreground">
            Can't find what you're looking for? We're here to help.
          </p>
          <Button variant="outline" asChild>
            <a href="mailto:support@brandforge.com">Contact Support</a>
          </Button>
        </div>
      </section>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black">
            {selectedVideo && (
              <video
                src={selectedVideo.video}
                className="w-full h-full"
                controls
                autoPlay
              />
            )}
          </div>
          <div className="p-4 pt-2">
            <p className="text-sm text-muted-foreground">{selectedVideo?.description}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBase;

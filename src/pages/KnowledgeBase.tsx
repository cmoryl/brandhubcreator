import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, HelpCircle, Lightbulb, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    icon: BookOpen,
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
  }
];

const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState("");

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
    </div>
  );
};

export default KnowledgeBase;

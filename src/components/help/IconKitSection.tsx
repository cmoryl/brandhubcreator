import { useState } from "react";
import { Palette, ChevronRight, Play, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { iconKitFaqs, iconKitQuickStart } from "@/data/iconKitHelp";
import { IconKitGuides } from "./IconKitGuides";

interface IconKitSectionProps {
  searchQuery?: string;
}

export const IconKitSection = ({ searchQuery = "" }: IconKitSectionProps) => {
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [activeTab, setActiveTab] = useState<"guides" | "faq">("guides");

  // Filter FAQs based on search
  const filteredFaqs = iconKitFaqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  if (searchQuery && filteredFaqs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* IconKIT Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl">
          <Palette className="h-6 w-6 text-violet-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">IconKIT</h2>
          <p className="text-sm text-muted-foreground">
            Complete guide to the Icon Studio and iconography system
          </p>
        </div>
      </div>

      {/* Architecture Diagram Toggle */}
      {!searchQuery && (
        <Collapsible open={showArchitecture} onOpenChange={setShowArchitecture}>
          <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 h-auto hover:bg-violet-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/20 rounded-lg">
                    <ExternalLink className="h-4 w-4 text-violet-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">System Architecture</p>
                    <p className="text-sm text-muted-foreground">
                      View how all icon components and hooks connect
                    </p>
                  </div>
                </div>
                <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${showArchitecture ? 'rotate-90' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0">
                <div className="bg-background/80 rounded-xl p-6 border border-border/50">
                  <IconArchitectureDiagram />
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Quick Start Guide */}
      {!searchQuery && (
        <Card className="border-border/50 p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Play className="h-5 w-5 text-accent" />
            Quick Start
          </h3>
          <div className="grid gap-3">
            {iconKitQuickStart.map((step) => (
              <div 
                key={step.step}
                className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-accent">{step.step}</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs: Guides vs FAQ */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "guides" | "faq")}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="guides">Step-by-Step Guides</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-4">
          <IconKitGuides searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          {/* FAQ Categories */}
          {filteredFaqs.map((category) => (
            <div key={category.category} className="space-y-4">
              <div className="flex items-center gap-2">
                <category.icon className="h-5 w-5 text-violet-500" />
                <h3 className="text-xl font-semibold text-foreground">{category.category}</h3>
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
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Visual Architecture Diagram Component
 * Displays the icon system architecture in a visual format
 */
const IconArchitectureDiagram = () => {
  return (
    <div className="space-y-6">
      {/* Entry Point */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 rounded-full border border-violet-500/30">
          <Palette className="h-4 w-4 text-violet-500" />
          <span className="font-semibold text-violet-500">Icon Studio (7 Tabs)</span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="grid grid-cols-7 gap-2">
        {[
          { name: "Library", icon: "📚" },
          { name: "AI Gen", icon: "🤖" },
          { name: "Stylizer", icon: "✨" },
          { name: "Advanced", icon: "⚡" },
          { name: "Hierarchy", icon: "🌳" },
          { name: "App Icons", icon: "📱" },
          { name: "Creator", icon: "✏️" },
        ].map((tab) => (
          <div 
            key={tab.name}
            className="text-center p-2 bg-muted/50 rounded-lg border border-border/50"
          >
            <div className="text-lg mb-1">{tab.icon}</div>
            <div className="text-xs font-medium text-muted-foreground">{tab.name}</div>
          </div>
        ))}
      </div>

      {/* Connection Lines */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-border" />
      </div>

      {/* Core Hooks */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
        <h4 className="text-sm font-semibold text-foreground mb-3 text-center">🔧 Core Hooks</h4>
        <div className="grid grid-cols-4 gap-2">
          {[
            "useIconLibraries",
            "useIconOptimizer", 
            "useStylizer",
            "useResponsiveIcon",
            "useIconStateSystem",
            "useKineticBranding",
            "useIconHierarchy",
            "useBatchProcessor",
          ].map((hook) => (
            <div 
              key={hook}
              className="text-center p-2 bg-background rounded-lg border border-border/50"
            >
              <code className="text-xs text-accent">{hook}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Lines */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-border" />
      </div>

      {/* Feature Modules */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
        <h4 className="text-sm font-semibold text-foreground mb-3 text-center">✨ Feature Modules</h4>
        <div className="grid grid-cols-4 gap-2">
          {[
            "Brand DNA Lock",
            "Style Overrides",
            "Event Overlays",
            "Color Mapping",
            "Optical Sizing",
            "Semantic States",
            "Kinetic Animations",
            "Batch Processing",
          ].map((feature) => (
            <div 
              key={feature}
              className="text-center p-2 bg-background rounded-lg border border-border/50"
            >
              <span className="text-xs text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Lines */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-border" />
      </div>

      {/* Outputs */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
        <h4 className="text-sm font-semibold text-foreground mb-3 text-center">📦 Outputs</h4>
        <div className="flex justify-center gap-4 flex-wrap">
          {[
            { name: "SVGs", icon: "🎨" },
            { name: "PNGs", icon: "🖼️" },
            { name: "App Bundles", icon: "📱" },
            { name: "Brand PDF", icon: "📄" },
            { name: "CSS Vars", icon: "💅" },
          ].map((output) => (
            <div 
              key={output.name}
              className="text-center p-3 bg-background rounded-lg border border-border/50"
            >
              <div className="text-lg mb-1">{output.icon}</div>
              <span className="text-xs font-medium text-muted-foreground">{output.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IconKitSection;

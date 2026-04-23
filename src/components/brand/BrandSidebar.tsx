import { 
  Shield, Scroll, Heart, Image, Bookmark, Palette, Blend, Grid3X3, 
  Type, Code, Layers, Share2, Camera, Users, Mail, QrCode, Globe,
  FolderArchive, Ban, FileText, BookOpen, FileType, Video, Quote, Package, Briefcase, LayoutGrid, TrendingUp,
  Hash, Award, Lightbulb, MapPin, Presentation, ImagePlus, Eye, Sparkles, Calendar, Signpost
} from 'lucide-react';
import { SectionId } from '@/types/brand';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BrandSidebarProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  brandName: string;
}

const sections: { id: SectionId; label: string; icon: React.ElementType; category: string }[] = [
  { id: 'hero', label: 'Identity Shield', icon: Shield, category: 'Identity' },
  { id: 'tagline', label: 'Corporate Tagline', icon: Quote, category: 'Identity' },
  { id: 'identity', label: 'Narrative Architecture', icon: Scroll, category: 'Identity' },
  { id: 'values', label: 'Philosophical Pillars', icon: Heart, category: 'Identity' },
  { id: 'bythenumbers', label: 'By The Numbers', icon: Hash, category: 'Identity' },
  { id: 'services', label: 'Our Services', icon: Briefcase, category: 'Identity' },
  { id: 'revenue', label: 'Revenue Growth', icon: TrendingUp, category: 'Identity' },
  { id: 'awards', label: 'Awards & Recognition', icon: Award, category: 'Identity' },
  { id: 'insights', label: 'Insights & Updates', icon: Lightbulb, category: 'Identity' },
  { id: 'locations', label: 'Locations', icon: MapPin, category: 'Identity' },
  { id: 'webinars', label: 'Webinars', icon: Presentation, category: 'Identity' },
  { id: 'logos', label: 'Logos', icon: Image, category: 'Visual' },
  { id: 'brandicon', label: 'Symbol Standards', icon: Bookmark, category: 'Visual' },
  { id: 'colors', label: 'Color Palette', icon: Palette, category: 'Visual' },
  { id: 'gradients', label: 'Gradients', icon: Blend, category: 'Visual' },
  { id: 'patterns', label: 'Geometric Primitives', icon: Grid3X3, category: 'Visual' },
  { id: 'layouttemplates', label: 'Layout Templates', icon: LayoutGrid, category: 'Visual' },
  { id: 'typography', label: 'Type Registry', icon: Type, category: 'Typography' },
  { id: 'textstyles', label: 'CSS Hierarchies', icon: Code, category: 'Typography' },
  { id: 'iconography', label: 'Iconography', icon: Layers, category: 'Assets' },
  { id: 'socialicons', label: 'Platform Markers', icon: Share2, category: 'Assets' },
  { id: 'imagery', label: 'Visual Direction', icon: Camera, category: 'Assets' },
  { id: 'imageassets', label: 'Image Assets', icon: ImagePlus, category: 'Assets' },
  { id: 'social', label: 'Social Registry', icon: Users, category: 'Communication' },
  { id: 'socialassets', label: 'Social Assets & Guidelines', icon: LayoutGrid, category: 'Communication' },
  { id: 'socialmetrics', label: 'Social Metrics', icon: Eye, category: 'Communication' },
  { id: 'website', label: 'Website', icon: Globe, category: 'Communication' },
  { id: 'signatures', label: 'Signature Protocol', icon: Mail, category: 'Communication' },
  { id: 'qr', label: 'QR Codes', icon: QrCode, category: 'Communication' },
  { id: 'videos', label: 'Video Resources', icon: Video, category: 'Resources' },
  { id: 'assets', label: 'Operational Vault', icon: FolderArchive, category: 'Resources' },
  { id: 'misuse', label: 'Anti-Patterns', icon: Ban, category: 'Resources' },
  { id: 'brochures', label: 'Digital Collateral', icon: BookOpen, category: 'Collateral' },
  { id: 'templatespecs', label: 'Template Specs', icon: FileText, category: 'Collateral' },
  { id: 'presentations', label: 'Presentation Templates', icon: FileType, category: 'Collateral' },
  { id: 'sponsorlogos', label: 'Sponsor Logos', icon: Sparkles, category: 'Collateral' },
  { id: 'clientlogos', label: 'Client Logos', icon: Sparkles, category: 'Collateral' },
  { id: 'universe', label: 'Universe', icon: Globe, category: 'Ecosystem' },
  { id: 'products', label: 'Products', icon: Package, category: 'Ecosystem' },
  { id: 'events', label: 'Events', icon: Calendar, category: 'Ecosystem' },
  { id: 'eventsignage', label: 'Event Signage', icon: Signpost, category: 'Ecosystem' },
];

const categories = ['Identity', 'Visual', 'Typography', 'Assets', 'Communication', 'Resources', 'Collateral', 'Ecosystem'];

export const BrandSidebar = ({ activeSection, onSectionChange, brandName }: BrandSidebarProps) => {
  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Brand header */}
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="font-semibold text-sidebar-foreground truncate">{brandName || 'Brand Guide'}</h2>
        <p className="text-xs text-sidebar-foreground/60 mt-1">{sections.length} Sections</p>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2">
          {categories.map(category => {
            const categorySections = sections.filter(s => s.category === category);
            return (
              <div key={category} className="mb-4">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 px-3 mb-1">
                  {category}
                </h3>
                <div className="space-y-0.5">
                  {categorySections.map(section => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => onSectionChange(section.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
};

import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  Home, 
  Building2, 
  Palette, 
  Package, 
  Calendar, 
  Shield, 
  Info, 
  Mail, 
  HelpCircle, 
  BookOpen, 
  FileText, 
  Sparkles, 
  Map,
  ExternalLink,
  Lock
} from 'lucide-react';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

interface SitemapSection {
  title: string;
  icon: React.ElementType;
  links: {
    name: string;
    path: string;
    description: string;
    requiresAuth?: boolean;
  }[];
}

const sitemapData: SitemapSection[] = [
  {
    title: 'Main Pages',
    icon: Home,
    links: [
      { name: 'Home', path: '/', description: 'Landing page and platform overview' },
      { name: 'About', path: '/about', description: 'Learn about BrandHub and our mission' },
      { name: 'Contact Us', path: '/contact', description: 'Get in touch with our team' },
    ],
  },
  {
    title: 'Authentication',
    icon: Lock,
    links: [
      { name: 'Sign In', path: '/auth', description: 'Sign in to your account' },
      { name: 'Pending Approval', path: '/pending-approval', description: 'Account approval status' },
      { name: 'Onboarding', path: '/onboarding', description: 'New user onboarding flow', requiresAuth: true },
    ],
  },
  {
    title: 'Dashboard & Management',
    icon: Building2,
    links: [
      { name: 'Dashboard', path: '/dashboard', description: 'Brand management dashboard', requiresAuth: true },
      { name: 'Admin Panel', path: '/admin', description: 'Platform administration', requiresAuth: true },
    ],
  },
  {
    title: 'Brand Guides',
    icon: Palette,
    links: [
      { name: 'Brand Editor', path: '/brand/:brandSlug', description: 'Edit and manage brand guides' },
      { name: 'Product Editor', path: '/product/:productSlug', description: 'Edit and manage product guides' },
      { name: 'Event Editor', path: '/event/:eventSlug', description: 'Edit and manage event guides' },
    ],
  },
  {
    title: 'Organization',
    icon: Building2,
    links: [
      { name: 'Organization Portal', path: '/org/:slug', description: 'Organization brand portal' },
      { name: 'Organization Settings', path: '/org/settings', description: 'Manage organization settings', requiresAuth: true },
    ],
  },
  {
    title: 'Demo & Showcase',
    icon: Sparkles,
    links: [
      { name: 'Demo Guides', path: '/demo/:brandSlug', description: 'Preview demo brand guides' },
      { name: 'Hero Effects Showcase', path: '/hero-effects', description: 'Browse hero section effects' },
      { name: 'GlobalLink Universe', path: '/product/globallink/universe', description: 'GlobalLink product universe' },
    ],
  },
  {
    title: 'Resources',
    icon: BookOpen,
    links: [
      { name: 'Help Center', path: '/help', description: 'Get help and support' },
      { name: 'Knowledge Base', path: '/knowledge', description: 'Documentation and guides' },
    ],
  },
  {
    title: 'Documentation',
    icon: FileText,
    links: [
      { name: 'Brand Export Schema', path: '/docs/brand-export-schema', description: 'API documentation for brand exports' },
    ],
  },
];

const Sitemap = () => {
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={resolvedTheme === 'light' ? tpLogoColor : tpLogoWhite} 
              alt="TransPerfect" 
              className="h-8 w-auto"
            />
            <span className="font-semibold text-xl text-foreground">BrandHub</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-2xl mb-4">
            <Map className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Sitemap</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete overview of all pages and sections available on BrandHub.
          </p>
        </div>

        {/* Sitemap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sitemapData.map((section) => {
            const Icon = section.icon;
            return (
              <div 
                key={section.title}
                className="bg-card border border-border rounded-xl p-6 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.path}>
                      <Link 
                        to={link.path.includes(':') ? '#' : link.path}
                        className={`group block ${link.path.includes(':') ? 'cursor-default' : ''}`}
                        onClick={(e) => {
                          if (link.path.includes(':')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-sm font-medium ${link.path.includes(':') ? 'text-muted-foreground' : 'text-foreground group-hover:text-accent'} transition-colors`}>
                            {link.name}
                          </span>
                          {link.requiresAuth && (
                            <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          {!link.path.includes(':') && (
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {link.description}
                        </p>
                        {link.path.includes(':') && (
                          <code className="text-[10px] text-muted-foreground/70 font-mono mt-1 block">
                            {link.path}
                          </code>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            <Lock className="h-3 w-3 inline-block mr-1" />
            indicates pages that require authentication
          </p>
          <p className="mt-2">
            Dynamic routes (with <code className="text-xs bg-muted px-1 py-0.5 rounded">:param</code>) require specific identifiers
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} TransPerfect BrandHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Sitemap;

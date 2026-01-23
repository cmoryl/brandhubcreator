import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home, Building2, Package, FileText, Shield, HelpCircle, Settings, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbConfig {
  label: string;
  icon?: React.ElementType;
  href?: string;
}

interface AppBreadcrumbsProps {
  /** Custom breadcrumb items to override automatic detection */
  items?: BreadcrumbConfig[];
  /** Current page name (last item, not a link) */
  currentPage?: string;
  /** Current page icon */
  currentIcon?: React.ElementType;
  /** Additional class names */
  className?: string;
  /** Whether to show the home link */
  showHome?: boolean;
}

// Route patterns to breadcrumb mappings
const ROUTE_MAPPINGS: Record<string, BreadcrumbConfig> = {
  '/': { label: 'Home', icon: Home },
  '/auth': { label: 'Sign In', icon: Users },
  '/admin': { label: 'Admin Dashboard', icon: Shield },
  '/knowledge': { label: 'Knowledge Base', icon: HelpCircle },
  '/contact': { label: 'Contact Us', icon: Users },
  '/onboarding': { label: 'Onboarding', icon: Settings },
  '/pending-approval': { label: 'Pending Approval', icon: Users },
};

export function AppBreadcrumbs({ 
  items, 
  currentPage, 
  currentIcon: CurrentIcon, 
  className,
  showHome = true 
}: AppBreadcrumbsProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Build breadcrumb items from path if not provided
  const breadcrumbItems: BreadcrumbConfig[] = items || [];

  // Auto-generate breadcrumbs from route if items not provided
  if (!items && pathSegments.length > 0) {
    // Check for known routes first
    const fullPath = `/${pathSegments.join('/')}`;
    if (ROUTE_MAPPINGS[fullPath]) {
      breadcrumbItems.push(ROUTE_MAPPINGS[fullPath]);
    } else {
      // Build path-based breadcrumbs
      let currentPath = '';
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === pathSegments.length - 1;
        
        // Special handling for known route patterns
        if (segment === 'org' && pathSegments[index + 1]) {
          breadcrumbItems.push({
            label: 'Organizations',
            icon: Building2,
            href: '/',
          });
        } else if (segment === 'brand' && pathSegments[index + 1]) {
          breadcrumbItems.push({
            label: 'Brand Guides',
            icon: FileText,
            href: '/',
          });
        } else if (segment === 'product' && pathSegments[index + 1]) {
          breadcrumbItems.push({
            label: 'Product Guides',
            icon: Package,
            href: '/',
          });
        } else if (segment === 'demo') {
          breadcrumbItems.push({
            label: 'Demo Guides',
            icon: Star,
            href: '/',
          });
        } else if (segment === 'settings') {
          // Skip, will be handled by currentPage
        } else if (!['org', 'brand', 'product'].includes(pathSegments[index - 1] || '')) {
          // Don't add if previous segment was a route prefix
          if (!isLast) {
            breadcrumbItems.push({
              label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
              href: currentPath,
            });
          }
        }
      });
    }
  }

  // If we only have the current page and no intermediate items, just show home + current
  const hasIntermediateItems = breadcrumbItems.length > 0;

  return (
    <Breadcrumb className={cn('mb-4', className)}>
      <BreadcrumbList className="flex-wrap">
        {/* Home link */}
        {showHome && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link 
                  to="/" 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {(hasIntermediateItems || currentPage) && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
          </>
        )}

        {/* Intermediate breadcrumb items */}
        {breadcrumbItems.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === breadcrumbItems.length - 1 && !currentPage;
          
          return (
            <BreadcrumbItem key={index}>
              {isLast ? (
                <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="truncate max-w-[200px]">{item.label}</span>
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <Link 
                      to={item.href || '/'} 
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="truncate max-w-[150px]">{item.label}</span>
                    </Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                </>
              )}
            </BreadcrumbItem>
          );
        })}

        {/* Current page (final item, not a link) */}
        {currentPage && (
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1.5 font-medium text-foreground">
              {CurrentIcon && <CurrentIcon className="h-4 w-4" />}
              <span className="truncate max-w-[200px] sm:max-w-[300px]">{currentPage}</span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

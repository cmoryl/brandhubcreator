import * as React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
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
  /** Override the home link destination (defaults to /) */
  homeHref?: string;
}

// Route patterns to breadcrumb mappings
const ROUTE_MAPPINGS: Record<string, BreadcrumbConfig> = {
  '/': { label: 'Home', icon: Home },
  '/auth': { label: 'Sign In', icon: Users },
  '/admin': { label: 'Admin Dashboard', icon: Shield },
  '/knowledge': { label: 'Knowledge Base', icon: HelpCircle },
  '/help': { label: 'Help Center', icon: HelpCircle },
  '/contact': { label: 'Contact Us', icon: Users },
  '/onboarding': { label: 'Onboarding', icon: Settings },
  '/pending-approval': { label: 'Pending Approval', icon: Users },
};

export const AppBreadcrumbs = React.forwardRef<
  HTMLElement,
  AppBreadcrumbsProps
>(({ 
  items, 
  currentPage, 
  currentIcon: CurrentIcon, 
  className,
  showHome = true,
  homeHref = '/',
}, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Programmatic navigation handler — guarantees React Router processes the
  // route change even if a parent component is intercepting Link clicks.
  const handleNav = React.useCallback(
    (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Allow modifier-clicks (open in new tab) to work normally
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      if (href !== location.pathname) {
        navigate(href);
      }
    },
    [navigate, location.pathname],
  );

  // Build breadcrumb items from path if not provided
  const breadcrumbItems: BreadcrumbConfig[] = items || [];

  // Auto-generate breadcrumbs from route if items not provided
  if (!items && pathSegments.length > 0) {
    // Check for known routes first
    const fullPath = `/${pathSegments.join('/')}`;
    if (ROUTE_MAPPINGS[fullPath]) {
      breadcrumbItems.push(ROUTE_MAPPINGS[fullPath]);
    } else {
      // Detect if we're in an org-nested route (e.g., /org/:orgSlug/brand/:brandSlug)
      const orgIndex = pathSegments.indexOf('org');
      const hasOrgContext = orgIndex !== -1 && pathSegments[orgIndex + 1];
      const orgSlug = hasOrgContext ? pathSegments[orgIndex + 1] : null;
      const orgPath = orgSlug ? `/org/${orgSlug}` : null;
      
      // Build path-based breadcrumbs
      let currentPath = '';
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === pathSegments.length - 1;
        
        // Special handling for known route patterns
        if (segment === 'org' && pathSegments[index + 1]) {
          // Add the organization as a breadcrumb link back to the portal
          const orgName = pathSegments[index + 1];
          breadcrumbItems.push({
            label: orgName.charAt(0).toUpperCase() + orgName.slice(1).replace(/-/g, ' '),
            icon: Building2,
            href: `/org/${orgName}`,
          });
        } else if (segment === 'brand' && pathSegments[index + 1]) {
          // Skip - the brand name will be handled as currentPage or via items prop
        } else if (segment === 'product' && pathSegments[index + 1]) {
          // Skip - the product name will be handled as currentPage or via items prop
        } else if (segment === 'event' && pathSegments[index + 1]) {
          // Skip - the event name will be handled as currentPage or via items prop
        } else if (segment === 'demo') {
          breadcrumbItems.push({
            label: 'Demo Guides',
            icon: Star,
            href: '/',
          });
        } else if (segment === 'settings') {
          // Skip, will be handled by currentPage
        } else if (!['org', 'brand', 'product', 'event'].includes(pathSegments[index - 1] || '')) {
          // Don't add if previous segment was a route prefix (like the slug after org/brand/product/event)
          if (!isLast && !['org', 'brand', 'product', 'event'].includes(segment)) {
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
    <Breadcrumb className={cn('mb-4 relative z-10 pointer-events-auto', className)}>
      <BreadcrumbList className="flex-wrap text-xs sm:text-sm">
        {/* Home link */}
        {showHome && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to={homeHref}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] sm:min-h-0 px-1 rounded-md cursor-pointer pointer-events-auto"
                >
                  <Home className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {(hasIntermediateItems || currentPage) && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              </BreadcrumbSeparator>
            )}
          </>
        )}

        {/* Intermediate breadcrumb items */}
        {breadcrumbItems.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === breadcrumbItems.length - 1 && !currentPage;

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1.5 font-medium min-h-[44px] sm:min-h-0 px-1">
                    {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">{item.label}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={item.href || '/'}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] sm:min-h-0 px-1 rounded-md cursor-pointer pointer-events-auto"
                    >
                      {Icon && <Icon className="h-4 w-4 flex-shrink-0 hidden sm:block" />}
                      <span className="truncate max-w-[100px] sm:max-w-[150px]">{item.label}</span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          );
        })}

        {/* Current page (final item, not a link) */}
        {currentPage && (
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1.5 font-medium text-foreground min-h-[44px] sm:min-h-0 px-1">
              {CurrentIcon && <CurrentIcon className="h-4 w-4 flex-shrink-0 hidden sm:block" />}
              <span className="truncate max-w-[160px] sm:max-w-[300px]">{currentPage}</span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
});

AppBreadcrumbs.displayName = "AppBreadcrumbs";

/**
 * StudioShell — enterprise app shell for the Icon Studio.
 *
 * Layout:
 *   [Top bar — brand selector · Guided/Expert · Save to library]
 *   [Left sidebar — Dashboard · Generate · Library · Brands · Style Systems
 *                   · Icon Sets · QA · Export Center · Settings]
 *   [Main workspace · Optional right Production Summary panel]
 *
 * Phase 1 wires Dashboard + Generate (existing wizard) and ships premium
 * placeholders for the rest. Right rail surfaces only when relevant.
 */

import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  FolderOpen,
  Home,
  LayoutDashboard,
  Library,
  Moon,
  Package,
  Palette,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import './tpTokens.css';

export type ShellSection =
  | 'dashboard'
  | 'generate'
  | 'library'
  | 'brands'
  | 'styles'
  | 'sets'
  | 'qa'
  | 'export'
  | 'settings';

interface NavItem {
  id: ShellSection;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'generate', label: 'Generate', icon: Wand2, badge: 'Wizard' },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'brands', label: 'Brands', icon: Building2 },
  { id: 'styles', label: 'Style Systems', icon: Palette },
  { id: 'sets', label: 'Icon Sets', icon: FolderOpen },
  { id: 'qa', label: 'QA / Preflight', icon: ShieldCheck },
  { id: 'export', label: 'Export Center', icon: Package },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export interface Brand {
  id: string;
  name: string;
}

interface Props {
  activeSection: ShellSection;
  onSectionChange: (s: ShellSection) => void;
  expertMode?: boolean;
  onExpertModeChange?: (v: boolean) => void;
  brands: Brand[];
  activeBrand?: Brand;
  onBrandChange?: (b: Brand) => void;
  onCreateBrand?: () => void;
  onSaveToLibrary?: () => void;
  onBack?: () => void;
  /** Right rail panel (Production Summary) — renders when provided */
  rightRail?: ReactNode;
  children: ReactNode;
}

export const StudioShell = ({
  activeSection,
  onSectionChange,
  expertMode,
  onExpertModeChange,
  brands,
  activeBrand,
  onBrandChange,
  onCreateBrand,
  onSaveToLibrary,
  onBack,
  rightRail,
  children,
}: Props) => {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('icon-studio-theme') as 'dark' | 'light') ?? 'light';
  });
  useEffect(() => {
    localStorage.setItem('icon-studio-theme', theme);
  }, [theme]);

  return (
    <div
      data-theme={theme}
      className="icon-studio-tp min-h-screen"
      style={{ background: 'hsl(var(--tp-surface-0))' }}
    >
      {/* ============ TOP BAR ============ */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{
          background: 'hsl(var(--tp-surface-1) / 0.92)',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <div className="flex h-14 items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(var(--tp-digital-blue)), hsl(var(--tp-light-blue)))',
                }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">Icon Studio</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Production platform
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Brand selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-8 max-w-[220px]"
                  aria-label="Select brand profile"
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate text-xs">
                    {activeBrand?.name || 'Select brand'}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Brand profiles
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {brands.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    No brand profiles yet.
                  </div>
                ) : (
                  brands.map((b) => (
                    <DropdownMenuItem
                      key={b.id}
                      onClick={() => onBrandChange?.(b)}
                      className="gap-2"
                    >
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{b.name}</span>
                      {activeBrand?.id === b.id && (
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          Active
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
                {onCreateBrand && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onCreateBrand} className="gap-2 text-primary">
                      <Building2 className="h-3.5 w-3.5" />
                      Create new brand…
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mode toggle (only when caller provides expert mode handlers) */}
            {onExpertModeChange && (
              <div
                className="hidden md:flex items-center gap-2 rounded-md border bg-secondary/40 px-2.5 py-1"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                <Compass className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Guided
                </span>
                <Switch
                  checked={!!expertMode}
                  onCheckedChange={onExpertModeChange}
                  aria-label="Toggle expert mode"
                  className="h-4 w-7"
                />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Expert
                </span>
              </div>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {onSaveToLibrary && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8"
                onClick={onSaveToLibrary}
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save to library</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ============ BREADCRUMB ============ */}
      <div
        className="border-b px-5 py-2"
        style={{
          background: 'hsl(var(--tp-surface-1) / 0.6)',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to="/"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3 w-3" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to="/icon-studio"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Icon Studio
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3 w-3" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">
                {NAV.find((n) => n.id === activeSection)?.label ?? activeSection}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* ============ BODY ============ */}
      <div className="flex">
        {/* Sidebar */}
        <nav
          className={cn(
            'sticky top-14 self-start border-r transition-[width] duration-200',
            navCollapsed ? 'w-[60px]' : 'w-[220px]',
          )}
          style={{
            height: 'calc(100vh - 3.5rem)',
            background: 'hsl(var(--tp-surface-1) / 0.6)',
            borderColor: 'hsl(var(--border))',
          }}
          aria-label="Studio navigation"
        >
          <div className="flex h-full flex-col">
            <ul className="flex-1 space-y-0.5 p-2">
              {NAV.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onSectionChange(item.id)}
                      className={cn(
                        'group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                      )}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={item.label}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 flex-shrink-0 transition-colors',
                          isActive && 'text-foreground',
                        )}
                        style={isActive ? { color: 'hsl(var(--tp-light-blue))' } : undefined}
                      />
                      {!navCollapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant="outline"
                              className="ml-auto h-4 px-1.5 text-[9px] tracking-wider"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Collapse control */}
            <div className="border-t p-2" style={{ borderColor: 'hsl(var(--border))' }}>
              <button
                onClick={() => setNavCollapsed((v) => !v)}
                className="flex w-full items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                aria-label={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {navCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Collapse</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Main + right rail */}
        <main className="min-w-0 flex-1">
          <div
            className={cn(
              'mx-auto grid gap-6 px-6 py-6',
              rightRail
                ? 'max-w-[1600px] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]'
                : 'max-w-[1400px] grid-cols-1',
            )}
          >
            <div className="min-w-0">{children}</div>
            {rightRail && (
              <div className="hidden xl:block">{rightRail}</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

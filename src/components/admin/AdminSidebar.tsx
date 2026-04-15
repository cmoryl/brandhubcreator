import { 
  BarChart3, UserCheck, Users, Building2, UserPlus, Palette, 
  Database, TrendingUp, Eye, Brain, FileText, Activity, 
  Wrench, HardDrive, Shield, Menu, X, Package, Image, Mail, Sparkles, MapPin, FileDown, Globe2, Crown, Bot, Lightbulb, GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  group: string;
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingApprovals?: number;
  isSuperAdmin?: boolean;
}

const navGroups = [
  { id: 'core', label: 'Core Admin' },
  { id: 'management', label: 'Management' },
  { id: 'localization', label: 'Localization' },
  { id: 'analytics', label: 'Analytics & AI' },
  { id: 'tools', label: 'Tools' },
];

function SidebarContent({ 
  activeTab, 
  onTabChange, 
  pendingApprovals = 0,
  isSuperAdmin = false,
  onItemClick 
}: AdminSidebarProps & { onItemClick?: () => void }) {
  const allNavItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" />, group: 'core' },
    { id: 'people', label: 'People', icon: <Users className="h-4 w-4" />, badge: pendingApprovals, group: 'core' },
    { id: 'organizations', label: 'Organizations', icon: <Building2 className="h-4 w-4" />, group: 'management' },
    { id: 'locations', label: 'Company Locations', icon: <MapPin className="h-4 w-4" />, group: 'management' },
    { id: 'globallink', label: 'GlobalLink', icon: <Globe2 className="h-4 w-4" />, group: 'localization' },
    { id: 'analytics', label: 'Brand Analytics', icon: <TrendingUp className="h-4 w-4" />, group: 'analytics' },
    { id: 'user-analytics', label: 'User Stats', icon: <Eye className="h-4 w-4" />, group: 'analytics' },
    { id: 'intelligence', label: 'Intelligence Hub', icon: <Brain className="h-4 w-4" />, group: 'analytics' },
    { id: 'dataforce', label: 'DataForce AI', icon: <Activity className="h-4 w-4" />, group: 'analytics' },
    { id: 'bias-awareness', label: 'Bias Awareness', icon: <Shield className="h-4 w-4" />, group: 'analytics' },
    { id: 'bot-management', label: 'Bot Manager', icon: <Bot className="h-4 w-4" />, group: 'analytics' },
    { id: 'health-timeline', label: 'Health Timeline', icon: <TrendingUp className="h-4 w-4" />, group: 'analytics' },
    { id: 'portfolio-insights', label: 'Portfolio Insights', icon: <Lightbulb className="h-4 w-4" />, group: 'analytics' },
    { id: 'ai-center', label: 'AI Center', icon: <GraduationCap className="h-4 w-4" />, group: 'analytics' },
    { id: 'downloads', label: 'Downloads', icon: <FileDown className="h-4 w-4" />, group: 'analytics' },
    { id: 'reports', label: 'Reports', icon: <FileText className="h-4 w-4" />, group: 'tools' },
    { id: 'accessibility', label: 'Accessibility', icon: <Shield className="h-4 w-4" />, group: 'tools' },
    { id: 'activity', label: 'Activity Log', icon: <Activity className="h-4 w-4" />, group: 'tools' },
    { id: 'image-library', label: 'Image Library', icon: <Image className="h-4 w-4" />, group: 'tools' },
    { id: 'logo-hub', label: 'Logo Hub', icon: <Crown className="h-4 w-4" />, group: 'tools' },
    { id: 'inspector', label: 'Inspector', icon: <Database className="h-4 w-4" />, group: 'tools' },
    { id: 'repair', label: 'Repair Tools', icon: <Wrench className="h-4 w-4" />, group: 'tools' },
    { id: 'backups', label: 'Backups', icon: <HardDrive className="h-4 w-4" />, group: 'tools' },
    { id: 'demo-pages', label: 'Demo Pages', icon: <Sparkles className="h-4 w-4" />, group: 'tools' },
  ];

  const superAdminOnly = ['repair', 'demo-pages'];
  const navItems = isSuperAdmin ? allNavItems : allNavItems.filter(item => !superAdminOnly.includes(item.id));

  const handleItemClick = (id: string) => {
    onTabChange(id);
    onItemClick?.();
  };

  return (
    <>
      {/* Logo/Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Admin Panel</p>
            <p className="text-xs text-muted-foreground">Platform Management</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-4">
          {navGroups.map((group) => {
            const groupItems = navItems.filter(item => item.group === group.id);
            if (groupItems.length === 0) return null;

            return (
              <div key={group.id}>
                <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {groupItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                        activeTab === item.id 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </>
  );
}

// Mobile navigation trigger button
export function AdminMobileNav({ activeTab, onTabChange, pendingApprovals = 0, isSuperAdmin = false }: AdminSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open admin menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
        <SidebarContent 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          pendingApprovals={pendingApprovals}
          isSuperAdmin={isSuperAdmin}
          onItemClick={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

// Desktop sidebar
export function AdminSidebar({ activeTab, onTabChange, pendingApprovals = 0, isSuperAdmin = false }: AdminSidebarProps) {
  return (
    <aside className="hidden md:flex w-56 border-r bg-card/50 flex-col h-[calc(100vh-73px)] shrink-0">
      <SidebarContent 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        pendingApprovals={pendingApprovals}
        isSuperAdmin={isSuperAdmin}
      />
    </aside>
  );
}

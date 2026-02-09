import { 
  BarChart3, UserCheck, Users, Building2, UserPlus, Palette, 
  Database, TrendingUp, Eye, Brain, FileText, Activity, 
  Wrench, HardDrive, Shield, Menu, X, Orbit, Package, Image, Mail, Sparkles, MapPin, FileDown, Globe2
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
}

const navGroups = [
  { id: 'core', label: 'Core Admin' },
  { id: 'management', label: 'Management' },
  { id: 'content', label: 'Content & Data' },
  { id: 'localization', label: 'Localization' },
  { id: 'analytics', label: 'Analytics & AI' },
  { id: 'tools', label: 'Tools' },
];

function SidebarContent({ 
  activeTab, 
  onTabChange, 
  pendingApprovals = 0,
  onItemClick 
}: AdminSidebarProps & { onItemClick?: () => void }) {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" />, group: 'core' },
    { id: 'approvals', label: 'Approvals', icon: <UserCheck className="h-4 w-4" />, badge: pendingApprovals, group: 'core' },
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" />, group: 'management' },
    { id: 'organizations', label: 'Organizations', icon: <Building2 className="h-4 w-4" />, group: 'management' },
    { id: 'members', label: 'Members', icon: <UserPlus className="h-4 w-4" />, group: 'management' },
    { id: 'content', label: 'Content', icon: <Palette className="h-4 w-4" />, group: 'content' },
    { id: 'inspector', label: 'Inspector', icon: <Database className="h-4 w-4" />, group: 'content' },
    { id: 'analytics', label: 'Brand Analytics', icon: <TrendingUp className="h-4 w-4" />, group: 'analytics' },
    { id: 'user-analytics', label: 'User Stats', icon: <Eye className="h-4 w-4" />, group: 'analytics' },
    { id: 'ai-analysis', label: 'AI Analysis', icon: <Brain className="h-4 w-4" />, group: 'analytics' },
    { id: 'reports', label: 'Reports', icon: <FileText className="h-4 w-4" />, group: 'tools' },
    { id: 'downloads', label: 'Downloads', icon: <FileDown className="h-4 w-4" />, group: 'analytics' },
    { id: 'activity', label: 'Activity Log', icon: <Activity className="h-4 w-4" />, group: 'tools' },
    { id: 'image-library', label: 'Image Library', icon: <Image className="h-4 w-4" />, group: 'tools' },
    { id: 'repair', label: 'Repair Tools', icon: <Wrench className="h-4 w-4" />, group: 'tools' },
    { id: 'backups', label: 'Backups', icon: <HardDrive className="h-4 w-4" />, group: 'tools' },
    { id: 'universe-backups', label: 'Universe Backups', icon: <Orbit className="h-4 w-4" />, group: 'tools' },
    { id: 'suite-backups', label: 'Suite Backups', icon: <Package className="h-4 w-4" />, group: 'tools' },
    { id: 'leads', label: 'Lead Submissions', icon: <Mail className="h-4 w-4" />, group: 'core' },
    { id: 'demo-pages', label: 'Demo Pages', icon: <Sparkles className="h-4 w-4" />, group: 'content' },
    { id: 'locations', label: 'Company Locations', icon: <MapPin className="h-4 w-4" />, group: 'content' },
    { id: 'globallink', label: 'GlobalLink', icon: <Globe2 className="h-4 w-4" />, group: 'localization' },
  ];

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
export function AdminMobileNav({ activeTab, onTabChange, pendingApprovals = 0 }: AdminSidebarProps) {
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
          onItemClick={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

// Desktop sidebar
export function AdminSidebar({ activeTab, onTabChange, pendingApprovals = 0 }: AdminSidebarProps) {
  return (
    <aside className="hidden md:flex w-56 border-r bg-card/50 flex-col h-[calc(100vh-73px)] shrink-0">
      <SidebarContent 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        pendingApprovals={pendingApprovals}
      />
    </aside>
  );
}

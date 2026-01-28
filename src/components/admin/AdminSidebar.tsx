import { 
  BarChart3, UserCheck, Users, Building2, UserPlus, Palette, 
  Database, TrendingUp, Eye, Brain, FileText, Activity, 
  Wrench, HardDrive, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  { id: 'analytics', label: 'Analytics & AI' },
  { id: 'tools', label: 'Tools' },
];

export function AdminSidebar({ activeTab, onTabChange, pendingApprovals = 0 }: AdminSidebarProps) {
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
    { id: 'activity', label: 'Activity Log', icon: <Activity className="h-4 w-4" />, group: 'tools' },
    { id: 'repair', label: 'Repair Tools', icon: <Wrench className="h-4 w-4" />, group: 'tools' },
    { id: 'backups', label: 'Backups', icon: <HardDrive className="h-4 w-4" />, group: 'tools' },
  ];

  return (
    <aside className="w-56 border-r bg-card/50 flex flex-col h-[calc(100vh-73px)] shrink-0">
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
                      onClick={() => onTabChange(item.id)}
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
    </aside>
  );
}

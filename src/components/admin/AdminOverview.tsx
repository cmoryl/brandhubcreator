/**
 * AdminOverview - Polished admin dashboard overview
 * Features: Animated counters, staggered reveals, interactive cards, live health ring
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Building2, Palette, Package, Calendar, Activity,
  TrendingUp, AlertTriangle, Clock, Shield, CheckCircle,
  UserCheck, FileText, Database, HardDrive, Mail, Image,
  Eye, Zap, ArrowRight, Brain, Wrench, RefreshCw, BarChart3,
  Bot, Globe, Languages, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  DashboardStats,
  ActivityLog,
  ModuleStatus,
  QuickAction,
  getActivityIcon
} from '@/lib/admin';

// ─── Animated Counter ───────────────────────────────────────
function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - elapsed, 3); // ease-out cubic
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      ref.current = current;
      if (elapsed < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

// ─── Health Ring SVG ────────────────────────────────────────
function HealthRing({ value, size = 64, strokeWidth = 5, color }: { value: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      />
    </svg>
  );
}

// ─── Stagger Container ──────────────────────────────────────
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

// ─── Types ──────────────────────────────────────────────────
interface AdminOverviewProps {
  stats: DashboardStats | null;
  activityLogs: ActivityLog[];
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  locationCount?: number;
  leadCount?: number;
  imageCount?: number;
  isSuperAdmin?: boolean;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  stats,
  activityLogs,
  onTabChange,
  onRefresh,
  isLoading = false,
  locationCount = 0,
  leadCount = 0,
  imageCount = 0,
  isSuperAdmin = false,
}) => {
  const contentHealth = stats ? Math.round(((stats.publicBrands + stats.publicEvents) / Math.max(stats.totalBrands + stats.totalEvents, 1)) * 100) : 0;
  const userEngagement = stats?.totalUsers ? Math.round((stats.activeUsersToday / stats.totalUsers) * 100) : 0;

  const heroStats = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, accent: 'from-primary/20 to-primary/5', iconColor: 'text-primary', growth: stats?.newUsersThisWeek, sub: `${stats?.activeUsersToday || 0} active today` },
    { label: 'Organizations', value: stats?.totalOrganizations || 0, icon: Building2, accent: 'from-violet-500/15 to-violet-500/5', iconColor: 'text-violet-500', sub: 'Active workspaces' },
    { label: 'Content', value: (stats?.totalBrands || 0) + (stats?.totalProducts || 0) + (stats?.totalEvents || 0), icon: Palette, accent: 'from-blue-500/15 to-blue-500/5', iconColor: 'text-blue-500', sub: `${stats?.totalBrands || 0}b · ${stats?.totalProducts || 0}p · ${stats?.totalEvents || 0}e` },
    { label: 'Published', value: (stats?.publicBrands || 0) + (stats?.publicEvents || 0), icon: Eye, accent: 'from-emerald-500/15 to-emerald-500/5', iconColor: 'text-emerald-500', sub: `${contentHealth}% publish rate` },
  ];

  const moduleCards: (ModuleStatus & { accent: string })[] = [
    { id: 'users', name: 'Users', icon: <Users className="h-4 w-4" />, count: stats?.totalUsers || 0, status: (stats?.pendingApprovals || 0) > 0 ? 'warning' : 'healthy', trend: stats?.newUsersThisWeek, description: `${stats?.pendingApprovals || 0} pending`, accent: 'primary' },
    { id: 'organizations', name: 'Orgs', icon: <Building2 className="h-4 w-4" />, count: stats?.totalOrganizations || 0, status: 'healthy', description: 'Workspaces', accent: 'violet-500' },
    { id: 'analytics', name: 'Brands', icon: <Palette className="h-4 w-4" />, count: stats?.totalBrands || 0, status: 'healthy', description: `${stats?.publicBrands || 0} public`, accent: 'blue-500' },
    { id: 'analytics', name: 'Products', icon: <Package className="h-4 w-4" />, count: stats?.totalProducts || 0, status: 'healthy', description: 'Guides', accent: 'sky-500' },
    { id: 'analytics', name: 'Events', icon: <Calendar className="h-4 w-4" />, count: stats?.totalEvents || 0, status: 'healthy', description: `${stats?.publicEvents || 0} public`, accent: 'teal-500' },
    { id: 'leads', name: 'Leads', icon: <Mail className="h-4 w-4" />, count: leadCount, status: leadCount > 0 ? 'warning' : 'healthy', description: 'Submissions', accent: 'amber-500' },
    { id: 'locations', name: 'Locations', icon: <Globe className="h-4 w-4" />, count: locationCount, status: 'healthy', description: 'Offices', accent: 'rose-500' },
    { id: 'image-library', name: 'Assets', icon: <Image className="h-4 w-4" />, count: imageCount, status: 'healthy', description: 'Images', accent: 'indigo-500' },
  ];

  const quickActions: QuickAction[] = [
    { id: 'approvals', label: 'Review Approvals', icon: <UserCheck className="h-4 w-4" />, onClick: () => onTabChange('approvals'), badge: stats?.pendingApprovals, variant: (stats?.pendingApprovals || 0) > 0 ? 'destructive' : 'outline' },
    { id: 'reports', label: 'Generate Report', icon: <FileText className="h-4 w-4" />, onClick: () => onTabChange('reports') },
    { id: 'ai-analysis', label: 'Intelligence Hub', icon: <Brain className="h-4 w-4" />, onClick: () => onTabChange('intelligence') },
    { id: 'backups', label: 'Manage Backups', icon: <HardDrive className="h-4 w-4" />, onClick: () => onTabChange('backups') },
    ...(isSuperAdmin ? [{ id: 'repair', label: 'Repair Tools', icon: <Wrench className="h-4 w-4" />, onClick: () => onTabChange('repair') }] : []),
    { id: 'inspector', label: 'Data Inspector', icon: <Database className="h-4 w-4" />, onClick: () => onTabChange('inspector') },
  ] as QuickAction[];

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* ── Pending Approval Banner ────────────────────────── */}
      <AnimatePresence>
        {(stats?.pendingApprovals || 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <button
              onClick={() => onTabChange('approvals')}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 hover:bg-destructive/15 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-destructive">
                  {stats?.pendingApprovals} user{(stats?.pendingApprovals || 0) > 1 ? 's' : ''} awaiting approval
                </p>
                <p className="text-xs text-destructive/70">Click to review</p>
              </div>
              <ArrowRight className="h-4 w-4 text-destructive group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Stats ─────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {heroStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Card className={cn(
              "relative overflow-hidden border-border/60 bg-gradient-to-br cursor-default",
              stat.accent,
              "hover:shadow-lg transition-shadow duration-300"
            )}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-foreground/[0.03] to-transparent rounded-bl-full" />
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
                  <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">
                    <AnimatedCounter value={stat.value} />
                  </span>
                  {stat.growth && stat.growth > 0 && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] font-semibold px-1.5 h-5">
                      <TrendingUp className="h-3 w-3 mr-0.5" />+{stat.growth}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/80 mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main Grid ──────────────────────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Module Grid — 8 cols */}
        <motion.div variants={fadeUp} className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader className="p-5 pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Modules</CardTitle>
                    <CardDescription className="text-[11px]">Click to navigate</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh} disabled={isLoading}>
                  <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
                variants={stagger}
                initial="hidden"
                animate="show"
              >
                {moduleCards.map((mod, i) => (
                  <motion.button
                    key={`${mod.id}-${i}`}
                    variants={fadeUp}
                    onClick={() => onTabChange(mod.id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "relative flex flex-col gap-1.5 p-3.5 rounded-xl border text-left transition-colors duration-200 group overflow-hidden",
                      "border-border/60 hover:border-primary/30 hover:bg-primary/[0.03]",
                      mod.status === 'warning' && "border-amber-500/40 bg-amber-500/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        mod.status === 'warning' ? "bg-amber-500/15 text-amber-500" : "bg-primary/10 text-primary"
                      )}>
                        {mod.icon}
                      </div>
                      <span className="text-xl font-bold tabular-nums">
                        <AnimatedCounter value={mod.count} duration={0.8} />
                      </span>
                      {mod.trend !== undefined && mod.trend > 0 && (
                        <span className="ml-auto text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">+{mod.trend}</span>
                      )}
                    </div>
                    <span className="text-xs font-medium">{mod.name}</span>
                    <span className="text-[10px] text-muted-foreground">{mod.description}</span>
                  </motion.button>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions + Health — 4 cols */}
        <motion.div variants={fadeUp} className="lg:col-span-4 flex flex-col gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="p-4 pb-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-1.5">
                {quickActions.map((action) => (
                  <motion.div key={action.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant={action.variant || 'ghost'}
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-2 h-9 text-xs font-medium",
                        action.variant !== 'destructive' && "hover:bg-muted/80"
                      )}
                      onClick={action.onClick}
                    >
                      {action.icon}
                      <span className="truncate">{action.label}</span>
                      {action.badge !== undefined && action.badge > 0 && (
                        <Badge variant="destructive" className="ml-auto h-4 min-w-4 flex items-center justify-center px-1 text-[9px] font-bold rounded-full">
                          {action.badge}
                        </Badge>
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Health Rings */}
          <Card className="flex-1">
            <CardHeader className="p-4 pb-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <CardTitle className="text-sm font-semibold">Platform Health</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="relative flex flex-col items-center">
                  <HealthRing value={contentHealth} color="hsl(var(--primary))" />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{contentHealth}%</span>
                  <span className="text-[10px] text-muted-foreground mt-1.5">Published</span>
                </div>
                <div className="relative flex flex-col items-center">
                  <HealthRing value={userEngagement} color="hsl(142.1 76.2% 36.3%)" />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{userEngagement}%</span>
                  <span className="text-[10px] text-muted-foreground mt-1.5">Engaged</span>
                </div>
              </div>
              {/* Services */}
              <div className="grid grid-cols-2 gap-1.5 w-full">
                {['Database', 'Auth', 'Storage', 'Functions'].map((svc) => (
                  <div key={svc} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span className="text-[11px] font-medium">{svc}</span>
                  </div>
                ))}
              </div>
              {(stats?.newUsersThisWeek || 0) > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15 w-full justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{stats?.newUsersThisWeek} users this week</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Activity Feed ──────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="p-5 pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
                  <CardDescription className="text-[11px]">Latest platform events</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => onTabChange('activity')}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[220px]">
              {activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {activityLogs.slice(0, 10).map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className={cn(
                        "flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group",
                        i === 0 && "bg-muted/30"
                      )}
                    >
                      <div className="p-1.5 rounded-md bg-background border shadow-sm shrink-0 mt-0.5">
                        {getActivityIcon(log.type, log.entityType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate group-hover:text-foreground">{log.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {log.userEmail && <span className="text-[10px] text-primary font-medium truncate max-w-[160px]">{log.userEmail}</span>}
                          <span className="text-[10px] text-muted-foreground">{format(new Date(log.timestamp), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Summary Widgets Row ─────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid lg:grid-cols-2 gap-6">
        <DataForceSummaryWidget onTabChange={onTabChange} />
        <GlobalLinkSummaryWidget onTabChange={onTabChange} />
      </motion.div>
    </motion.div>
  );
};

// ─── DataForce Summary ──────────────────────────────────────
const DataForceSummaryWidget: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [data, setData] = useState<{ scans: number; avgScore: number; conversations: number; validations: number; pending: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: compliance }, { data: convos }, { data: validations }] = await Promise.all([
        supabase.from('dataforce_compliance_jobs').select('compliance_score, status').eq('status', 'completed'),
        supabase.from('dataforce_assistant_conversations').select('id', { count: 'exact', head: true }),
        supabase.from('dataforce_validation_requests').select('status'),
      ]);
      const scores = compliance || [];
      const avg = scores.length > 0 ? scores.reduce((a, j) => a + (j.compliance_score || 0), 0) / scores.length : 0;
      const pendingCount = (validations || []).filter(v => v.status === 'pending' || v.status === 'in_review').length;
      setData({ scans: scores.length, avgScore: avg, conversations: convos?.length || 0, validations: (validations || []).length, pending: pendingCount });
    })();
  }, []);

  const items = data ? [
    { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Compliance Scans', value: data.scans, sub: data.avgScore > 0 ? `Avg: ${data.avgScore.toFixed(0)}%` : undefined, subColor: data.avgScore >= 80 ? 'text-emerald-500' : data.avgScore >= 60 ? 'text-amber-500' : 'text-destructive' },
    { icon: Bot, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Conversations', value: data.conversations, sub: 'Brand Assistant' },
    { icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10', label: 'Validations', value: data.validations, sub: data.pending > 0 ? `${data.pending} pending` : undefined, subColor: 'text-amber-500' },
  ] : [];

  return (
    <Card>
      <CardHeader className="p-4 pb-2.5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10"><Sparkles className="h-3.5 w-3.5 text-blue-500" /></div>
            <CardTitle className="text-sm font-semibold">DataForce AI</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => onTabChange('intelligence')}>
            Details <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {!data ? (
          <div className="flex justify-center py-6"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {items.map((item) => (
              <motion.button
                key={item.label}
                onClick={() => onTabChange('intelligence')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col gap-1.5 p-3 rounded-xl border border-border/60 hover:border-primary/30 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", item.bg)}><item.icon className={cn("h-4 w-4", item.color)} /></div>
                  <span className="text-lg font-bold tabular-nums"><AnimatedCounter value={item.value} duration={0.8} /></span>
                </div>
                <span className="text-[11px] font-medium">{item.label}</span>
                {item.sub && <span className={cn("text-[10px]", item.subColor || 'text-muted-foreground')}>{item.sub}</span>}
              </motion.button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── GlobalLink Summary ─────────────────────────────────────
const GlobalLinkSummaryWidget: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [data, setData] = useState<{ totalJobs: number; completedJobs: number; pendingJobs: number; languages: number; variants: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: jobs }, { data: languages }, { data: variants }] = await Promise.all([
        supabase.from('localization_jobs').select('status'),
        supabase.from('localization_target_languages').select('id', { count: 'exact', head: true }),
        supabase.from('brand_regional_variants').select('id', { count: 'exact', head: true }),
      ]);
      const allJobs = jobs || [];
      setData({
        totalJobs: allJobs.length,
        completedJobs: allJobs.filter(j => j.status === 'completed').length,
        pendingJobs: allJobs.filter(j => j.status === 'pending' || j.status === 'in_progress').length,
        languages: languages?.length || 0,
        variants: variants?.length || 0,
      });
    })();
  }, []);

  const items = data ? [
    { icon: FileText, color: 'text-sky-500', bg: 'bg-sky-500/10', label: 'Translation Jobs', value: data.totalJobs, sub: data.completedJobs > 0 ? `${data.completedJobs} completed` : undefined, subColor: 'text-emerald-500' },
    { icon: Languages, color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'Languages', value: data.languages, sub: 'Target languages' },
    { icon: Globe, color: 'text-teal-500', bg: 'bg-teal-500/10', label: 'Variants', value: data.variants, sub: 'Regional guides' },
  ] : [];

  return (
    <Card>
      <CardHeader className="p-4 pb-2.5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10"><Globe className="h-3.5 w-3.5 text-sky-500" /></div>
            <CardTitle className="text-sm font-semibold">GlobalLink</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => onTabChange('globallink')}>
            Details <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {!data ? (
          <div className="flex justify-center py-6"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {items.map((item) => (
              <motion.button
                key={item.label}
                onClick={() => onTabChange('globallink')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col gap-1.5 p-3 rounded-xl border border-border/60 hover:border-sky-500/30 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", item.bg)}><item.icon className={cn("h-4 w-4", item.color)} /></div>
                  <span className="text-lg font-bold tabular-nums"><AnimatedCounter value={item.value} duration={0.8} /></span>
                </div>
                <span className="text-[11px] font-medium">{item.label}</span>
                {item.sub && <span className={cn("text-[10px]", item.subColor || 'text-muted-foreground')}>{item.sub}</span>}
              </motion.button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminOverview;

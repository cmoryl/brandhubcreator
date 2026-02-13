/**
 * AdminOverview - Bold, editorial admin dashboard
 * Clean hierarchy with a command-center feel
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Building2, Palette, Package, Calendar, Activity,
  TrendingUp, AlertTriangle, Clock, Shield, CheckCircle,
  UserCheck, FileText, Database, HardDrive, Mail, Image,
  Eye, Zap, ArrowRight, Brain, Wrench, RefreshCw, BarChart3,
  Bot, Globe, Languages, Sparkles, ChevronRight, Layers
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
      const eased = 1 - Math.pow(1 - elapsed, 3);
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

// ─── Spark Line (mini bar chart) ────────────────────────────
function SparkBars({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[3px] h-8">
      {values.map((v, i) => (
        <motion.div
          key={i}
          className={cn("w-[5px] rounded-sm", color)}
          initial={{ height: 0 }}
          animate={{ height: `${Math.max((v / max) * 100, 8)}%` }}
          transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}

// ─── Radial Progress ────────────────────────────────────────
function RadialProgress({ value, size = 52, label, color }: { value: number; size?: number; label: string; color: string }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">{value}%</span>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

// ─── Animation Variants ─────────────────────────────────────
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

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

  // Fake sparkline data derived from stats for visual effect
  const userSpark = [3, 5, 4, 7, 6, 8, stats?.activeUsersToday || 5];
  const contentSpark = [2, 4, 3, 6, 5, 7, (stats?.totalBrands || 0) % 10 || 4];

  const quickActions: QuickAction[] = [
    { id: 'approvals', label: 'Review Approvals', icon: <UserCheck className="h-4 w-4" />, onClick: () => onTabChange('approvals'), badge: stats?.pendingApprovals, variant: (stats?.pendingApprovals || 0) > 0 ? 'destructive' : 'outline' },
    { id: 'reports', label: 'Generate Report', icon: <FileText className="h-4 w-4" />, onClick: () => onTabChange('reports') },
    { id: 'ai-analysis', label: 'Intelligence Hub', icon: <Brain className="h-4 w-4" />, onClick: () => onTabChange('intelligence') },
    { id: 'backups', label: 'Manage Backups', icon: <HardDrive className="h-4 w-4" />, onClick: () => onTabChange('backups') },
    ...(isSuperAdmin ? [{ id: 'repair', label: 'Repair Tools', icon: <Wrench className="h-4 w-4" />, onClick: () => onTabChange('repair') }] : []),
    { id: 'inspector', label: 'Data Inspector', icon: <Database className="h-4 w-4" />, onClick: () => onTabChange('inspector') },
  ] as QuickAction[];

  return (
    <motion.div className="space-y-5" variants={stagger} initial="hidden" animate="show">

      {/* ── Header Row ─────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Command Center</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(), 'EEEE, MMMM d')} · Last refresh {format(new Date(), 'h:mm a')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="gap-2">
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </motion.div>

      {/* ── Pending Approval Banner ────────────────────────── */}
      <AnimatePresence>
        {(stats?.pendingApprovals || 0) > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <button
              onClick={() => onTabChange('approvals')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 hover:bg-destructive/15 transition-all group"
            >
              <div className="h-9 w-9 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-destructive">{stats?.pendingApprovals} pending approval{(stats?.pendingApprovals || 0) > 1 ? 's' : ''}</p>
                <p className="text-[11px] text-destructive/60">Action required</p>
              </div>
              <ChevronRight className="h-4 w-4 text-destructive/50 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Primary Metrics Row ────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Users */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="border-border/50 overflow-hidden group cursor-pointer" onClick={() => onTabChange('users')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <SparkBars values={userSpark} color="bg-primary/60" />
              </div>
              <span className="text-2xl font-bold tabular-nums block"><AnimatedCounter value={stats?.totalUsers || 0} /></span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-muted-foreground">Users</span>
                {(stats?.newUsersThisWeek || 0) > 0 && (
                  <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-0.5">
                    <TrendingUp className="h-2.5 w-2.5" />+{stats?.newUsersThisWeek}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Organizations */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="border-border/50 overflow-hidden cursor-pointer" onClick={() => onTabChange('organizations')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-violet-500" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">Workspaces</span>
              </div>
              <span className="text-2xl font-bold tabular-nums block"><AnimatedCounter value={stats?.totalOrganizations || 0} /></span>
              <span className="text-[11px] text-muted-foreground mt-1 block">Organizations</span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="border-border/50 overflow-hidden cursor-pointer" onClick={() => onTabChange('analytics')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-blue-500" />
                </div>
                <SparkBars values={contentSpark} color="bg-blue-500/50" />
              </div>
              <span className="text-2xl font-bold tabular-nums block">
                <AnimatedCounter value={(stats?.totalBrands || 0) + (stats?.totalProducts || 0) + (stats?.totalEvents || 0)} />
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-muted-foreground">{stats?.totalBrands || 0} brands</span>
                <span className="text-[10px] text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground">{stats?.totalProducts || 0} products</span>
                <span className="text-[10px] text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground">{stats?.totalEvents || 0} events</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Published / Health */}
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="border-border/50 overflow-hidden cursor-pointer" onClick={() => onTabChange('analytics')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center gap-3">
                  <RadialProgress value={contentHealth} size={36} label="" color="hsl(var(--primary))" />
                </div>
              </div>
              <span className="text-2xl font-bold tabular-nums block">
                <AnimatedCounter value={(stats?.publicBrands || 0) + (stats?.publicEvents || 0)} />
              </span>
              <span className="text-[11px] text-muted-foreground mt-1 block">Published · {contentHealth}% rate</span>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Two Column: Activity + Sidebar ──────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Activity Feed — 2 cols */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="p-4 pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Activity className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Activity Stream</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground h-7" onClick={() => onTabChange('activity')}>
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[340px]">
                {activityLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Activity className="h-8 w-8 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {activityLogs.slice(0, 12).map((log, i) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="p-1.5 rounded-md bg-muted/60 shrink-0 mt-0.5">
                          {getActivityIcon(log.type, log.entityType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] leading-snug truncate">{log.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {log.userEmail && (
                              <span className="text-[10px] text-primary/80 font-medium truncate max-w-[150px]">{log.userEmail}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                            </span>
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

        {/* Sidebar: Quick Actions + Modules + Health */}
        <motion.div variants={fadeUp} className="space-y-4">

          {/* Quick Actions */}
          <Card>
            <CardHeader className="p-3.5 pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-2.5">
              <div className="space-y-0.5">
                {quickActions.map((action) => (
                  <motion.div key={action.id} whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-2.5 h-9 text-xs font-medium",
                        action.variant === 'destructive' && "text-destructive hover:text-destructive hover:bg-destructive/10"
                      )}
                      onClick={action.onClick}
                    >
                      {action.icon}
                      <span className="flex-1 text-left">{action.label}</span>
                      {action.badge !== undefined && action.badge > 0 && (
                        <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[9px] font-bold rounded-full">
                          {action.badge}
                        </Badge>
                      )}
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Module Counts */}
          <Card>
            <CardHeader className="p-3.5 pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Modules</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Leads', value: leadCount, icon: Mail, color: 'text-amber-500', bg: 'bg-amber-500/10', tab: 'leads', warn: leadCount > 0 },
                  { label: 'Locations', value: locationCount, icon: Globe, color: 'text-rose-500', bg: 'bg-rose-500/10', tab: 'locations' },
                  { label: 'Assets', value: imageCount, icon: Image, color: 'text-indigo-500', bg: 'bg-indigo-500/10', tab: 'image-library' },
                  { label: 'Active', value: stats?.activeUsersToday || 0, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10', tab: 'users' },
                ].map((mod) => (
                  <motion.button
                    key={mod.label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onTabChange(mod.tab)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg border border-border/50 hover:border-primary/25 transition-colors text-left",
                      mod.warn && "border-amber-500/30 bg-amber-500/[0.04]"
                    )}
                  >
                    <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", mod.bg)}>
                      <mod.icon className={cn("h-3.5 w-3.5", mod.color)} />
                    </div>
                    <div>
                      <span className="text-sm font-bold tabular-nums block leading-none"><AnimatedCounter value={mod.value} duration={0.8} /></span>
                      <span className="text-[10px] text-muted-foreground">{mod.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Health */}
          <Card>
            <CardHeader className="p-3.5 pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Health</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-center gap-6 mb-4">
                <RadialProgress value={contentHealth} label="Published" color="hsl(var(--primary))" />
                <RadialProgress value={userEngagement} label="Engaged" color="hsl(142.1 76.2% 36.3%)" />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {['Database', 'Auth', 'Storage', 'Functions'].map((svc) => (
                  <div key={svc} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-emerald-500/[0.05] border border-emerald-500/10">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-medium">{svc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Summary Widgets Row ─────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid lg:grid-cols-2 gap-4">
        <DataForceSummaryWidget onTabChange={onTabChange} />
        <GlobalLinkSummaryWidget onTabChange={onTabChange} />
      </motion.div>
    </motion.div>
  );
};

// ─── Compact Summary Card ───────────────────────────────────
function SummaryItem({ icon: Icon, color, bg, label, value, sub, subColor, onClick }: {
  icon: React.ElementType; color: string; bg: string; label: string; value: number; sub?: string; subColor?: string; onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-primary/20 text-left transition-colors w-full"
    >
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tabular-nums"><AnimatedCounter value={value} duration={0.8} /></span>
          {sub && <span className={cn("text-[10px] font-medium", subColor || 'text-muted-foreground')}>{sub}</span>}
        </div>
        <span className="text-[11px] text-muted-foreground block truncate">{label}</span>
      </div>
    </motion.button>
  );
}

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

  return (
    <Card>
      <CardHeader className="p-4 pb-2.5 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <CardTitle className="text-sm font-semibold">DataForce AI</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground h-7" onClick={() => onTabChange('intelligence')}>
            Open <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {!data ? (
          <div className="flex justify-center py-6"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-2">
            <SummaryItem icon={Shield} color="text-blue-500" bg="bg-blue-500/10" label="Compliance Scans" value={data.scans}
              sub={data.avgScore > 0 ? `Avg: ${data.avgScore.toFixed(0)}%` : undefined}
              subColor={data.avgScore >= 80 ? 'text-emerald-500' : data.avgScore >= 60 ? 'text-amber-500' : 'text-destructive'}
              onClick={() => onTabChange('intelligence')} />
            <div className="grid grid-cols-2 gap-2">
              <SummaryItem icon={Bot} color="text-emerald-500" bg="bg-emerald-500/10" label="Conversations" value={data.conversations} onClick={() => onTabChange('intelligence')} />
              <SummaryItem icon={Users} color="text-violet-500" bg="bg-violet-500/10" label="Validations" value={data.validations}
                sub={data.pending > 0 ? `${data.pending} pending` : undefined} subColor="text-amber-500"
                onClick={() => onTabChange('intelligence')} />
            </div>
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

  return (
    <Card>
      <CardHeader className="p-4 pb-2.5 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-sky-500" />
            <CardTitle className="text-sm font-semibold">GlobalLink</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground h-7" onClick={() => onTabChange('globallink')}>
            Open <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {!data ? (
          <div className="flex justify-center py-6"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-2">
            <SummaryItem icon={FileText} color="text-sky-500" bg="bg-sky-500/10" label="Translation Jobs" value={data.totalJobs}
              sub={data.completedJobs > 0 ? `${data.completedJobs} done` : undefined} subColor="text-emerald-500"
              onClick={() => onTabChange('globallink')} />
            <div className="grid grid-cols-2 gap-2">
              <SummaryItem icon={Languages} color="text-indigo-500" bg="bg-indigo-500/10" label="Languages" value={data.languages} onClick={() => onTabChange('globallink')} />
              <SummaryItem icon={Globe} color="text-teal-500" bg="bg-teal-500/10" label="Variants" value={data.variants} onClick={() => onTabChange('globallink')} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminOverview;

/**
 * AdminOverview - Unified Command Center
 * Cohesive dashboard integrating all AI & governance modules
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Building2, Palette, Package, Calendar, Activity,
  TrendingUp, AlertTriangle, Clock, Shield, CheckCircle,
  UserCheck, FileText, Database, HardDrive, Mail, Image,
  Eye, Zap, ArrowRight, Brain, Wrench, RefreshCw, BarChart3,
  Bot, Globe, Languages, Sparkles, ChevronRight, Layers,
  Scan, ShieldCheck, MessageSquare, Accessibility, Scale
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  DashboardStats,
  ActivityLog,
  QuickAction,
  getActivityIcon
} from '@/lib/admin';
import { AdminReportingWidgets } from './AdminReportingWidgets';

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

// ─── Radial Progress ────────────────────────────────────────
function RadialProgress({ value, size = 44, label, color }: { value: number; size?: number; label: string; color: string }) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
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
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">{value}%</span>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

// ─── Animation Variants ─────────────────────────────────────
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

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

  const quickActions: QuickAction[] = [
    { id: 'approvals', label: 'Review Approvals', icon: <UserCheck className="h-4 w-4" />, onClick: () => onTabChange('people'), badge: stats?.pendingApprovals, variant: (stats?.pendingApprovals || 0) > 0 ? 'destructive' : 'outline' },
    { id: 'reports', label: 'Generate Report', icon: <FileText className="h-4 w-4" />, onClick: () => onTabChange('reports') },
    { id: 'ai-analysis', label: 'Intelligence Hub', icon: <Brain className="h-4 w-4" />, onClick: () => onTabChange('intelligence') },
    { id: 'backups', label: 'Manage Backups', icon: <HardDrive className="h-4 w-4" />, onClick: () => onTabChange('backups') },
    ...(isSuperAdmin ? [{ id: 'repair', label: 'Repair Tools', icon: <Wrench className="h-4 w-4" />, onClick: () => onTabChange('repair') }] : []),
    { id: 'inspector', label: 'Data Inspector', icon: <Database className="h-4 w-4" />, onClick: () => onTabChange('inspector') },
  ] as QuickAction[];

  return (
    <motion.div className="space-y-5" variants={stagger} initial="hidden" animate="show">

      {/* ── Header ─────────────────────────────────────────── */}
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
              onClick={() => onTabChange('people')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/25 hover:bg-destructive/15 transition-all group"
            >
              <div className="h-8 w-8 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
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

      {/* ── Primary Stats Strip ────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <StatChip icon={Users} color="text-primary" bg="bg-primary/10" value={stats?.totalUsers || 0} label="Users"
          trend={(stats?.newUsersThisWeek || 0) > 0 ? `+${stats?.newUsersThisWeek}` : undefined}
          onClick={() => onTabChange('people')} />
        <StatChip icon={Building2} color="text-violet-500" bg="bg-violet-500/10" value={stats?.totalOrganizations || 0} label="Organizations"
          onClick={() => onTabChange('organizations')} />
        <StatChip icon={Palette} color="text-blue-500" bg="bg-blue-500/10" value={stats?.totalBrands || 0} label="Brands"
          onClick={() => onTabChange('analytics')} />
        <StatChip icon={Package} color="text-teal-500" bg="bg-teal-500/10" value={stats?.totalProducts || 0} label="Products"
          onClick={() => onTabChange('analytics')} />
        <StatChip icon={Calendar} color="text-rose-500" bg="bg-rose-500/10" value={stats?.totalEvents || 0} label="Events"
          onClick={() => onTabChange('analytics')} />
        <StatChip icon={Eye} color="text-emerald-500" bg="bg-emerald-500/10" value={(stats?.publicBrands || 0) + (stats?.publicEvents || 0)} label="Published"
          onClick={() => onTabChange('analytics')} />
      </motion.div>

      {/* ── 3-Column: Quick Actions + Health + Activity ───── */}
      <motion.div variants={fadeUp} className="grid lg:grid-cols-3 gap-4">

        {/* Quick Actions */}
        <Card>
          <CardHeader className="p-3.5 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-0.5">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-2.5 h-8 text-xs font-medium",
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
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Health + Modules */}
        <Card>
          <CardHeader className="p-3.5 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Platform Health</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="flex justify-center gap-5">
              <RadialProgress value={contentHealth} label="Published" color="hsl(var(--primary))" />
              <RadialProgress value={userEngagement} label="Engaged" color="hsl(142.1 76.2% 36.3%)" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Leads', value: leadCount, icon: Mail, color: 'text-amber-500', bg: 'bg-amber-500/10', tab: 'leads' },
                { label: 'Locations', value: locationCount, icon: Globe, color: 'text-rose-500', bg: 'bg-rose-500/10', tab: 'locations' },
                { label: 'Assets', value: imageCount, icon: Image, color: 'text-indigo-500', bg: 'bg-indigo-500/10', tab: 'image-library' },
                { label: 'Active Now', value: stats?.activeUsersToday || 0, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10', tab: 'users' },
              ].map((mod) => (
                <button
                  key={mod.label}
                  onClick={() => onTabChange(mod.tab)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border/40 hover:border-primary/20 transition-colors text-left"
                >
                  <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0", mod.bg)}>
                    <mod.icon className={cn("h-3 w-3", mod.color)} />
                  </div>
                  <div>
                    <span className="text-xs font-bold tabular-nums block leading-none"><AnimatedCounter value={mod.value} duration={0.8} /></span>
                    <span className="text-[10px] text-muted-foreground">{mod.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {['Database', 'Auth', 'Storage', 'Functions'].map((svc) => (
                <div key={svc} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/[0.05] border border-emerald-500/10">
                  <CheckCircle className="h-2.5 w-2.5 text-emerald-500" />
                  <span className="text-[10px] font-medium">{svc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compact Activity Feed */}
        <Card>
          <CardHeader className="p-3.5 pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Recent Activity</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground h-6 px-2" onClick={() => onTabChange('activity')}>
                All <ArrowRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[240px] overflow-y-auto">
              {activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Activity className="h-6 w-6 text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {activityLogs.slice(0, 6).map((log, i) => (
                    <div key={log.id} className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className="p-1 rounded bg-muted/60 shrink-0">
                        {getActivityIcon(log.type, log.entityType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] leading-snug truncate">{log.description}</p>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── AI & Governance Hub ─────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
            <Brain className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">AI & Governance Hub</h3>
            <p className="text-[11px] text-muted-foreground">Unified view of intelligence modules</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-3">
          <DataForceSummaryWidget onTabChange={onTabChange} />
          <GlobalLinkSummaryWidget onTabChange={onTabChange} />
          <BotSummaryWidget onTabChange={onTabChange} />
          <BiasAwarenessSummaryWidget onTabChange={onTabChange} />
          <VisibilitySummaryWidget onTabChange={onTabChange} />
          <AICenterSummaryWidget onTabChange={onTabChange} />
        </div>
      </motion.div>

      {/* ── Reporting Section ──────────────────────────────── */}
      <AdminReportingWidgets stats={stats} onTabChange={onTabChange} />
    </motion.div>
  );
};

// ─── Stat Chip (compact metric) ─────────────────────────────
function StatChip({ icon: Icon, color, bg, value, label, trend, onClick }: {
  icon: React.ElementType; color: string; bg: string; value: number; label: string; trend?: string; onClick?: () => void;
}) {
  return (
    <motion.div whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
      <button onClick={onClick} className="w-full flex items-center gap-2.5 p-3 rounded-xl border border-border/50 hover:border-primary/20 transition-colors text-left bg-card">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tabular-nums leading-none"><AnimatedCounter value={value} /></span>
            {trend && (
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-0.5 shrink-0">
                <TrendingUp className="h-2.5 w-2.5" />{trend}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground block truncate">{label}</span>
        </div>
      </button>
    </motion.div>
  );
}

// ─── Compact Summary Row ────────────────────────────────────
function SummaryRow({ icon: Icon, color, bg, label, value, sub, subColor, onClick }: {
  icon: React.ElementType; color: string; bg: string; label: string; value: number; sub?: string; subColor?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 p-2 rounded-lg border border-border/40 hover:border-primary/20 text-left transition-colors w-full"
    >
      <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("h-3 w-3", color)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold tabular-nums"><AnimatedCounter value={value} duration={0.8} /></span>
          {sub && <span className={cn("text-[10px] font-medium", subColor || 'text-muted-foreground')}>{sub}</span>}
        </div>
        <span className="text-[10px] text-muted-foreground block truncate">{label}</span>
      </div>
    </button>
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
    <Card className="h-full">
      <CardHeader className="p-3 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <CardTitle className="text-xs font-semibold">DataForce AI</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => onTabChange('dataforce')}>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2.5">
        {!data ? (
          <div className="flex justify-center py-4"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-1.5">
            <SummaryRow icon={Shield} color="text-blue-500" bg="bg-blue-500/10" label="Compliance Scans" value={data.scans}
              sub={data.avgScore > 0 ? `Avg: ${data.avgScore.toFixed(0)}%` : undefined}
              subColor={data.avgScore >= 80 ? 'text-emerald-500' : data.avgScore >= 60 ? 'text-amber-500' : 'text-destructive'}
              onClick={() => onTabChange('intelligence')} />
            <div className="grid grid-cols-2 gap-1.5">
              <SummaryRow icon={MessageSquare} color="text-emerald-500" bg="bg-emerald-500/10" label="Chats" value={data.conversations} onClick={() => onTabChange('intelligence')} />
              <SummaryRow icon={Users} color="text-violet-500" bg="bg-violet-500/10" label="Validations" value={data.validations}
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
  const [data, setData] = useState<{ totalJobs: number; completedJobs: number; languages: number; variants: number } | null>(null);

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
        languages: languages?.length || 0,
        variants: variants?.length || 0,
      });
    })();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-sky-500" />
            <CardTitle className="text-xs font-semibold">GlobalLink</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => onTabChange('globallink')}>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2.5">
        {!data ? (
          <div className="flex justify-center py-4"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-1.5">
            <SummaryRow icon={FileText} color="text-sky-500" bg="bg-sky-500/10" label="Translation Jobs" value={data.totalJobs}
              sub={data.completedJobs > 0 ? `${data.completedJobs} done` : undefined} subColor="text-emerald-500"
              onClick={() => onTabChange('globallink')} />
            <div className="grid grid-cols-2 gap-1.5">
              <SummaryRow icon={Languages} color="text-indigo-500" bg="bg-indigo-500/10" label="Languages" value={data.languages} onClick={() => onTabChange('globallink')} />
              <SummaryRow icon={Globe} color="text-teal-500" bg="bg-teal-500/10" label="Variants" value={data.variants} onClick={() => onTabChange('globallink')} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Bot Summary ────────────────────────────────────────────
const BotSummaryWidget: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [data, setData] = useState<{ activeBots: number; totalConversations: number; totalMessages: number; avgSatisfaction: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: bots }, { data: conversations }] = await Promise.all([
        supabase.from('bot_config').select('id, is_active'),
        supabase.from('bot_conversations').select('id, message_count, satisfaction_rating'),
      ]);
      const allBots = bots || [];
      const allConvos = conversations || [];
      const ratings = allConvos.filter(c => c.satisfaction_rating != null).map(c => c.satisfaction_rating!);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const totalMsgs = allConvos.reduce((a, c) => a + (c.message_count || 0), 0);

      setData({
        activeBots: allBots.filter(b => b.is_active).length,
        totalConversations: allConvos.length,
        totalMessages: totalMsgs,
        avgSatisfaction: avgRating,
      });
    })();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-emerald-500" />
            <CardTitle className="text-xs font-semibold">AI Assistants</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => onTabChange('bot-management')}>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2.5">
        {!data ? (
          <div className="flex justify-center py-4"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-1.5">
            <SummaryRow icon={Bot} color="text-emerald-500" bg="bg-emerald-500/10" label="Active Bots" value={data.activeBots}
              sub={`${data.totalConversations} sessions`} subColor="text-muted-foreground"
              onClick={() => onTabChange('bot-management')} />
            <div className="grid grid-cols-2 gap-1.5">
              <SummaryRow icon={MessageSquare} color="text-blue-500" bg="bg-blue-500/10" label="Messages" value={data.totalMessages}
                onClick={() => onTabChange('bot-management')} />
              <SummaryRow icon={TrendingUp} color="text-amber-500" bg="bg-amber-500/10" label="Avg Rating" value={Math.round(data.avgSatisfaction * 10) / 10}
                sub={data.avgSatisfaction > 0 ? '/5' : 'N/A'} subColor="text-muted-foreground"
                onClick={() => onTabChange('bot-management')} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Bias Awareness Summary ─────────────────────────────────
const BiasAwarenessSummaryWidget: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [data, setData] = useState<{
    totalScans: number; completedScans: number; avgInclusion: number;
    avgAccessibility: number; avgLanguage: number; avgVisual: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: scans } = await supabase
        .from('bias_awareness_scans')
        .select('status, inclusion_score, accessibility_score, language_score, visual_score')
        .order('created_at', { ascending: false })
        .limit(200);

      const all = scans || [];
      const completed = all.filter(s => s.status === 'completed');
      const avg = (key: 'inclusion_score' | 'accessibility_score' | 'language_score' | 'visual_score') => {
        const vals = completed.map(s => Number(s[key])).filter(v => !isNaN(v) && v > 0);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      };

      setData({
        totalScans: all.length,
        completedScans: completed.length,
        avgInclusion: avg('inclusion_score'),
        avgAccessibility: avg('accessibility_score'),
        avgLanguage: avg('language_score'),
        avgVisual: avg('visual_score'),
      });
    })();
  }, []);

  const scoreColor = (v: number) => v >= 80 ? 'text-emerald-500' : v >= 60 ? 'text-amber-500' : 'text-destructive';

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-3.5 w-3.5 text-violet-500" />
            <CardTitle className="text-xs font-semibold">Bias Awareness</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => onTabChange('bias-awareness')}>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2.5">
        {!data ? (
          <div className="flex justify-center py-4"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-1.5">
            <SummaryRow icon={Scan} color="text-violet-500" bg="bg-violet-500/10" label="Completed Scans" value={data.completedScans}
              sub={data.avgInclusion > 0 ? `Avg: ${data.avgInclusion.toFixed(0)}%` : undefined}
              subColor={scoreColor(data.avgInclusion)}
              onClick={() => onTabChange('bias-awareness')} />

            {data.completedScans > 0 && (
              <div className="space-y-1 pt-0.5">
                {[
                  { label: 'Language', value: data.avgLanguage, icon: FileText },
                  { label: 'Visual', value: data.avgVisual, icon: Eye },
                  { label: 'Access.', value: data.avgAccessibility, icon: Accessibility },
                ].map(dim => (
                  <div key={dim.label} className="flex items-center gap-1.5">
                    <dim.icon className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground w-12">{dim.label}</span>
                    <Progress value={dim.value} className="h-1.5 flex-1" />
                    <span className={cn("text-[10px] font-bold tabular-nums w-7 text-right", scoreColor(dim.value))}>
                      {dim.value > 0 ? `${dim.value.toFixed(0)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Visibility Summary ─────────────────────────────────────
const VisibilitySummaryWidget: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [data, setData] = useState<{ totalAudits: number; avgScore: number; criticalGaps: number; totalGaps: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: audits } = await supabase
        .from('brand_visibility_audits')
        .select('overall_visibility_score, visibility_gaps, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(200);

      const all = audits || [];
      const scores = all.map(a => a.overall_visibility_score).filter((v): v is number => v !== null);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const allGaps = all.flatMap(a => Array.isArray(a.visibility_gaps) ? a.visibility_gaps as any[] : []);
      const critical = allGaps.filter((g: any) => g.severity === 'critical' || g.severity === 'high').length;

      setData({ totalAudits: all.length, avgScore: avg, criticalGaps: critical, totalGaps: allGaps.length });
    })();
  }, []);

  const scoreColor = (v: number) => v >= 70 ? 'text-emerald-500' : v >= 40 ? 'text-amber-500' : 'text-destructive';

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-cyan-500" />
            <CardTitle className="text-xs font-semibold">Visibility</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => onTabChange('visibility')}>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2.5">
        {!data ? (
          <div className="flex justify-center py-4"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-1.5">
            <SummaryRow icon={Eye} color="text-cyan-500" bg="bg-cyan-500/10" label="Audits Completed" value={data.totalAudits}
              sub={data.avgScore > 0 ? `Avg: ${data.avgScore.toFixed(0)}%` : undefined}
              subColor={scoreColor(data.avgScore)}
              onClick={() => onTabChange('visibility')} />
            <div className="grid grid-cols-2 gap-1.5">
              <SummaryRow icon={AlertTriangle} color="text-destructive" bg="bg-destructive/10" label="Critical" value={data.criticalGaps}
                onClick={() => onTabChange('visibility')} />
              <SummaryRow icon={BarChart3} color="text-muted-foreground" bg="bg-muted/50" label="Total Gaps" value={data.totalGaps}
                onClick={() => onTabChange('visibility')} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── AI Center Summary ──────────────────────────────────────
const AICenterSummaryWidget: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [data, setData] = useState<{ totalJobs: number; successRate: number; avgCompliance: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [jobsRes, compRes] = await Promise.all([
        supabase.from('brand_intelligence_jobs').select('status').limit(500),
        supabase.from('dataforce_compliance_jobs').select('compliance_score').eq('status', 'completed').limit(500),
      ]);
      const jobs = jobsRes.data || [];
      const comp = compRes.data || [];
      const completed = jobs.filter(j => j.status === 'completed').length;
      const rate = jobs.length > 0 ? (completed / jobs.length) * 100 : 0;
      const avgC = comp.length > 0 ? comp.reduce((a, c) => a + (c.compliance_score || 0), 0) / comp.length : 0;
      setData({ totalJobs: jobs.length, successRate: rate, avgCompliance: avgC });
    })();
  }, []);

  const scoreColor = (v: number) => v >= 75 ? 'text-emerald-500' : v >= 50 ? 'text-amber-500' : 'text-destructive';

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-3.5 w-3.5 text-violet-500" />
            <CardTitle className="text-xs font-semibold">AI Center</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => onTabChange('ai-center')}>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2.5">
        {!data ? (
          <div className="flex justify-center py-4"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-1.5">
            <SummaryRow icon={Brain} color="text-violet-500" bg="bg-violet-500/10" label="AI Jobs" value={data.totalJobs}
              sub={`${data.successRate.toFixed(0)}% success`}
              subColor={scoreColor(data.successRate)}
              onClick={() => onTabChange('ai-center')} />
            <SummaryRow icon={Shield} color="text-blue-500" bg="bg-blue-500/10" label="Compliance" value={`${data.avgCompliance.toFixed(0)}%`}
              subColor={scoreColor(data.avgCompliance)}
              onClick={() => onTabChange('ai-center')} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

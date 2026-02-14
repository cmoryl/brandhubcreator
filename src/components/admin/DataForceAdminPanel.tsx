/**
 * DataForce Admin Panel — Full Service Hub
 * Unified command center: Overview metrics, interactive tools, and settings
 */

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  Bot,
  Users,
  Brain,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  BarChart3,
  Settings,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subMonths } from 'date-fns';
import { DataForceSettings } from './DataForceSettings';
import { ComplianceChecker, BrandAssistant, CulturalValidation, GenAITraining } from '@/components/dataforce';
import { useOrganization } from '@/contexts/OrganizationContext';

interface OrgMetrics {
  // Overall
  totalOrgs: number;
  orgsWithConfig: number;
  liveOrgs: number;
  demoOrgs: number;

  // Compliance
  totalComplianceScans: number;
  completedScans: number;
  failedScans: number;
  avgComplianceScore: number;
  scansThisMonth: number;
  scansLastMonth: number;

  // Assistant
  totalConversations: number;
  totalMessages: number;
  conversationsThisWeek: number;

  // Validation
  totalValidations: number;
  completedValidations: number;
  pendingValidations: number;
  avgValidationScore: number;

  // Training
  totalTrainingJobs: number;
  completedTraining: number;
  activeModels: number;

  // Recent compliance jobs (across all orgs)
  recentJobs: Array<{
    id: string;
    entityName: string;
    orgName: string;
    score: number;
    status: string;
    createdAt: string;
  }>;

  // Score distribution
  scoreDistribution: {
    excellent: number; // 80+
    good: number; // 60-79
    poor: number; // <60
  };
}

export const DataForceAdminPanel = () => {
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState<OrgMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const monthAgo = subMonths(now, 1);
      const twoMonthsAgo = subMonths(now, 2);
      const weekAgo = subDays(now, 7);

      // Fetch all data in parallel
      const [
        { data: configs },
        { data: complianceJobs },
        { data: validationReqs },
        { data: trainingJobs },
        { data: conversations },
        { data: orgs },
      ] = await Promise.all([
        supabase.from('dataforce_config').select('organization_id, api_mode'),
        supabase.from('dataforce_compliance_jobs').select('id, entity_name, compliance_score, status, created_at, organization_id').order('created_at', { ascending: false }).limit(500),
        supabase.from('dataforce_validation_requests').select('id, status, validation_score'),
        supabase.from('dataforce_training_jobs').select('id, status, model_id'),
        supabase.from('dataforce_assistant_conversations').select('id, messages, created_at'),
        supabase.from('organizations').select('id, name'),
      ]);

      const orgNameMap = new Map((orgs || []).map(o => [o.id, o.name]));

      // Configs
      const configCount = configs?.length || 0;
      const liveCount = configs?.filter(c => c.api_mode === 'live').length || 0;

      // Compliance
      const completed = complianceJobs?.filter(j => j.status === 'completed') || [];
      const failed = complianceJobs?.filter(j => j.status === 'failed') || [];
      const thisMonth = complianceJobs?.filter(j => new Date(j.created_at) >= monthAgo) || [];
      const lastMonth = complianceJobs?.filter(j => {
        const d = new Date(j.created_at);
        return d >= twoMonthsAgo && d < monthAgo;
      }) || [];

      const avgScore = completed.length > 0
        ? completed.reduce((acc, j) => acc + (j.compliance_score || 0), 0) / completed.length
        : 0;

      const excellent = completed.filter(j => (j.compliance_score || 0) >= 80).length;
      const good = completed.filter(j => (j.compliance_score || 0) >= 60 && (j.compliance_score || 0) < 80).length;
      const poor = completed.filter(j => (j.compliance_score || 0) < 60).length;

      // Validation
      const completedVal = validationReqs?.filter(r => r.status === 'completed') || [];
      const pendingVal = validationReqs?.filter(r => r.status === 'pending' || r.status === 'in_review') || [];
      const avgValScore = completedVal.length > 0
        ? completedVal.reduce((acc, r) => acc + (r.validation_score || 0), 0) / completedVal.length
        : 0;

      // Training
      const completedTraining = trainingJobs?.filter(j => j.status === 'completed') || [];

      // Conversations
      const weeklyConvs = conversations?.filter(c => new Date(c.created_at) >= weekAgo) || [];
      const totalMsgs = conversations?.reduce((acc, c) => {
        const msgs = c.messages as unknown as Array<unknown>;
        return acc + (Array.isArray(msgs) ? msgs.length : 0);
      }, 0) || 0;

      // Recent jobs with org names
      const recentJobs = (complianceJobs || []).slice(0, 15).map(j => ({
        id: j.id,
        entityName: j.entity_name,
        orgName: orgNameMap.get(j.organization_id || '') || 'Unknown',
        score: j.compliance_score || 0,
        status: j.status || 'unknown',
        createdAt: j.created_at,
      }));

      // Total org count
      const { count: totalOrgsCount } = await supabase
        .from('organizations').select('*', { count: 'exact', head: true });

      setMetrics({
        totalOrgs: totalOrgsCount || 0,
        orgsWithConfig: configCount,
        liveOrgs: liveCount,
        demoOrgs: configCount - liveCount,
        totalComplianceScans: complianceJobs?.length || 0,
        completedScans: completed.length,
        failedScans: failed.length,
        avgComplianceScore: avgScore,
        scansThisMonth: thisMonth.length,
        scansLastMonth: lastMonth.length,
        totalConversations: conversations?.length || 0,
        totalMessages: totalMsgs,
        conversationsThisWeek: weeklyConvs.length,
        totalValidations: validationReqs?.length || 0,
        completedValidations: completedVal.length,
        pendingValidations: pendingVal.length,
        avgValidationScore: avgValScore,
        totalTrainingJobs: trainingJobs?.length || 0,
        completedTraining: completedTraining.length,
        activeModels: completedTraining.filter(j => j.model_id).length,
        recentJobs,
        scoreDistribution: { excellent, good, poor },
      });
    } catch (error) {
      console.error('Failed to fetch DataForce admin metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 text-green-600';
    if (score >= 60) return 'bg-amber-500/10 text-amber-600';
    return 'bg-red-500/10 text-red-600';
  };

  const scansTrend = metrics
    ? metrics.scansLastMonth > 0
      ? ((metrics.scansThisMonth - metrics.scansLastMonth) / metrics.scansLastMonth * 100)
      : metrics.scansThisMonth > 0 ? 100 : 0
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            DataForce Command Center
          </h2>
          <p className="text-muted-foreground">
            Full-service AI hub — analytics, tools & configuration
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchMetrics} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1.5">
            <Shield className="h-4 w-4" />
            <span className="hidden lg:inline">Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="assistant" className="gap-1.5">
            <Bot className="h-4 w-4" />
            <span className="hidden lg:inline">Assistant</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden lg:inline">Validation</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-1.5">
            <Brain className="h-4 w-4" />
            <span className="hidden lg:inline">Training</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-4 w-4" />
            <span className="hidden lg:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : metrics ? (
            <>
              {/* Adoption Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{metrics.orgsWithConfig}</p>
                        <p className="text-xs text-muted-foreground">of {metrics.totalOrgs} orgs configured</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{metrics.liveOrgs}</p>
                        <p className="text-xs text-muted-foreground">Live API</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Clock className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{metrics.demoOrgs}</p>
                        <p className="text-xs text-muted-foreground">Demo Mode</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getScoreBg(metrics.avgComplianceScore)}`}>
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${getScoreColor(metrics.avgComplianceScore)}`}>
                          {metrics.avgComplianceScore > 0 ? `${metrics.avgComplianceScore.toFixed(0)}%` : 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">Avg Compliance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Service Usage Grid */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab('compliance')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      Compliance AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <p className="text-3xl font-bold">{metrics.completedScans}</p>
                      <div className="flex items-center gap-1 text-xs">
                        {scansTrend >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                        )}
                        <span className={scansTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {Math.abs(scansTrend).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.scansThisMonth} this month · {metrics.failedScans} failed
                    </p>
                    {metrics.completedScans > 0 && (
                      <div className="space-y-1">
                        <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                          <div className="bg-green-500 transition-all" style={{ width: `${(metrics.scoreDistribution.excellent / metrics.completedScans) * 100}%` }} />
                          <div className="bg-amber-500 transition-all" style={{ width: `${(metrics.scoreDistribution.good / metrics.completedScans) * 100}%` }} />
                          <div className="bg-red-500 transition-all" style={{ width: `${(metrics.scoreDistribution.poor / metrics.completedScans) * 100}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{metrics.scoreDistribution.excellent} excellent</span>
                          <span>{metrics.scoreDistribution.good} good</span>
                          <span>{metrics.scoreDistribution.poor} poor</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab('assistant')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Bot className="h-4 w-4 text-green-500" />
                      Brand Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-3xl font-bold">{metrics.totalConversations}</p>
                    <p className="text-xs text-muted-foreground">{metrics.totalMessages} total messages</p>
                    <p className="text-xs text-muted-foreground">{metrics.conversationsThisWeek} conversations this week</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab('validation')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      Cultural Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-3xl font-bold">{metrics.completedValidations}</p>
                    <p className="text-xs text-muted-foreground">{metrics.totalValidations} total · {metrics.pendingValidations} pending</p>
                    {metrics.avgValidationScore > 0 && (
                      <p className={`text-sm font-medium ${getScoreColor(metrics.avgValidationScore)}`}>
                        Avg: {metrics.avgValidationScore.toFixed(0)}%
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab('training')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4 text-orange-500" />
                      GenAI Training
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-3xl font-bold">{metrics.activeModels}</p>
                    <p className="text-xs text-muted-foreground">active models</p>
                    <p className="text-xs text-muted-foreground">{metrics.completedTraining} of {metrics.totalTrainingJobs} jobs completed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Compliance Jobs Table */}
              {metrics.recentJobs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Compliance Scans (All Organizations)
                    </CardTitle>
                    <CardDescription>Latest compliance check results across all organizations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entity</TableHead>
                            <TableHead>Organization</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {metrics.recentJobs.map(job => (
                            <TableRow key={job.id}>
                              <TableCell className="font-medium">{job.entityName}</TableCell>
                              <TableCell className="text-muted-foreground">{job.orgName}</TableCell>
                              <TableCell>
                                {job.status === 'completed' ? (
                                  <span className={`font-semibold ${getScoreColor(job.score)}`}>{job.score}%</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}
                                  className="capitalize"
                                >
                                  {job.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {job.status === 'failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                  {(job.status === 'pending' || job.status === 'processing') && <Clock className="h-3 w-3 mr-1" />}
                                  {job.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(job.createdAt), 'MMM d, yyyy HH:mm')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>

        {/* ===== COMPLIANCE CHECKER TAB ===== */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Brand Compliance Checker
                  </CardTitle>
                  <CardDescription>
                    Run compliance scans against brand guidelines for any entity
                  </CardDescription>
                </div>
                <Button onClick={() => setComplianceOpen(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Launch Scan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-3">
                <p>Use the Compliance Checker to automatically audit brand guides against your defined standards.</p>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics?.completedScans || 0}</p>
                    <p className="text-xs text-muted-foreground">Scans Completed</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className={`text-2xl font-bold ${getScoreColor(metrics?.avgComplianceScore || 0)}`}>
                      {metrics?.avgComplianceScore ? `${metrics.avgComplianceScore.toFixed(0)}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics?.failedScans || 0}</p>
                    <p className="text-xs text-muted-foreground">Failed Scans</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <ComplianceChecker
            open={complianceOpen}
            onOpenChange={setComplianceOpen}
            entityType="brand"
            entityId=""
            entityName="Organization-wide Scan"
            guideData={{}}
          />
        </TabsContent>

        {/* ===== BRAND ASSISTANT TAB ===== */}
        <TabsContent value="assistant" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-green-500" />
                    AI Brand Assistant
                  </CardTitle>
                  <CardDescription>
                    Multilingual chatbot for brand questions — supports 15+ languages
                  </CardDescription>
                </div>
                <Button onClick={() => setAssistantOpen(true)}>
                  <Bot className="h-4 w-4 mr-2" />
                  Open Chat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-3">
                <p>The Brand Assistant helps team members answer brand-related questions using AI trained on your guidelines.</p>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics?.totalConversations || 0}</p>
                    <p className="text-xs text-muted-foreground">Conversations</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics?.totalMessages || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Messages</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics?.conversationsThisWeek || 0}</p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <BrandAssistant
            open={assistantOpen}
            onOpenChange={setAssistantOpen}
          />
        </TabsContent>

        {/* ===== CULTURAL VALIDATION TAB ===== */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Cultural Validation Panel
                  </CardTitle>
                  <CardDescription>
                    Submit content for human-in-the-loop regional validation
                  </CardDescription>
                </div>
                <Button onClick={() => setValidationOpen(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-3">
                <p>Request cultural validation from regional panels to ensure brand content resonates across markets.</p>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics?.completedValidations || 0}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-500">{metrics?.pendingValidations || 0}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className={`text-2xl font-bold ${getScoreColor(metrics?.avgValidationScore || 0)}`}>
                      {metrics?.avgValidationScore ? `${metrics.avgValidationScore.toFixed(0)}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <CulturalValidation
            open={validationOpen}
            onOpenChange={setValidationOpen}
            entityType="brand"
            entityId=""
            entityName="Organization Validation"
            guideData={{}}
          />
        </TabsContent>

        {/* ===== GENAI TRAINING TAB ===== */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-orange-500" />
                    GenAI Brand Training
                  </CardTitle>
                  <CardDescription>
                    Train AI models on your brand voice, generate branded content
                  </CardDescription>
                </div>
                <Button onClick={() => setTrainingOpen(true)}>
                  <Brain className="h-4 w-4 mr-2" />
                  Launch Studio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-3">
                <p>Fine-tune AI models on your brand voice, visual style, and content patterns to generate on-brand material.</p>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics?.activeModels || 0}</p>
                    <p className="text-xs text-muted-foreground">Active Models</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics?.completedTraining || 0}</p>
                    <p className="text-xs text-muted-foreground">Jobs Done</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics?.totalTrainingJobs || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Jobs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <GenAITraining
            open={trainingOpen}
            onOpenChange={setTrainingOpen}
            entityType="brand"
            entityId=""
            entityName="Organization Training"
          />
        </TabsContent>

        {/* ===== SETTINGS TAB ===== */}
        <TabsContent value="settings" className="space-y-6">
          <DataForceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

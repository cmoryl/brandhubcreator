/**
 * DataForce Dashboard Widget
 * Analytics and metrics for DataForce services
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Bot, 
  Users, 
  Brain,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useDataForceConfig } from '@/hooks/dataforce';

interface DashboardMetrics {
  complianceJobs: {
    total: number;
    completed: number;
    avgScore: number;
    recentJobs: Array<{
      id: string;
      entityName: string;
      score: number;
      status: string;
      createdAt: string;
    }>;
  };
  validationRequests: {
    total: number;
    completed: number;
    pending: number;
    avgScore: number;
  };
  trainingJobs: {
    total: number;
    completed: number;
    activeModels: number;
  };
  assistantConversations: {
    total: number;
    messagesThisWeek: number;
  };
}

export const DataForceDashboard = () => {
  const { organization } = useOrganization();
  const { config, isDemo, isServiceEnabled } = useDataForceConfig({
    organizationId: organization?.id || '',
  });
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organization?.id) return;
    fetchMetrics();
  }, [organization?.id]);

  const fetchMetrics = async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch compliance jobs
      const { data: complianceData } = await supabase
        .from('dataforce_compliance_jobs')
        .select('id, entity_name, compliance_score, status, created_at')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch validation requests
      const { data: validationData } = await supabase
        .from('dataforce_validation_requests')
        .select('id, status, validation_score')
        .eq('organization_id', organization.id);

      // Fetch training jobs
      const { data: trainingData } = await supabase
        .from('dataforce_training_jobs')
        .select('id, status, model_id')
        .eq('organization_id', organization.id);

      // Fetch conversations
      const { data: conversationData } = await supabase
        .from('dataforce_assistant_conversations')
        .select('id, messages, created_at')
        .eq('organization_id', organization.id);

      const completedCompliance = complianceData?.filter(j => j.status === 'completed') || [];
      const completedValidation = validationData?.filter(r => r.status === 'completed') || [];
      const completedTraining = trainingData?.filter(j => j.status === 'completed') || [];

      // Calculate week-old date
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyMessages = conversationData?.reduce((acc, conv) => {
        if (new Date(conv.created_at) >= weekAgo) {
          const messages = conv.messages as unknown as Array<unknown>;
          return acc + (Array.isArray(messages) ? messages.length : 0);
        }
        return acc;
      }, 0) || 0;

      setMetrics({
        complianceJobs: {
          total: complianceData?.length || 0,
          completed: completedCompliance.length,
          avgScore: completedCompliance.length > 0
            ? completedCompliance.reduce((acc, j) => acc + (j.compliance_score || 0), 0) / completedCompliance.length
            : 0,
          recentJobs: (complianceData || []).slice(0, 5).map(j => ({
            id: j.id,
            entityName: j.entity_name,
            score: j.compliance_score || 0,
            status: j.status || 'unknown',
            createdAt: j.created_at,
          })),
        },
        validationRequests: {
          total: validationData?.length || 0,
          completed: completedValidation.length,
          pending: (validationData?.filter(r => r.status === 'pending') || []).length,
          avgScore: completedValidation.length > 0
            ? completedValidation.reduce((acc, r) => acc + (r.validation_score || 0), 0) / completedValidation.length
            : 0,
        },
        trainingJobs: {
          total: trainingData?.length || 0,
          completed: completedTraining.length,
          activeModels: completedTraining.filter(j => j.model_id).length,
        },
        assistantConversations: {
          total: conversationData?.length || 0,
          messagesThisWeek: weeklyMessages,
        },
      });
    } catch (error) {
      console.error('Failed to fetch DataForce metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  if (!organization?.id) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">DataForce Integration</p>
            <p className="text-sm text-muted-foreground">
              {isDemo ? 'Running in Demo Mode' : 'Connected to DataForce API'}
            </p>
          </div>
        </div>
        <Badge variant={isDemo ? 'secondary' : 'default'}>
          {isDemo ? 'Demo' : 'Live'}
        </Badge>
      </div>

      {/* Service Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Compliance AI */}
        <Card className={!isServiceEnabled('compliance') ? 'opacity-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-12 animate-pulse bg-muted rounded" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {metrics?.complianceJobs.completed || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  scans completed
                </p>
                {metrics?.complianceJobs.avgScore ? (
                  <p className={`text-sm mt-1 ${getScoreColor(metrics.complianceJobs.avgScore)}`}>
                    Avg: {metrics.complianceJobs.avgScore.toFixed(0)}%
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        {/* Brand Assistant */}
        <Card className={!isServiceEnabled('assistant') ? 'opacity-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-green-500" />
              Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-12 animate-pulse bg-muted rounded" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {metrics?.assistantConversations.total || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  conversations
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics?.assistantConversations.messagesThisWeek || 0} msgs this week
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cultural Validation */}
        <Card className={!isServiceEnabled('validation') ? 'opacity-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-12 animate-pulse bg-muted rounded" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {metrics?.validationRequests.completed || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  requests completed
                </p>
                {metrics?.validationRequests.pending ? (
                  <p className="text-sm text-amber-500 mt-1">
                    {metrics.validationRequests.pending} pending
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        {/* GenAI Training */}
        <Card className={!isServiceEnabled('training') ? 'opacity-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-orange-500" />
              Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-12 animate-pulse bg-muted rounded" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {metrics?.trainingJobs.activeModels || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  active models
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics?.trainingJobs.completed || 0} jobs completed
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {metrics?.complianceJobs.recentJobs && metrics.complianceJobs.recentJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Compliance Scans
            </CardTitle>
            <CardDescription>
              Latest brand compliance check results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.complianceJobs.recentJobs.map(job => (
                <div 
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {job.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : job.status === 'failed' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{job.entityName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {job.status === 'completed' && (
                      <div className="text-right">
                        <p className={`font-semibold ${getScoreColor(job.score)}`}>
                          {job.score}%
                        </p>
                      </div>
                    )}
                    <Badge 
                      variant={job.status === 'completed' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {job.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

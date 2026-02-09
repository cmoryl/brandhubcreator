/**
 * GlobalLinkAdminSection - Main admin section for GlobalLink localization management
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe2, Languages, Settings2, History, Zap } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLocalization } from '@/hooks/useLocalization';
import { GlobalLinkConfigPanel } from './GlobalLinkConfigPanel';
import { TargetLanguagesPanel } from './TargetLanguagesPanel';
import { TranslationJobsPanel } from './TranslationJobsPanel';
import { QuickTranslatePanel } from './QuickTranslatePanel';

export const GlobalLinkAdminSection: React.FC = () => {
  const { organization } = useOrganization();
  const { config, targetLanguages, jobs, isLoading } = useLocalization(organization?.id);
  const [activeTab, setActiveTab] = useState('overview');

  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Globe2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">GlobalLink Localization</h2>
              <p className="text-muted-foreground">
                Translate and localize your brand content across markets
              </p>
            </div>
          </div>
        </div>
        <Badge 
          variant={config?.api_mode === 'live' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {config?.api_mode === 'live' ? 'Live Mode' : 'Demo Mode'}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {targetLanguages.filter(l => l.is_active).length}
              </span>
              <span className="text-muted-foreground text-sm">
                / {targetLanguages.length} configured
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{pendingJobs}</span>
              <span className="text-muted-foreground text-sm">in queue</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{completedJobs}</span>
              <span className="text-muted-foreground text-sm">translations</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${
                config?.api_mode === 'live' ? 'bg-green-500' : 'bg-amber-500'
              }`} />
              <span className="text-sm font-medium">
                {config?.api_mode === 'live' ? 'Connected' : 'Demo'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <Globe2 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="languages" className="gap-2">
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">Languages</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Jobs</span>
            {pendingJobs > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {pendingJobs}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <QuickTranslatePanel />
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          <TargetLanguagesPanel />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <TranslationJobsPanel />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <GlobalLinkConfigPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlobalLinkAdminSection;

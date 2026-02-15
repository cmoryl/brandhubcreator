/**
 * PeopleHub
 * Unified admin area merging Users & Members, Approvals, and Lead Submissions
 */

import { Users, UserCheck, Mail } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UsersAndMembersTab } from './UsersAndMembersTab';
import { UserApprovalManager } from './UserApprovalManager';
import { LeadSubmissionsPanel } from './LeadSubmissionsPanel';

interface PeopleHubProps {
  pendingApprovals?: number;
  defaultTab?: string;
}

export function PeopleHub({ pendingApprovals = 0, defaultTab = 'users' }: PeopleHubProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          People Management
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage users, review approvals, and track lead submissions
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users & Members
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Approvals
            {pendingApprovals > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs ml-1">
                {pendingApprovals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Mail className="h-4 w-4" />
            Lead Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersAndMembersTab />
        </TabsContent>

        <TabsContent value="approvals">
          <UserApprovalManager />
        </TabsContent>

        <TabsContent value="leads">
          <LeadSubmissionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

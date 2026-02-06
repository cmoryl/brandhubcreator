import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserCheck, UserX, Clock, RefreshCw, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminOrganizations } from '@/hooks/useAdminOrganizations';
import { logUserApproved, logUserRejected, logActionFailed } from '@/lib/auditLog';

interface PendingUser {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  is_approved: boolean;
  approved_at: string | null;
}

export function UserApprovalManager() {
  const { user } = useAuth();
  const { organizations, isLoading: orgsLoading } = useAdminOrganizations();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject';
    userId: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch pending users
      const { data: pending, error: pendingError } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name, created_at, is_approved, approved_at')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;

      // Fetch recently approved users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: approved, error: approvedError } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name, created_at, is_approved, approved_at')
        .eq('is_approved', true)
        .gte('approved_at', thirtyDaysAgo.toISOString())
        .order('approved_at', { ascending: false });

      if (approvedError) throw approvedError;

      setPendingUsers(pending || []);
      setApprovedUsers(approved || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    const userEmail = confirmDialog?.email || 'Unknown';
    try {
      // First, approve the user
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the approval
      await logUserApproved(userId, userEmail);

      // If an organization is selected, add user as a member
      if (selectedOrgId) {
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: selectedOrgId,
            user_id: userId,
            role: 'member',
            invite_accepted_at: new Date().toISOString(),
          });

        if (memberError) {
          console.error('Error adding user to organization:', memberError);
          toast.warning('User approved but failed to add to organization');
        } else {
          const orgName = organizations.find(o => o.id === selectedOrgId)?.name;
          toast.success(`User approved and added to ${orgName}`);
        }
      } else {
        toast.success('User approved successfully');
      }

      setSelectedOrgId('');
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      await logActionFailed('user', 'approve', userEmail, String(error), userId);
      toast.error('Failed to approve user');
    }
    setConfirmDialog(null);
  };

  const handleReject = async (userId: string) => {
    const userEmail = confirmDialog?.email || 'Unknown';
    try {
      // For rejection, we'll keep the user but mark them as rejected
      // Alternatively, you could delete the profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Log the rejection
      await logUserRejected(userId, userEmail, 'User registration rejected by admin');

      toast.success('User rejected and removed');
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      await logActionFailed('user', 'reject', userEmail, String(error), userId);
      toast.error('Failed to reject user');
    }
    setConfirmDialog(null);
  };

  const handleRevokeApproval = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: false,
          approved_at: null,
          approved_by: null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User approval revoked');
      fetchUsers();
    } catch (error) {
      console.error('Error revoking approval:', error);
      toast.error('Failed to revoke approval');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} awaiting approval
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
              <p>No pending approvals</p>
              <p className="text-sm">All users have been reviewed</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Signed Up</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email || 'Unknown'}</TableCell>
                      <TableCell>{u.display_name || '—'}</TableCell>
                      <TableCell>{format(new Date(u.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1"
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                action: 'approve',
                                userId: u.user_id,
                                email: u.email || 'this user',
                              })
                            }
                          >
                            <UserCheck className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                action: 'reject',
                                userId: u.user_id,
                                email: u.email || 'this user',
                              })
                            }
                          >
                            <UserX className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Recently Approved */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Recently Approved</CardTitle>
              <CardDescription>Users approved in the last 30 days</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {approvedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No recent approvals</p>
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email || 'Unknown'}</TableCell>
                      <TableCell>
                        {u.approved_at
                          ? format(new Date(u.approved_at), 'MMM d, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          Approved
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRevokeApproval(u.user_id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog?.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog(null);
            setSelectedOrgId('');
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'approve' ? 'Approve User' : 'Reject User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'approve' ? (
                <>
                  Are you sure you want to approve <strong>{confirmDialog?.email}</strong>? 
                  They will gain full access to the platform.
                </>
              ) : (
                <>
                  Are you sure you want to reject <strong>{confirmDialog?.email}</strong>? 
                  Their account will be removed and they will need to sign up again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Organization Assignment - Only show for approve action */}
          {confirmDialog?.action === 'approve' && (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="org-select" className="text-sm font-medium">
                  Assign to Organization (Optional)
                </Label>
              </div>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger id="org-select" className="w-full">
                  <SelectValue placeholder="Select an organization..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No organization</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOrgId && (
                <p className="text-xs text-muted-foreground">
                  User will be added as a <strong>member</strong> of this organization.
                </p>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmDialog?.action === 'reject'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
              onClick={() => {
                if (confirmDialog?.action === 'approve') {
                  handleApprove(confirmDialog.userId);
                } else if (confirmDialog?.action === 'reject') {
                  handleReject(confirmDialog.userId);
                }
              }}
            >
              {confirmDialog?.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

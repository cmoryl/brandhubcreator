/**
 * MembersManager Component
 * Admin panel for managing organization members across all organizations
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Building2, Crown, Shield, User, 
  MoreHorizontal, UserMinus, RefreshCw, Mail, Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MemberData {
  id: string;
  user_id: string | null;
  invited_email: string | null;
  role: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  invite_accepted_at: string | null;
  invite_expires_at: string | null;
  created_at: string;
  user_email?: string;
}

interface OrgOption {
  id: string;
  name: string;
  slug: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="h-3 w-3" />,
  admin: <Shield className="h-3 w-3" />,
  member: <User className="h-3 w-3" />,
  viewer: <User className="h-3 w-3" />,
};

const roleColors: Record<string, string> = {
  owner: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  admin: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  member: 'bg-green-500/10 text-green-600 border-green-500/30',
  viewer: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
};

export const MembersManager = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [memberToRemove, setMemberToRemove] = useState<MemberData | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchMembers(), fetchOrganizations()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load members data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    // Fetch all organization members
    const { data: membersData, error: membersError } = await supabase
      .from('organization_members')
      .select('id, user_id, invited_email, role, organization_id, invite_accepted_at, invite_expires_at, created_at')
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return;
    }

    // Fetch organizations for names
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name, slug');

    const orgMap = new Map(orgsData?.map(o => [o.id, { name: o.name, slug: o.slug }]) || []);

    // Fetch profiles for user emails
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, email');

    const emailMap = new Map(profilesData?.map(p => [p.user_id, p.email]) || []);

    const formattedMembers: MemberData[] = (membersData || []).map(m => {
      const org = orgMap.get(m.organization_id);
      return {
        id: m.id,
        user_id: m.user_id,
        invited_email: m.invited_email,
        role: m.role,
        organization_id: m.organization_id,
        organization_name: org?.name || 'Unknown',
        organization_slug: org?.slug || '',
        invite_accepted_at: m.invite_accepted_at,
        invite_expires_at: m.invite_expires_at,
        created_at: m.created_at,
        user_email: m.user_id ? emailMap.get(m.user_id) || undefined : undefined,
      };
    });

    setMembers(formattedMembers);
  };

  const fetchOrganizations = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name');

    setOrganizations(data || []);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberToRemove.id);

    if (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } else {
      toast.success('Member removed successfully');
      fetchMembers();
    }

    setMemberToRemove(null);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } else {
      toast.success('Role updated successfully');
      fetchMembers();
    }
  };

  const getMemberEmail = (member: MemberData) => {
    return member.user_email || member.invited_email || 'Unknown';
  };

  const getMemberStatus = (member: MemberData) => {
    if (member.user_id && member.invite_accepted_at) {
      return { label: 'Active', variant: 'default' as const };
    }
    if (member.invited_email && !member.user_id) {
      const isExpired = member.invite_expires_at && new Date(member.invite_expires_at) < new Date();
      if (isExpired) {
        return { label: 'Expired', variant: 'destructive' as const };
      }
      return { label: 'Pending', variant: 'secondary' as const };
    }
    return { label: 'Active', variant: 'default' as const };
  };

  // Filtering
  const filteredMembers = members.filter(m => {
    const email = getMemberEmail(m).toLowerCase();
    const matchesSearch = email.includes(searchTerm.toLowerCase()) ||
      m.organization_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrg = orgFilter === 'all' || m.organization_id === orgFilter;
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesOrg && matchesRole;
  });

  // Stats
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.user_id && m.invite_accepted_at).length;
  const pendingInvites = members.filter(m => m.invited_email && !m.user_id).length;
  const ownerCount = members.filter(m => m.role === 'owner').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Members</CardDescription>
            <CardTitle className="text-2xl">{totalMembers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Members</CardDescription>
            <CardTitle className="text-2xl text-green-600">{activeMembers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Invites</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{pendingInvites}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Organization Owners</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{ownerCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organization Members
              </CardTitle>
              <CardDescription>
                Manage members across all organizations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or organization..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No members found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => {
                    const status = getMemberStatus(member);
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{getMemberEmail(member)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-left"
                            onClick={() => navigate(`/org/${member.organization_slug}`)}
                          >
                            {member.organization_name}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`gap-1 ${roleColors[member.role] || ''}`}
                          >
                            {roleIcons[member.role]}
                            <span className="capitalize">{member.role}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(member.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/org/${member.organization_slug}/settings`)}>
                                <Building2 className="h-4 w-4 mr-2" />
                                Org Settings
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {member.role !== 'owner' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'admin')}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Make Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'member')}>
                                    <User className="h-4 w-4 mr-2" />
                                    Make Member
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'viewer')}>
                                    <User className="h-4 w-4 mr-2" />
                                    Make Viewer
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => setMemberToRemove(member)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Remove Member
                                  </DropdownMenuItem>
                                </>
                              )}
                              {member.role === 'owner' && (
                                <DropdownMenuItem disabled className="text-muted-foreground">
                                  <Crown className="h-4 w-4 mr-2" />
                                  Cannot modify owner
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToRemove && getMemberEmail(memberToRemove)}</strong> from{' '}
              <strong>{memberToRemove?.organization_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

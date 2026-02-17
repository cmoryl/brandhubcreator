/**
 * UsersAndMembersTab
 * Unified admin component consolidating Users + Org Members management
 * Super admin capabilities: create users, delete users, reset passwords, change roles
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Building2, Crown, Shield, User,
  MoreHorizontal, UserMinus, RefreshCw, Mail, Calendar,
  TrendingDown, UserPlus, ChevronDown, ChevronRight, Trash2, KeyRound
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ──────────────────────────────────────────────

interface UserRow {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  role: string;
  organizations: number;
  brands: number;
  memberships: MembershipRow[];
}

interface MembershipRow {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  role: string;
  invite_accepted_at: string | null;
  invite_expires_at: string | null;
  created_at: string;
}

interface PendingInvite {
  id: string;
  invited_email: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  role: string;
  invite_expires_at: string | null;
  created_at: string;
}

interface OrgOption { id: string; name: string; slug: string; }

// ── Helpers ────────────────────────────────────────────

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Shield className="h-3 w-3" />,
  admin: <Shield className="h-3 w-3" />,
  owner: <Crown className="h-3 w-3" />,
  member: <User className="h-3 w-3" />,
  viewer: <User className="h-3 w-3" />,
  user: <User className="h-3 w-3" />,
};

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  admin: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  owner: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  member: 'bg-green-500/10 text-green-600 border-green-500/30',
  viewer: 'bg-muted text-muted-foreground border-border',
  user: 'bg-muted text-muted-foreground border-border',
};

// ── Component ──────────────────────────────────────────

export function UsersAndMembersTab() {
  const navigate = useNavigate();
  const { isSuperAdmin, user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; email: string; orgName: string } | null>(null);
  const [subTab, setSubTab] = useState<'users' | 'pending'>('users');

  // Super admin dialogs
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', role: 'user', organizationId: '', orgRole: 'member' });
  const [isCreating, setIsCreating] = useState(false);

  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showResetPassword, setShowResetPassword] = useState<{ id: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchUsersAndMembers(), fetchOrganizations()]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    const { data } = await supabase.from('organizations').select('id, name, slug').order('name');
    setOrganizations(data || []);
  };

  const fetchUsersAndMembers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('user_id, email, created_at').order('created_at', { ascending: false });
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');
    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
    const { data: memberships } = await supabase.from('organization_members').select('id, user_id, invited_email, role, organization_id, invite_accepted_at, invite_expires_at, created_at');
    const { data: orgs } = await supabase.from('organizations').select('id, name, slug');
    const orgMap = new Map(orgs?.map(o => [o.id, { name: o.name, slug: o.slug }]) || []);
    const { data: brandData } = await supabase.from('brands').select('user_id');
    const brandCount = new Map<string, number>();
    brandData?.forEach(b => brandCount.set(b.user_id, (brandCount.get(b.user_id) || 0) + 1));

    const userMap = new Map<string, UserRow>();
    for (const p of profiles || []) {
      userMap.set(p.user_id, {
        id: p.user_id,
        user_id: p.user_id,
        email: p.email || 'Unknown',
        created_at: p.created_at,
        role: roleMap.get(p.user_id) || 'user',
        organizations: 0,
        brands: brandCount.get(p.user_id) || 0,
        memberships: [],
      });
    }

    const pending: PendingInvite[] = [];
    for (const m of memberships || []) {
      const org = orgMap.get(m.organization_id);
      const orgName = org?.name || 'Unknown';
      const orgSlug = org?.slug || '';

      if (m.user_id && userMap.has(m.user_id)) {
        const u = userMap.get(m.user_id)!;
        u.organizations += 1;
        u.memberships.push({
          id: m.id,
          organization_id: m.organization_id,
          organization_name: orgName,
          organization_slug: orgSlug,
          role: m.role,
          invite_accepted_at: m.invite_accepted_at,
          invite_expires_at: m.invite_expires_at,
          created_at: m.created_at,
        });
      } else if (m.invited_email && !m.user_id) {
        pending.push({
          id: m.id,
          invited_email: m.invited_email,
          organization_id: m.organization_id,
          organization_name: orgName,
          organization_slug: orgSlug,
          role: m.role,
          invite_expires_at: m.invite_expires_at,
          created_at: m.created_at,
        });
      }
    }

    setUsers(Array.from(userMap.values()));
    setPendingInvites(pending);
  };

  // ── Actions ─────────────────

  const promoteToAdmin = async (userId: string) => {
    const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' });
    if (error) { toast.error('Failed to promote user'); return; }
    toast.success('User promoted to admin');
    fetchUsersAndMembers();
  };

  const demoteFromAdmin = async (userId: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);
    if (error) { toast.error('Failed to demote user'); return; }
    toast.success('User demoted to regular user');
    fetchUsersAndMembers();
  };

  const promoteToSuperAdmin = async (userId: string) => {
    const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role: 'super_admin' }, { onConflict: 'user_id' });
    if (error) { toast.error('Failed to promote to super admin'); return; }
    toast.success('User promoted to Super Admin');
    fetchUsersAndMembers();
  };

  const demoteFromSuperAdmin = async (userId: string) => {
    const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' });
    if (error) { toast.error('Failed to demote from super admin'); return; }
    toast.success('User demoted to Admin');
    fetchUsersAndMembers();
  };

  const handleOrgRoleChange = async (membershipId: string, newRole: string) => {
    const { error } = await supabase.from('organization_members').update({ role: newRole }).eq('id', membershipId);
    if (error) { toast.error('Failed to update role'); return; }
    toast.success('Organization role updated');
    fetchUsersAndMembers();
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    const { error } = await supabase.from('organization_members').delete().eq('id', memberToRemove.id);
    if (error) { toast.error('Failed to remove member'); } else { toast.success('Member removed'); }
    setMemberToRemove(null);
    fetchUsersAndMembers();
  };

  // ── Super Admin: Create User ─────────────────

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error('Email and password are required');
      return;
    }
    if (createForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          organizationId: createForm.organizationId || undefined,
          orgRole: createForm.orgRole,
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Failed to create user');
        return;
      }
      toast.success(`User ${createForm.email} created successfully`);
      setShowCreateUser(false);
      setCreateForm({ email: '', password: '', role: 'user', organizationId: '', orgRole: 'member' });
      fetchAll();
    } catch (err) {
      toast.error('Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Super Admin: Delete User ─────────────────

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userToDelete.id,
      });
      if (error) {
        toast.error(error.message || 'Failed to delete user');
        return;
      }
      toast.success(`User ${userToDelete.email} deleted`);
      setUserToDelete(null);
      fetchAll();
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Super Admin: Reset Password ─────────────────

  const handleResetPassword = async () => {
    if (!showResetPassword || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId: showResetPassword.id,
          newPassword,
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Failed to reset password');
        return;
      }
      toast.success(`Password reset for ${showResetPassword.email}`);
      setShowResetPassword(null);
      setNewPassword('');
    } catch (err) {
      toast.error('Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  // ── Filtering ───────────────

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesOrg = orgFilter === 'all' || u.memberships.some(m => m.organization_id === orgFilter);
      return matchesSearch && matchesRole && matchesOrg;
    });
  }, [users, searchTerm, roleFilter, orgFilter]);

  const filteredPending = useMemo(() => {
    return pendingInvites.filter(p => {
      const matchesSearch = p.invited_email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOrg = orgFilter === 'all' || p.organization_id === orgFilter;
      return matchesSearch && matchesOrg;
    });
  }, [pendingInvites, searchTerm, orgFilter]);

  // ── Stats ───────────────────

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
  const totalMemberships = users.reduce((sum, u) => sum + u.memberships.length, 0);

  // ── Render ──────────────────

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
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl">{totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-2xl text-primary">{adminCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Org Memberships</CardDescription>
            <CardTitle className="text-2xl">{totalMemberships}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Invites</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{pendingInvites.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users & Members
              </CardTitle>
              <CardDescription>
                Manage platform users and their organization memberships
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <Button size="sm" onClick={() => setShowCreateUser(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create User
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2">
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
                placeholder="Search by email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
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
          </div>

          {/* Sub-tabs */}
          <Tabs value={subTab} onValueChange={(v) => setSubTab(v as 'users' | 'pending')} className="pt-3">
            <TabsList className="h-9">
              <TabsTrigger value="users" className="gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5" />
                Users ({filteredUsers.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5" />
                Pending Invites ({filteredPending.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {subTab === 'users' ? (
            <ScrollArea className="h-[540px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Platform Role</TableHead>
                    <TableHead>Organizations</TableHead>
                    <TableHead>Brands</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <>
                        <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}>
                          <TableCell className="w-8 px-2">
                            {u.memberships.length > 0 ? (
                              expandedUserId === u.id
                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            ) : <span className="w-4" />}
                          </TableCell>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${roleColors[u.role] || roleColors.user}`}>
                              {roleIcons[u.role] || roleIcons.user}
                              <span className="capitalize">{u.role.replace('_', ' ')}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{u.organizations}</TableCell>
                          <TableCell>{u.brands}</TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(u.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {/* Role management */}
                                {isSuperAdmin && u.role === 'admin' && (
                                  <DropdownMenuItem onClick={() => promoteToSuperAdmin(u.id)}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Promote to Super Admin
                                  </DropdownMenuItem>
                                )}
                                {isSuperAdmin && u.role === 'super_admin' && u.id !== user?.id && (
                                  <DropdownMenuItem onClick={() => demoteFromSuperAdmin(u.id)}>
                                    <TrendingDown className="h-4 w-4 mr-2" />
                                    Demote to Admin
                                  </DropdownMenuItem>
                                )}
                                {u.role === 'admin' || u.role === 'super_admin' ? (
                                  u.role !== 'super_admin' && (
                                    <DropdownMenuItem onClick={() => demoteFromAdmin(u.id)}>
                                      <TrendingDown className="h-4 w-4 mr-2" />
                                      Demote to User
                                    </DropdownMenuItem>
                                  )
                                ) : (
                                  <DropdownMenuItem onClick={() => promoteToAdmin(u.id)}>
                                    <Crown className="h-4 w-4 mr-2" />
                                    Promote to Admin
                                  </DropdownMenuItem>
                                )}

                                {/* Super admin actions: Reset Password & Delete */}
                                {isSuperAdmin && u.id !== user?.id && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setShowResetPassword({ id: u.id, email: u.email })}>
                                      <KeyRound className="h-4 w-4 mr-2" />
                                      Reset Password
                                    </DropdownMenuItem>
                                    {u.role !== 'super_admin' && u.role !== 'admin' && (
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => setUserToDelete({ id: u.id, email: u.email })}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete User
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Memberships */}
                        {expandedUserId === u.id && u.memberships.length > 0 && (
                          <TableRow key={`${u.id}-memberships`} className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={7} className="p-0">
                              <div className="px-8 py-3 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Organization Memberships</p>
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-0 hover:bg-transparent">
                                      <TableHead className="h-8 text-xs">Organization</TableHead>
                                      <TableHead className="h-8 text-xs">Org Role</TableHead>
                                      <TableHead className="h-8 text-xs">Status</TableHead>
                                      <TableHead className="h-8 text-xs">Since</TableHead>
                                      <TableHead className="h-8 text-xs text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {u.memberships.map((m) => {
                                      const isActive = !!m.invite_accepted_at;
                                      return (
                                        <TableRow key={m.id} className="border-0 hover:bg-muted/50">
                                          <TableCell className="py-1.5">
                                            <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate(`/org/${m.organization_slug}`)}>
                                              {m.organization_name}
                                            </Button>
                                          </TableCell>
                                          <TableCell className="py-1.5">
                                            <Badge variant="outline" className={`gap-1 text-xs ${roleColors[m.role] || ''}`}>
                                              {roleIcons[m.role]}
                                              <span className="capitalize">{m.role}</span>
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="py-1.5">
                                            <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                                              {isActive ? 'Active' : 'Pending'}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="py-1.5 text-xs text-muted-foreground">
                                            {format(new Date(m.created_at), 'MMM d, yyyy')}
                                          </TableCell>
                                          <TableCell className="py-1.5 text-right">
                                            {m.role !== 'owner' && (
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem onClick={() => handleOrgRoleChange(m.id, 'admin')}>
                                                    <Shield className="h-4 w-4 mr-2" />
                                                    Make Admin
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem onClick={() => handleOrgRoleChange(m.id, 'member')}>
                                                    <User className="h-4 w-4 mr-2" />
                                                    Make Member
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem onClick={() => handleOrgRoleChange(m.id, 'viewer')}>
                                                    <User className="h-4 w-4 mr-2" />
                                                    Make Viewer
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setMemberToRemove({ id: m.id, email: u.email, orgName: m.organization_name })}
                                                  >
                                                    <UserMinus className="h-4 w-4 mr-2" />
                                                    Remove
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            /* Pending Invites */
            <ScrollArea className="h-[540px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No pending invites
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPending.map((p) => {
                      const isExpired = p.invite_expires_at && new Date(p.invite_expires_at) < new Date();
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.invited_email}</TableCell>
                          <TableCell>
                            <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/org/${p.organization_slug}`)}>
                              {p.organization_name}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${roleColors[p.role] || ''}`}>
                              {roleIcons[p.role]}
                              <span className="capitalize">{p.role}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(p.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            {p.invite_expires_at ? (
                              <Badge variant={isExpired ? 'destructive' : 'secondary'} className="text-xs">
                                {isExpired ? 'Expired' : format(new Date(p.invite_expires_at), 'MMM d')}
                              </Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setMemberToRemove({ id: p.id, email: p.invited_email, orgName: p.organization_name })}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{memberToRemove?.email}</strong> from <strong>{memberToRemove?.orgName}</strong>? This cannot be undone.
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

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{userToDelete?.email}</strong>? This will remove their profile, roles, and all organization memberships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Create a new platform user with an auto-confirmed email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={createForm.password}
                onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Platform Role</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm(f => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Organization (optional)</Label>
              <Select value={createForm.organizationId || 'none'} onValueChange={(v) => setCreateForm(f => ({ ...f, organizationId: v === 'none' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="No organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No organization</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createForm.organizationId && (
              <div className="space-y-2">
                <Label>Organization Role</Label>
                <Select value={createForm.orgRole} onValueChange={(v) => setCreateForm(f => ({ ...f, orgRole: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUser(false)} disabled={isCreating}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!showResetPassword} onOpenChange={() => { setShowResetPassword(null); setNewPassword(''); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{showResetPassword?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowResetPassword(null); setNewPassword(''); }} disabled={isResetting}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={isResetting || newPassword.length < 6}>
              {isResetting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

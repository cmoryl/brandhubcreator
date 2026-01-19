import { useState } from 'react';
import { UserPlus, Mail, Loader2, Users, Crown, Shield, Eye, Trash2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');

type MemberRole = 'admin' | 'member' | 'viewer';

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: Eye,
};

const roleColors = {
  owner: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  member: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  viewer: 'bg-muted text-muted-foreground border-border',
};

interface InviteMembersDialogProps {
  /** If true, renders as a standalone button instead of a dropdown menu item */
  asButton?: boolean;
}

/**
 * InviteMembersDialog - A dialog for managing team members
 * 
 * This component can render either as a menu-item-style button (for dropdowns)
 * or as a standalone button. It manages its own dialog state internally.
 */
export const InviteMembersDialog = ({ asButton = false }: InviteMembersDialogProps) => {
  const { organization, members, userRole, inviteMember, removeMember, updateMemberRole } = useOrganization();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('member');
  const [isLoading, setIsLoading] = useState(false);

  const canManageMembers = userRole === 'owner' || userRole === 'admin';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Invalid Email',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    // Check if already invited
    const existingMember = members.find(m => m.invitedEmail === email || m.userId === email);
    if (existingMember) {
      toast({
        title: 'Already Invited',
        description: 'This email has already been invited to the organization.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await inviteMember(email, role);
      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${email}`,
      });
      setEmail('');
      setRole('member');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (memberId: string, memberRole: string) => {
    if (memberRole === 'owner') {
      toast({
        title: 'Cannot Remove',
        description: 'The organization owner cannot be removed.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await removeMember(memberId);
      toast({
        title: 'Member Removed',
        description: 'The member has been removed from the organization.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    try {
      await updateMemberRole(memberId, newRole);
      toast({
        title: 'Role Updated',
        description: 'Member role has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  if (!organization || !canManageMembers) return null;

  return (
    <>
      {/* Trigger - either button or menu item style */}
      {asButton ? (
        <Button 
          type="button"
          variant="outline"
          onClick={handleTriggerClick}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite Members
        </Button>
      ) : (
        <button 
          type="button"
          onClick={handleTriggerClick}
          className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left"
        >
          <UserPlus className="h-4 w-4" />
          Invite Members
        </button>
      )}

      {/* Dialog - rendered outside any portal context */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Team Members</DialogTitle>
            <DialogDescription>
              Invite people to collaborate on {organization.name}
            </DialogDescription>
          </DialogHeader>

          {/* Invite Form */}
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="invite-email" className="sr-only">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@company.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
              </Button>
            </div>
          </form>

          {/* Members List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Members ({members.length})
            </Label>
            {members.map((member) => {
              const RoleIcon = roleIcons[member.role];
              const isPending = !member.inviteAcceptedAt && member.invitedEmail;
              
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <RoleIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.invitedEmail || member.userId}
                        {isPending && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Pending
                          </Badge>
                        )}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs capitalize ${roleColors[member.role]}`}
                      >
                        {member.role}
                      </Badge>
                    </div>
                  </div>

                  {member.role !== 'owner' && canManageMembers && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleRoleChange(member.id, v as MemberRole)}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemove(member.id, member.role)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

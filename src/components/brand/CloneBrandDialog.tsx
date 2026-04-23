/**
 * CloneBrandDialog
 *
 * Admin action: clone the current brand into a brand-new organization workspace.
 */

import { useState, useEffect, useMemo } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cloneBrandToNewOrg } from '@/lib/organization/cloneBrandToNewOrg';

interface CloneBrandDialogProps {
  brandId: string;
  brandName: string;
  brandSlug: string;
  /** Optional custom trigger button — defaults to a small outline button */
  trigger?: React.ReactNode;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

export const CloneBrandDialog = ({
  brandId,
  brandName,
  brandSlug,
  trigger,
}: CloneBrandDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const defaultName = useMemo(() => `${brandName}1`, [brandName]);
  const defaultSlug = useMemo(() => slugify(`${brandSlug || brandName}1`), [brandSlug, brandName]);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [orgSlug, setOrgSlug] = useState(defaultSlug);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Reset to defaults when reopened
  useEffect(() => {
    if (open) {
      setName(defaultName);
      setOrgSlug(defaultSlug);
      setIsPublic(true);
    }
  }, [open, defaultName, defaultSlug]);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: 'Sign in required',
        description: 'You must be signed in to clone this brand.',
        variant: 'destructive',
      });
      return;
    }

    const cleanedSlug = slugify(orgSlug);
    if (!name.trim() || !cleanedSlug) {
      toast({
        title: 'Missing info',
        description: 'Please provide a workspace name and URL slug.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await cloneBrandToNewOrg({
        sourceBrandId: brandId,
        newOrgName: name.trim(),
        newOrgSlug: cleanedSlug,
        newBrandSlug: cleanedSlug,
        isPublic,
        userId: user.id,
      });

      toast({
        title: 'Workspace created',
        description: `${name} is ready at /org/${result.newOrgSlug}.`,
      });

      setOpen(false);
      // Navigate to the new portal so the user lands in the cloned workspace
      navigate(`/org/${result.newOrgSlug}`);
    } catch (err: any) {
      console.error('[CloneBrandDialog] Clone failed:', err);
      toast({
        title: 'Clone failed',
        description: err?.message || 'Could not clone brand to a new workspace.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clone to New Workspace</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone brand to a new workspace</DialogTitle>
          <DialogDescription>
            Creates a brand-new organization with a full deep-copy of <strong>{brandName}</strong>.
            Linked products, events and shared booths are not copied — the new brand stands on its own.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="clone-org-name">Workspace name</Label>
            <Input
              id="clone-org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TransPerfect1"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clone-org-slug">Workspace URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">/org/</span>
              <Input
                id="clone-org-slug"
                value={orgSlug}
                onChange={(e) => setOrgSlug(slugify(e.target.value))}
                placeholder="transperfect1"
                disabled={submitting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used for both the workspace URL and the cloned brand slug.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="clone-public" className="text-sm font-medium">
                Publish immediately
              </Label>
              <p className="text-xs text-muted-foreground">
                When on, the cloned brand is visible on its public portal right away.
              </p>
            </div>
            <Switch
              id="clone-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cloning…
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Clone Brand
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

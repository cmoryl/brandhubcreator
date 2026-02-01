import { useState } from 'react';
import { Share2, Copy, Check, Link2, Mail, Globe, Lock, Linkedin, Facebook, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useShareBrand } from '@/hooks/useShareBrand';

interface ShareButtonProps {
  guideId: string;
  guideName: string;
  guideSlug?: string;
  type: 'brand' | 'product' | 'event';
  isPublic?: boolean;
  onPublicChange?: (isPublic: boolean) => void;
  canEdit?: boolean;
  organizationSlug?: string;
}

export const ShareButton = ({ 
  guideId, 
  guideName,
  guideSlug,
  type, 
  isPublic = false, 
  onPublicChange,
  canEdit = false,
  organizationSlug
}: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isSharing, generateShareLink } = useShareBrand();

  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    // Use slug if available, otherwise fall back to ID
    const identifier = guideSlug || guideId;
    return `${baseUrl}/${type}/${identifier}`;
  };

  const getPortalUrl = () => {
    if (!organizationSlug) return null;
    return `${window.location.origin}/org/${organizationSlug}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out ${guideName} ${type} guide`);
    const body = encodeURIComponent(`I wanted to share this ${type} guide with you:\n\n${getShareUrl()}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`Check out the ${guideName} ${type} guide`);
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handlePublicToggle = async (checked: boolean) => {
    if (onPublicChange && !isUpdating) {
      setIsUpdating(true);
      try {
        onPublicChange(checked);
        // Give debounced update time to sync before showing success
        await new Promise(resolve => setTimeout(resolve, 600));
        toast.success(checked ? `${type === 'brand' ? 'Brand' : 'Product'} is now public` : `${type === 'brand' ? 'Brand' : 'Product'} is now private`);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const portalUrl = getPortalUrl();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {isPublic ? (
            <Globe className="h-4 w-4 text-green-500" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="hidden sm:inline">Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Public Toggle - Only show if canEdit */}
        {canEdit && onPublicChange && (
          <>
            <div className="px-3 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPublic ? (
                    <Globe className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="public-toggle" className="text-sm font-medium cursor-pointer">
                    {isPublic ? 'Public' : 'Private'}
                  </Label>
                </div>
                <Switch 
                  id="public-toggle" 
                  checked={isPublic} 
                  onCheckedChange={handlePublicToggle}
                  disabled={isUpdating}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {isPublic 
                  ? `Anyone with the link can view this ${type}`
                  : `Only your organization can view this ${type}`
                }
              </p>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Share Link Section */}
        <div className="px-3 py-3">
          <p className="text-xs font-medium text-foreground mb-2">
            Share this {type} guide
            {!isPublic && (
              <span className="text-amber-500 ml-1">(Private)</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Input 
              value={getShareUrl()} 
              readOnly 
              className="text-xs h-8 bg-muted"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-8 px-2 shrink-0"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Portal Link (if org) */}
        {portalUrl && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1">Organization Portal</p>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs">
                <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{portalUrl}</span>
              </div>
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        
        {/* Share Options */}
        <div className="px-1 py-1">
          <p className="text-xs text-muted-foreground px-2 mb-1">Share via</p>
        </div>
        <DropdownMenuItem onClick={handleEmailShare} className="gap-2">
          <Mail className="h-4 w-4" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitterShare} className="gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLinkedInShare} className="gap-2">
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookShare} className="gap-2">
          <Facebook className="h-4 w-4" />
          Facebook
        </DropdownMenuItem>

        {/* Share to External Apps (Brand only) */}
        {type === 'brand' && canEdit && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-foreground mb-2">
                Share to External Apps
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Generate a link to import this brand into EventKIT or other apps.
              </p>
              <Button 
                size="sm" 
                variant="secondary" 
                className="w-full gap-2"
                onClick={() => generateShareLink(guideId)}
                disabled={isSharing}
              >
                <ExternalLink className="h-4 w-4" />
                {isSharing ? 'Generating...' : 'Generate Import Link'}
              </Button>
            </div>
          </>
        )}

        {/* Status Info */}
        {!isPublic && !canEdit && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This {type} is private. Only organization members can view it.
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

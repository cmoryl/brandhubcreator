import { useState } from 'react';
import { Share2, Copy, Check, Link2, Mail, Twitter, Globe, Lock } from 'lucide-react';
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

interface ShareButtonProps {
  guideId: string;
  guideName: string;
  type: 'brand' | 'product';
  isPublic?: boolean;
  onPublicChange?: (isPublic: boolean) => void;
  canEdit?: boolean;
}

export const ShareButton = ({ 
  guideId, 
  guideName, 
  type, 
  isPublic = false, 
  onPublicChange,
  canEdit = false 
}: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${type}/${guideId}`;
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

  const handlePublicToggle = (checked: boolean) => {
    if (onPublicChange) {
      onPublicChange(checked);
      toast.success(checked ? 'Brand is now public' : 'Brand is now private');
    }
  };

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
      <DropdownMenuContent align="end" className="w-64">
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
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {isPublic 
                  ? 'Anyone with the link can view this ' + type
                  : 'Only your organization can view this ' + type
                }
              </p>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground mb-1">
            Share this {type} guide
            {!isPublic && !canEdit && (
              <span className="text-amber-500 ml-1">(Private - org members only)</span>
            )}
          </p>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs truncate flex-1">{getShareUrl()}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy link'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmailShare} className="gap-2">
          <Mail className="h-4 w-4" />
          Share via email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitterShare} className="gap-2">
          <Twitter className="h-4 w-4" />
          Share on Twitter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { safeUUID } from '@/lib/safeUUID';

const getShareBaseUrl = (): string => {
  const origin = window.location.origin;
  if (origin.includes('lovableproject.com') || origin.includes('id-preview--')) {
    return 'https://brandhubcreator.lovable.app';
  }
  return origin;
};

export function useShareBrand() {
  const [isSharing, setIsSharing] = useState(false);

  const generateShareLink = async (brandId: string): Promise<string | null> => {
    setIsSharing(true);
    try {
      const shareToken = safeUUID();
      
      // Update brand with share token - no need for .select() since we have the token
      const { error } = await supabase
        .from('brands')
        .update({ share_token: shareToken, is_public: true })
        .eq('id', brandId);

      if (error) {
        toast.error('Failed to generate share link');
        return null;
      }

      const shareUrl = `${getShareBaseUrl()}/share/${shareToken}`;
      
      // Copy to clipboard with fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard!');
      } catch {
        toast.success(`Share link: ${shareUrl}`, { duration: 10000 });
      }
      
      return shareUrl;
    } catch {
      toast.error('Failed to share brand');
      return null;
    } finally {
      setIsSharing(false);
    }
  };

  const revokeShareLink = async (brandId: string): Promise<boolean> => {
    setIsSharing(true);
    try {
      const { error } = await supabase
        .from('brands')
        .update({ share_token: null, is_public: false })
        .eq('id', brandId);

      if (error) {
        toast.error('Failed to revoke share link');
        return false;
      }

      toast.success('Share link revoked');
      return true;
    } catch {
      toast.error('Failed to revoke share link');
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  return {
    isSharing,
    generateShareLink,
    revokeShareLink
  };
}

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { safeUUID } from '@/lib/safeUUID';

const getShareBaseUrl = (): string => {
  // In Lovable previews, window.location.origin is a preview domain.
  // External apps should always get the published URL.
  const origin = window.location.origin;
  if (origin.includes('lovableproject.com') || origin.includes('id-preview--')) {
    return 'https://brandhubcreator.lovable.app';
  }
  return origin;
};

export function useShareBrand() {
  const [isSharing, setIsSharing] = useState(false);

  const generateShareLink = async (brandId: string): Promise<string | null> => {
    console.log('[useShareBrand] Starting generateShareLink for brandId:', brandId);
    setIsSharing(true);
    try {
      // Generate a unique share token
      const shareToken = safeUUID();
      console.log('[useShareBrand] Generated share token:', shareToken);
      
      // Update the brand with the share token and set it to public
      const { data, error } = await supabase
        .from('brands')
        .update({ 
          share_token: shareToken,
          is_public: true 
        })
        .eq('id', brandId)
        .select();

      console.log('[useShareBrand] Supabase update result:', { data, error });

      if (error) {
        console.error('[useShareBrand] Error generating share link:', error);
        toast.error('Failed to generate share link: ' + error.message);
        return null;
      }

      // Build the share URL
      const shareUrl = `${getShareBaseUrl()}/share/${shareToken}`;
      console.log('[useShareBrand] Share URL:', shareUrl);
      
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard!');
      } catch (clipboardError) {
        console.error('[useShareBrand] Clipboard error:', clipboardError);
        // Fallback: show the URL in a toast
        toast.success(`Share link: ${shareUrl}`, { duration: 10000 });
      }
      
      return shareUrl;
    } catch (error) {
      console.error('[useShareBrand] Error sharing brand:', error);
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
        .update({ 
          share_token: null,
          is_public: false 
        })
        .eq('id', brandId);

      if (error) {
        console.error('Error revoking share link:', error);
        toast.error('Failed to revoke share link');
        return false;
      }

      toast.success('Share link revoked');
      return true;
    } catch (error) {
      console.error('Error revoking share:', error);
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

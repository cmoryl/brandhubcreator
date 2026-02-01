import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { safeUUID } from '@/lib/safeUUID';

export function useShareBrand() {
  const [isSharing, setIsSharing] = useState(false);

  const generateShareLink = async (brandId: string): Promise<string | null> => {
    setIsSharing(true);
    try {
      // Generate a unique share token
      const shareToken = safeUUID();
      
      // Update the brand with the share token and set it to public
      const { error } = await supabase
        .from('brands')
        .update({ 
          share_token: shareToken,
          is_public: true 
        })
        .eq('id', brandId);

      if (error) {
        console.error('Error generating share link:', error);
        toast.error('Failed to generate share link');
        return null;
      }

      // Build the share URL
      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
      
      return shareUrl;
    } catch (error) {
      console.error('Error sharing brand:', error);
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

/**
 * GlobalLinkUniversePage - Standalone page for the GlobalLink Universe visualization
 * Shareable link: /product/globallink/universe
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GlobalLinkUniverseSection } from '@/components/brand/GlobalLinkUniverseSection';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface LinkedGuide {
  id: string;
  name?: string;
  slug?: string;
  type?: string;
}

const GlobalLinkUniversePage: React.FC = () => {
  const navigate = useNavigate();
  const [linkedGuides, setLinkedGuides] = useState<LinkedGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalLinkData = async () => {
      try {
        // Use public RPC function for anonymous access
        const { data, error: fetchError } = await supabase
          .rpc('get_public_product_data', { p_slug: 'globallink' });

        if (fetchError) throw fetchError;

        const product = Array.isArray(data) ? data[0] : data;
        if (!product) {
          throw new Error('Product not found');
        }

        const guideData = product.guide_data as Record<string, unknown> | null;
        const guides = (guideData?.linkedGuides as LinkedGuide[]) || [];
        setLinkedGuides(guides);
      } catch (err) {
        console.error('Error fetching GlobalLink data:', err);
        setError('Unable to load GlobalLink Universe data');
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalLinkData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => navigate('/product/globallink')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to GlobalLink
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/product/globallink')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to GlobalLink</span>
          </Button>
          
          <h1 className="text-lg font-semibold text-foreground">
            GlobalLink Universe
          </h1>
          
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main content */}
      <main className="py-8">
        <GlobalLinkUniverseSection 
          linkedGuides={linkedGuides}
          primaryColor="#6366f1"
          className="min-h-[80vh]"
          showShareButton={false}
        />
      </main>
    </div>
  );
};

export default GlobalLinkUniversePage;

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Image as ImageIcon, Download, RefreshCw, Loader2, Sparkles,
  ChevronDown, Upload, X, Check, Layers, Languages, Zap, FileArchive, Eye, ArrowLeft, 
  ShieldCheck, MessageSquare, Save, Bookmark
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { useAdLocalizer } from '@/hooks/useAdLocalizer';
import AdLocalizerMarketPanel from '@/components/ad-localizer/AdLocalizerMarketPanel';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const ASPECT_RATIOS = [
  { label: '16:9', value: '16:9' },
  { label: '1:1', value: '1:1' },
  { label: '9:16', value: '9:16' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
];

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Djibouti', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guinea', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Libya',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malaysia', 'Mali', 'Malta', 'Mexico',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria',
  'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Panama', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia',
  'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Sweden',
  'Switzerland', 'Syria', 'Taiwan', 'Tanzania', 'Thailand', 'Tunisia', 'Turkey',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

export default function AdLocalizerPage() {
  const navigate = useNavigate();
  const { 
    analysis, isAnalyzing, results, isGenerating, brandContext,
    analyzeImage, generateForMarkets, generateCaption, runComplianceCheck, 
    saveAsset, loadBrandContext, reset, setResults 
  } = useAdLocalizer();

  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [uploadedReference, setUploadedReference] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [activeCountryIndex, setActiveCountryIndex] = useState(-1);
  const [culturalAdaptation, setCulturalAdaptation] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');
  const [activeComparisonIndex, setActiveComparisonIndex] = useState(0);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load available brands
  useEffect(() => {
    const loadBrands = async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');
      if (data) setBrands(data);
    };
    loadBrands();
  }, []);

  // Load brand context when selected
  useEffect(() => {
    if (selectedBrandId) {
      loadBrandContext(selectedBrandId);
    }
  }, [selectedBrandId, loadBrandContext]);

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase()) && !selectedMarkets.includes(c)
  );

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadedReference(base64);
        reset();
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedReference || selectedMarkets.length === 0) return;
    await generateForMarkets(selectedMarkets, uploadedReference, aspectRatio, culturalAdaptation, analysis);
  };

  const handleExportZip = async () => {
    if (results.length === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('localized_assets');
      results.forEach((res) => {
        if (res.image) {
          folder?.file(`${res.market.toLowerCase().replace(/\s+/g, '_')}.jpg`, res.image, { base64: true });
        }
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `global_kit_${Date.now()}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export complete');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setSelectedMarkets([]);
    setUploadedReference(null);
    setCountrySearch('');
    reset();
  };

  const addMarket = (country: string) => {
    setSelectedMarkets(prev => [...prev, country]);
    setCountrySearch('');
    setActiveCountryIndex(-1);
  };

  const removeMarket = (country: string) => {
    setSelectedMarkets(prev => prev.filter(c => c !== country));
  };

  const handleCountryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveCountryIndex(prev => Math.min(prev + 1, filteredCountries.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveCountryIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeCountryIndex >= 0) {
      e.preventDefault();
      addMarket(filteredCountries[activeCountryIndex]);
    }
  };

  const completedCount = results.filter(r => !r.loading && r.image).length;
  const canGenerate = uploadedReference && selectedMarkets.length > 0 && !isGenerating;

  return (
    <main className="flex flex-col lg:flex-row min-h-screen bg-muted/30 text-foreground font-sans">
      {/* Left Sidebar */}
      <div className="w-full lg:w-[400px] xl:w-[450px] border-r border-border bg-card p-6 lg:p-8 flex flex-col h-screen overflow-hidden sticky top-0">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-1">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Global Kit</h1>
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Social Ad Localizer</p>
          </div>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto pr-2">
          {/* Step 1: Upload */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">01. Master Concept</label>
              {uploadedReference && (
                <button onClick={() => { setUploadedReference(null); reset(); }} className="text-[10px] font-bold text-destructive hover:underline">Clear</button>
              )}
            </div>

            {uploadedReference ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group rounded-2xl overflow-hidden border border-border bg-muted"
              >
                <img src={`data:image/jpeg;base64,${uploadedReference}`} className="w-full aspect-video object-cover" alt="Master concept" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Analyzing</p>
                    </div>
                  </div>
                )}
                {analysis && !isAnalyzing && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-1">Detected</p>
                    <p className="text-[10px] text-white/90 line-clamp-2">
                      {analysis.text.length > 0 ? analysis.text.join(' · ') : 'No text detected'}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <label className="block border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all group">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Drop or browse</p>
                <p className="text-[9px] text-muted-foreground/60 mt-1">JPG, PNG, WebP</p>
              </label>
            )}
          </section>

          {/* Step 2: Markets */}
          <section>
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground block mb-4">02. Target Markets</label>
            <div ref={dropdownRef} className="relative">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search markets..."
                  value={countrySearch}
                  onChange={(e) => { setCountrySearch(e.target.value); setShowCountryDropdown(true); setActiveCountryIndex(-1); }}
                  onFocus={() => setShowCountryDropdown(true)}
                  onKeyDown={handleCountryKeyDown}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              </div>

              <AnimatePresence>
                {showCountryDropdown && filteredCountries.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto"
                  >
                    {filteredCountries.slice(0, 50).map((c, idx) => (
                      <button
                        key={c}
                        onClick={() => addMarket(c)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${
                          activeCountryIndex === idx ? 'bg-accent' : ''
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {selectedMarkets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedMarkets.map(m => (
                  <motion.span
                    key={m}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider"
                  >
                    {m}
                    <button onClick={() => removeMarket(m)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </div>
            )}
          </section>

          {/* Step 3: Brand Context */}
          <section>
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground block mb-4">03. Brand Context</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search brands..."
                value={brandSearchQuery}
                onChange={(e) => setBrandSearchQuery(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
              {brandSearchQuery && filteredBrands.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-xl shadow-xl max-h-36 overflow-y-auto">
                  {filteredBrands.slice(0, 10).map(b => (
                    <button
                      key={b.id}
                      onClick={() => { setSelectedBrandId(b.id); setBrandSearchQuery(''); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {brandContext && (
              <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{brandContext.brandName}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {[brandContext.archetype, brandContext.industry].filter(Boolean).join(' · ') || 'Brand loaded'}
                    </p>
                  </div>
                  <button onClick={() => { setSelectedBrandId(''); }} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {brandContext.colors && brandContext.colors.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {brandContext.colors.slice(0, 6).map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c.hex }} title={c.name} />
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="text-[9px] text-muted-foreground/60 mt-2">Optional — enriches prompts with brand identity & enables compliance, captions, and saving.</p>
          </section>

          {/* Step 4: Settings */}
          <section>
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground block mb-4">04. Configuration</label>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Aspect Ratio</p>
                <div className="flex gap-1.5">
                  {ASPECT_RATIOS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        aspectRatio === r.value
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setCulturalAdaptation(!culturalAdaptation)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  culturalAdaptation
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  culturalAdaptation ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                }`}>
                  {culturalAdaptation && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold">Cultural Adaptation</p>
                  <p className="text-[10px] text-muted-foreground">GlobalLink-powered visual & text adaptation</p>
                </div>
              </button>
            </div>
          </section>

          {/* Bulk Actions (post-generation) */}
          {results.some(r => r.image) && brandContext && (
            <section>
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground block mb-3">Bulk Actions</label>
              <div className="space-y-2">
                <button
                  onClick={() => results.filter(r => r.image && !r.compliance).forEach(r => runComplianceCheck(r.market))}
                  className="w-full flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] font-bold">Run All Compliance</p>
                    <p className="text-[9px] text-muted-foreground">DataForce brand compliance scan</p>
                  </div>
                </button>
                <button
                  onClick={() => results.filter(r => r.image && !r.caption).forEach(r => generateCaption(r.market))}
                  className="w-full flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] font-bold">Generate All Captions</p>
                    <p className="text-[9px] text-muted-foreground">GenAI platform-specific copy</p>
                  </div>
                </button>
                <button
                  onClick={() => results.filter(r => r.image && !r.saved).forEach(r => saveAsset(r.market))}
                  className="w-full flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <Save className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] font-bold">Save All to Library</p>
                    <p className="text-[9px] text-muted-foreground">Persist assets + audit trail</p>
                  </div>
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Generate Button */}
        <div className="pt-6 mt-auto border-t border-border">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
              canGenerate
                ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                Localizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Kit
              </>
            )}
          </button>
          <p className="text-[9px] text-center text-muted-foreground/60 mt-4 uppercase tracking-widest">Powered by GlobalLink + Gemini 3.1 Flash</p>
        </div>
      </div>

      {/* Right Content - Results */}
      <div className="flex-1 flex flex-col bg-background h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-6">
            {results.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {completedCount}/{results.length} Complete
                </p>
                <div className="flex bg-muted rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                      viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('comparison')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                      viewMode === 'comparison' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    Compare
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {results.some(r => r.image) && (
              <button
                onClick={handleExportZip}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all"
              >
                {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileArchive className="w-3 h-3" />}
                Export ZIP
              </button>
            )}
            {(uploadedReference || results.length > 0) && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </header>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {results.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {results.map((res, idx) => (
                    <motion.div
                      key={res.market}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{res.market}</span>
                        {res.image && (
                          <a
                            href={`data:image/jpeg;base64,${res.image}`}
                            download={`${res.market.toLowerCase().replace(/\s+/g, '_')}.jpg`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </div>

                      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        {res.loading ? (
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/30" />
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Processing</p>
                          </div>
                        ) : res.error ? (
                          <div className="p-6 text-center">
                            <X className="w-6 h-6 text-destructive mx-auto mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">{res.error}</p>
                          </div>
                        ) : (
                          <motion.img
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            src={`data:image/jpeg;base64,${res.image}`}
                            alt={res.market}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        )}
                      </div>

                      {/* GlobalLink Cultural Insights */}
                      {res.culturalInsights && (
                        <div className="p-3 border-t border-border bg-muted/30">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Globe className="w-3 h-3 text-primary" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">GlobalLink Insights</span>
                          </div>
                          <div className="space-y-1">
                            {res.culturalInsights.color_notes && (
                              <p className="text-[9px] text-muted-foreground line-clamp-2">
                                <span className="font-semibold text-foreground">Colors:</span> {res.culturalInsights.color_notes}
                              </p>
                            )}
                            {res.culturalInsights.imagery_notes && (
                              <p className="text-[9px] text-muted-foreground line-clamp-2">
                                <span className="font-semibold text-foreground">Imagery:</span> {res.culturalInsights.imagery_notes}
                              </p>
                            )}
                            {res.culturalInsights.taboos && (
                              <p className="text-[9px] text-muted-foreground line-clamp-2">
                                <span className="font-semibold text-foreground">Avoid:</span> {res.culturalInsights.taboos}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {res.insightsLoading && (
                        <div className="p-3 border-t border-border bg-muted/30 flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Loading GlobalLink insights...</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* Comparison Mode */
              <div className="h-full flex flex-col gap-8">
                <div className="flex-1 grid grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Master Concept</p>
                    <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-2xl shadow-black/5">
                      <img src={`data:image/jpeg;base64,${uploadedReference}`} className="w-full aspect-square object-cover" alt="Master" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Localized: {results[activeComparisonIndex]?.market}
                      </p>
                      <div className="flex gap-1">
                        {results.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveComparisonIndex(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              activeComparisonIndex === idx ? 'bg-primary w-4' : 'bg-muted-foreground/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-2xl shadow-black/5 relative aspect-square flex items-center justify-center">
                      {results[activeComparisonIndex]?.loading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/30" />
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Processing</p>
                        </div>
                      ) : results[activeComparisonIndex]?.image ? (
                        <motion.img
                          key={activeComparisonIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          src={`data:image/jpeg;base64,${results[activeComparisonIndex].image}`}
                          className="w-full h-full object-cover"
                          alt="Localized"
                        />
                      ) : (
                        <div className="text-center p-8">
                          <ImageIcon className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                          <p className="text-xs text-muted-foreground">Select a market to compare</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4">
                  {results.map((res, idx) => (
                    <button
                      key={res.market}
                      onClick={() => setActiveComparisonIndex(idx)}
                      className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                        activeComparisonIndex === idx ? 'border-primary scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                    >
                      {res.image ? (
                        <img src={`data:image/jpeg;base64,${res.image}`} className="w-full h-full object-cover" alt={res.market} />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Globe className="w-4 h-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-card rounded-3xl shadow-2xl shadow-black/5 flex items-center justify-center mb-8 border border-border">
                <Layers className="w-8 h-8 text-muted-foreground/20" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-3">Scale your vision.</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                Upload your master creative and select target markets. Our AI engine will generate pixel-perfect localized assets in seconds.
              </p>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-card rounded-2xl border border-border text-left">
                  <Languages className="w-5 h-5 mb-3 text-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Translation</p>
                  <p className="text-[10px] text-muted-foreground">Context-aware text localization</p>
                </div>
                <div className="p-4 bg-card rounded-2xl border border-border text-left">
                  <Sparkles className="w-5 h-5 mb-3 text-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Adaptation</p>
                  <p className="text-[10px] text-muted-foreground">Cultural visual refinement</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
